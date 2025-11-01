import axios, { AxiosInstance } from 'axios';
import { Card, UserInfo, CardCollection, FilterData } from '../types';
import { CacheService, CacheMetadata } from './cacheService';

export class AlteredApiService {
  private client: AxiosInstance;
  private cacheService: CacheService;

  constructor(baseURL: string, authToken: string, cacheDir?: string, cacheTTL?: number) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'accept': '*/*',
        'accept-language': 'fr-fr',
        'authorization': `Bearer ${authToken}`,
        'origin': 'https://www.altered.gg',
        'referer': 'https://www.altered.gg/',
      },
    });
    this.cacheService = new CacheService(cacheDir, cacheTTL);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;

        // Don't retry on 4xx errors (except 429)
        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.log(`[retryRequest] Attempt ${attempt} failed (${status || 'network error'}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    throw lastError;
  }

  async getUserInfo(): Promise<UserInfo> {
    return this.retryRequest(async () => {
      const response = await this.client.get('/me');
      return response.data;
    });
  }

  async getCards(params: {
    collection?: boolean;
    itemsPerPage?: number;
    page?: number;
    locale?: string;
  } = {}): Promise<CardCollection> {
    const defaultParams = {
      collection: true,
      itemsPerPage: 36,
      page: 1,
      locale: 'fr-fr',
      ...params,
    };

    const response = await this.client.get('/cards', { params: defaultParams });
    const data = response.data;

    // Handle different response structures
    if (Array.isArray(data)) {
      return {
        cards: data,
        totalItems: data.length,
        itemsPerPage: params.itemsPerPage || 36,
        page: params.page || 1,
      };
    }

    // Handle hydra format
    if (data['hydra:member']) {
      return {
        cards: data['hydra:member'],
        totalItems: data['hydra:totalItems'] || data['hydra:member'].length,
        itemsPerPage: params.itemsPerPage || 36,
        page: params.page || 1,
      };
    }

    // Handle standard format
    return data;
  }

  async getAllCards(locale: string = 'fr-fr'): Promise<Card[]> {
    // Fetch ALL card details - omit collection parameter entirely
    const cardsPromise = this.fetchAllPages('/cards', {
      itemsPerPage: 100,
      locale,
    });

    // Fetch card stats for collection counts - keep collection to get stats for all cards
    const statsPromise = this.fetchAllPages('/cards/stats', {
      itemsPerPage: 100,
      locale,
    });

    const [cards, stats] = await Promise.all([cardsPromise, statsPromise]);

    // Merge stats into cards
    const statsMap = new Map();
    for (const stat of stats) {
      const cardId = stat['@id'];
      statsMap.set(cardId, stat);
    }

    const enrichedCards = cards.map((card: any) => {
      const cardStat = statsMap.get(card['@id']);
      const collectionCount = cardStat?.inMyCollection;
      const lowerPrice = cardStat?.lowerPrice;
      return {
        ...card,
        collectionCount: collectionCount === '∞' ? Infinity : (typeof collectionCount === 'number' ? collectionCount : 0),
        lowerPrice: typeof lowerPrice === 'number' ? lowerPrice : undefined,
      };
    });

    return enrichedCards;
  }

  private async fetchAllPages(endpoint: string, baseParams: any): Promise<any[]> {
    const locale = baseParams.locale || 'fr-fr';

    // Try to load from checkpoint
    const checkpoint = this.cacheService.loadCheckpoint(endpoint, locale);
    let allItems: any[] = checkpoint ? checkpoint.data : [];
    let page = checkpoint ? checkpoint.metadata.completedPages + 1 : 1;
    let totalPages = checkpoint ? checkpoint.metadata.totalPages : 0;

    if (checkpoint && this.cacheService.isCacheComplete(endpoint, locale)) {
      console.log(`[fetchAllPages] Using complete cache for ${endpoint}`);
      return allItems;
    }

    if (checkpoint) {
      console.log(`[fetchAllPages] Resuming from checkpoint: page ${page} of ${totalPages}`);
    } else {
      console.log(`[fetchAllPages] Starting fresh fetch for ${endpoint}`);
    }

    let hasMore = true;

    try {
      while (hasMore) {
        console.log(`[fetchAllPages] Fetching page ${page}...`);

        const response = await this.retryRequest(async () => {
          return await this.client.get(endpoint, {
            params: { ...baseParams, page },
          });
        });

        const data = response.data;
        const items = data['hydra:member'] || data.cards || data;

        if (!Array.isArray(items)) {
          throw new Error('Invalid response format: items array not found');
        }

        allItems.push(...items);
        console.log(`[fetchAllPages] Page ${page}: got ${items.length} items, total so far: ${allItems.length}`);

        const totalItems = data['hydra:totalItems'] || data.totalItems;
        totalPages = Math.ceil(totalItems / (baseParams.itemsPerPage || 36));
        console.log(`[fetchAllPages] Total items in API: ${totalItems} (${totalPages} pages)`);

        // Save checkpoint after each page
        const metadata: CacheMetadata = {
          timestamp: Date.now(),
          totalPages,
          completedPages: page,
          endpoint,
          locale,
        };
        this.cacheService.saveCheckpoint(endpoint, locale, allItems, metadata);

        // Continue if we haven't fetched all items yet
        if (items.length === 0 || allItems.length >= totalItems) {
          hasMore = false;
          console.log(`[fetchAllPages] Finished: ${allItems.length} items fetched`);
        } else {
          page++;
          // Add delay between pages to avoid rate limiting
          await this.sleep(500); // 500ms delay between pages
        }
      }
    } catch (error) {
      console.error(`[fetchAllPages] Error occurred at page ${page}, data saved to checkpoint`);
      throw error;
    }

    return allItems;
  }

  async getFilterData(locale: string = 'fr-fr'): Promise<FilterData> {
    return this.retryRequest(async () => {
      const response = await this.client.get('/cards/filter-data', {
        params: { locale },
      });
      return response.data;
    });
  }

  async getZendeskJWT(): Promise<string> {
    return this.retryRequest(async () => {
      const response = await this.client.get('/user/zendesk/jwt');
      return response.data;
    });
  }

  clearCache(endpoint?: string, locale?: string): void {
    if (endpoint && locale) {
      this.cacheService.clearCache(endpoint, locale);
    } else {
      this.cacheService.clearAllCache();
    }
  }
}