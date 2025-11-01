import { Card, MissingCard } from '../types';

export class CardAnalyzer {
  private readonly TARGET_COUNT = 3;

  analyzeMissingCards(cards: Card[]): MissingCard[] {
    const missingCards: MissingCard[] = [];

    for (const card of cards) {
      const owned = card.collectionCount || card.ownership || 0;

      if (owned < this.TARGET_COUNT) {
        const missing = this.TARGET_COUNT - owned;
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

  groupByRarity(missingCards: MissingCard[]): Record<string, MissingCard[]> {
    return missingCards.reduce((acc, card) => {
      if (!acc[card.rarity]) {
        acc[card.rarity] = [];
      }
      acc[card.rarity].push(card);
      return acc;
    }, {} as Record<string, MissingCard[]>);
  }

  groupByFaction(missingCards: MissingCard[]): Record<string, MissingCard[]> {
    return missingCards.reduce((acc, card) => {
      if (!acc[card.faction]) {
        acc[card.faction] = [];
      }
      acc[card.faction].push(card);
      return acc;
    }, {} as Record<string, MissingCard[]>);
  }

  getStatistics(missingCards: MissingCard[]) {
    const totalMissing = missingCards.reduce((sum, card) => sum + card.missing, 0);
    const totalCost = missingCards.reduce((sum, card) => sum + (card.totalCost || 0), 0);
    const cardsWithPrice = missingCards.filter(card => card.lowerPrice !== undefined).length;
    const byRarity = this.groupByRarity(missingCards);
    const byFaction = this.groupByFaction(missingCards);

    const rarityStats = Object.entries(byRarity).map(([rarity, cards]) => ({
      rarity,
      uniqueCards: cards.length,
      totalMissing: cards.reduce((sum, card) => sum + card.missing, 0),
      totalCost: cards.reduce((sum, card) => sum + (card.totalCost || 0), 0),
    }));

    const factionStats = Object.entries(byFaction).map(([faction, cards]) => ({
      faction,
      uniqueCards: cards.length,
      totalMissing: cards.reduce((sum, card) => sum + card.missing, 0),
      totalCost: cards.reduce((sum, card) => sum + (card.totalCost || 0), 0),
    }));

    return {
      totalUniqueCardsMissing: missingCards.length,
      totalCardsMissing: totalMissing,
      totalCostEstimated: totalCost,
      cardsWithPrice,
      byRarity: rarityStats,
      byFaction: factionStats,
    };
  }
}