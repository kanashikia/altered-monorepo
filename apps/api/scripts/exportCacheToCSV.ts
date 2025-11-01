import fs from 'fs';
import path from 'path';

interface Card {
  reference: string;
  name: string;
  rarity: {
    name: string;
    reference: string;
  };
  mainFaction: {
    name: string;
    reference: string;
  };
  collectionCount?: number;
  lowerPrice?: number;
  [key: string]: any;
}

interface MissingCard {
  reference: string;
  name: string;
  rarity: string;
  faction: string;
  owned: number;
  missing: number;
  lowerPrice?: number;
  totalCost?: number;
}

const TARGET_COUNT = 3;

function analyzeMissingCards(cards: Card[]): MissingCard[] {
  const missingCards: MissingCard[] = [];

  for (const card of cards) {
    const owned = card.collectionCount || 0;

    if (owned < TARGET_COUNT) {
      const missing = TARGET_COUNT - owned;
      const lowerPrice = card.lowerPrice;
      const totalCost = lowerPrice !== undefined ? lowerPrice * missing : undefined;

      missingCards.push({
        reference: card.reference,
        name: card.name,
        rarity: card.rarity?.name || card.rarity?.reference || 'Unknown',
        faction: card.mainFaction?.name || card.mainFaction?.reference || 'Unknown',
        owned,
        missing,
        lowerPrice,
        totalCost,
      });
    }
  }

  return missingCards;
}

function exportToCSV(missingCards: MissingCard[]): string {
  const headers = ['Reference', 'Nom', 'Rareté', 'Faction', 'Possédées', 'Manquantes', 'Prix unitaire (€)', 'Coût total (€)'];
  const rows = missingCards.map(card => [
    card.reference,
    card.name,
    card.rarity,
    card.faction,
    card.owned.toString(),
    card.missing.toString(),
    card.lowerPrice !== undefined ? card.lowerPrice.toFixed(2) : 'N/A',
    card.totalCost !== undefined ? card.totalCost.toFixed(2) : 'N/A',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

async function main() {
  const cacheDir = path.join(__dirname, '..', 'cache');
  const cardsDataPath = path.join(cacheDir, '_cards_fr-fr_data.json');
  const statsDataPath = path.join(cacheDir, '_cards_stats_fr-fr_data.json');
  const outputPath = path.join(__dirname, '..', 'missing_cards_from_cache.csv');

  // Check if cache files exist
  if (!fs.existsSync(cardsDataPath)) {
    console.error(`❌ Cache file not found: ${cardsDataPath}`);
    console.log('Run the API first to populate the cache.');
    process.exit(1);
  }

  console.log('📖 Reading cache files...');

  // Read cards data
  const cardsData = JSON.parse(fs.readFileSync(cardsDataPath, 'utf-8')) as Card[];
  console.log(`✅ Loaded ${cardsData.length} cards from cache`);

  // Read stats data if available
  let statsData: any[] = [];
  if (fs.existsSync(statsDataPath)) {
    statsData = JSON.parse(fs.readFileSync(statsDataPath, 'utf-8'));
    console.log(`✅ Loaded ${statsData.length} card stats from cache`);

    // Merge stats into cards
    const statsMap = new Map();
    for (const stat of statsData) {
      const cardId = stat['@id'];
      statsMap.set(cardId, stat);
    }

    // Enrich cards with stats
    for (const card of cardsData) {
      const cardStat = statsMap.get(card['@id']);
      if (cardStat) {
        const collectionCount = cardStat.inMyCollection;
        const lowerPrice = cardStat.lowerPrice;
        card.collectionCount = collectionCount === '∞' ? Infinity : (typeof collectionCount === 'number' ? collectionCount : 0);
        card.lowerPrice = typeof lowerPrice === 'number' ? lowerPrice : undefined;
      }
    }
    console.log('✅ Merged price data into cards');
  } else {
    console.warn('⚠️  Stats cache not found, prices will not be available');
  }

  // Analyze missing cards
  console.log('🔍 Analyzing missing cards...');
  const missingCards = analyzeMissingCards(cardsData);
  console.log(`✅ Found ${missingCards.length} missing cards`);

  // Calculate statistics
  const totalCost = missingCards.reduce((sum, card) => sum + (card.totalCost || 0), 0);
  const cardsWithPrice = missingCards.filter(card => card.lowerPrice !== undefined).length;

  // Export to CSV
  console.log('📝 Generating CSV...');
  const csvContent = exportToCSV(missingCards);
  fs.writeFileSync(outputPath, csvContent, 'utf-8');

  console.log(`✅ CSV exported successfully to: ${outputPath}`);
  console.log(`📊 Statistics:`);
  console.log(`   - Total unique cards missing: ${missingCards.length}`);
  console.log(`   - Total cards to acquire: ${missingCards.reduce((sum, card) => sum + card.missing, 0)}`);
  console.log(`   - Cards with price: ${cardsWithPrice}/${missingCards.length}`);
  if (cardsWithPrice > 0) {
    console.log(`   - Total estimated cost: ${totalCost.toFixed(2)}€`);
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
