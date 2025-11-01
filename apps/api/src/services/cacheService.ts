import fs from 'fs';
import path from 'path';

export interface CacheMetadata {
  timestamp: number;
  totalPages: number;
  completedPages: number;
  endpoint: string;
  locale: string;
}

export class CacheService {
  private cacheDir: string;
  private cacheTTL: number; // Time to live in milliseconds

  constructor(cacheDir: string = './cache', cacheTTL: number = 24 * 60 * 60 * 1000) { // 24h default
    this.cacheDir = cacheDir;
    this.cacheTTL = cacheTTL;
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      console.log(`[CacheService] Created cache directory: ${this.cacheDir}`);
    }
  }

  private getCacheKey(endpoint: string, locale: string): string {
    return `${endpoint.replace(/\//g, '_')}_${locale}`;
  }

  private getMetadataPath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}_metadata.json`);
  }

  private getDataPath(cacheKey: string): string {
    return path.join(this.cacheDir, `${cacheKey}_data.json`);
  }

  saveCheckpoint(endpoint: string, locale: string, data: any[], metadata: CacheMetadata): void {
    const cacheKey = this.getCacheKey(endpoint, locale);
    const metadataPath = this.getMetadataPath(cacheKey);
    const dataPath = this.getDataPath(cacheKey);

    try {
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`[CacheService] Checkpoint saved: ${cacheKey} - ${metadata.completedPages}/${metadata.totalPages} pages`);
    } catch (error) {
      console.error(`[CacheService] Failed to save checkpoint:`, error);
    }
  }

  loadCheckpoint(endpoint: string, locale: string): { data: any[], metadata: CacheMetadata } | null {
    const cacheKey = this.getCacheKey(endpoint, locale);
    const metadataPath = this.getMetadataPath(cacheKey);
    const dataPath = this.getDataPath(cacheKey);

    if (!fs.existsSync(metadataPath) || !fs.existsSync(dataPath)) {
      console.log(`[CacheService] No checkpoint found for: ${cacheKey}`);
      return null;
    }

    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) as CacheMetadata;

      // Check if cache is expired
      const now = Date.now();
      if (now - metadata.timestamp > this.cacheTTL) {
        console.log(`[CacheService] Cache expired for: ${cacheKey}`);
        this.clearCache(endpoint, locale);
        return null;
      }

      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      console.log(`[CacheService] Checkpoint loaded: ${cacheKey} - ${metadata.completedPages}/${metadata.totalPages} pages`);

      return { data, metadata };
    } catch (error) {
      console.error(`[CacheService] Failed to load checkpoint:`, error);
      return null;
    }
  }

  clearCache(endpoint: string, locale: string): void {
    const cacheKey = this.getCacheKey(endpoint, locale);
    const metadataPath = this.getMetadataPath(cacheKey);
    const dataPath = this.getDataPath(cacheKey);

    try {
      if (fs.existsSync(metadataPath)) fs.unlinkSync(metadataPath);
      if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
      console.log(`[CacheService] Cache cleared for: ${cacheKey}`);
    } catch (error) {
      console.error(`[CacheService] Failed to clear cache:`, error);
    }
  }

  clearAllCache(): void {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
      console.log(`[CacheService] All cache cleared`);
    } catch (error) {
      console.error(`[CacheService] Failed to clear all cache:`, error);
    }
  }

  isCacheComplete(endpoint: string, locale: string): boolean {
    const checkpoint = this.loadCheckpoint(endpoint, locale);
    if (!checkpoint) return false;

    return checkpoint.metadata.completedPages >= checkpoint.metadata.totalPages;
  }
}
