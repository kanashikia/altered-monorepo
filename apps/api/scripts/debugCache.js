const stats = require('../cache/_cards_stats_fr-fr_data.json');
const cards = require('../cache/_cards_fr-fr_data.json');

console.log('First card @id:', cards[0]['@id']);
console.log('First card reference:', cards[0].reference);
console.log('');
console.log('First stat @id:', stats[0]['@id']);
console.log('');

// Try to match
const statsMap = new Map();
for (const stat of stats) {
  const cardId = stat['@id'];
  statsMap.set(cardId, stat);
}

let matches = 0;
let mismatches = 0;

for (const card of cards) {
  const cardStat = statsMap.get(card['@id']);
  if (cardStat) {
    matches++;
  } else {
    mismatches++;
    if (mismatches <= 3) {
      console.log('Mismatch - Card @id:', card['@id'], 'Reference:', card.reference);
    }
  }
}

console.log('');
console.log('Matches:', matches);
console.log('Mismatches:', mismatches);
