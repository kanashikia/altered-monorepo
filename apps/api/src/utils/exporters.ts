import { MissingCard } from '../types';

export class CsvExporter {
  static export(missingCards: MissingCard[]): string {
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
}

export class JsonExporter {
  static export(missingCards: MissingCard[], pretty: boolean = true): string {
    return JSON.stringify(missingCards, null, pretty ? 2 : 0);
  }
}

export class TextExporter {
  static export(missingCards: MissingCard[]): string {
    const lines: string[] = [
      '='.repeat(80),
      'CARTES MANQUANTES - ALTERED TCG',
      '='.repeat(80),
      '',
    ];

    const byFaction = missingCards.reduce((acc, card) => {
      if (!acc[card.faction]) {
        acc[card.faction] = [];
      }
      acc[card.faction].push(card);
      return acc;
    }, {} as Record<string, MissingCard[]>);

    for (const [faction, cards] of Object.entries(byFaction)) {
      lines.push(`\n[${faction}]`);
      lines.push('-'.repeat(80));

      for (const card of cards) {
        const priceInfo = card.lowerPrice !== undefined && card.totalCost !== undefined
          ? ` - Prix: ${card.lowerPrice.toFixed(2)}€/u, Total: ${card.totalCost.toFixed(2)}€`
          : '';
        lines.push(
          `${card.reference.padEnd(15)} ${card.name.padEnd(40)} ${card.rarity.padEnd(12)} (${card.owned}/3) → ${card.missing} manquante(s)${priceInfo}`
        );
      }
    }

    const totalCost = missingCards.reduce((sum, card) => sum + (card.totalCost || 0), 0);
    const cardsWithPrice = missingCards.filter(card => card.lowerPrice !== undefined).length;

    lines.push('');
    lines.push('='.repeat(80));
    lines.push(`Total: ${missingCards.length} cartes uniques manquantes`);
    lines.push(`Total à acquérir: ${missingCards.reduce((sum, card) => sum + card.missing, 0)} cartes`);
    if (cardsWithPrice > 0) {
      lines.push(`Coût total estimé: ${totalCost.toFixed(2)}€ (${cardsWithPrice}/${missingCards.length} cartes avec prix)`);
    }
    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}