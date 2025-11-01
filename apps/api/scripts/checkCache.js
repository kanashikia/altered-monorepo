const stats = require('../cache/_cards_stats_fr-fr_data.json');
const cards = require('../cache/_cards_fr-fr_data.json');

console.log('Total cards:', cards.length);
console.log('Total stats:', stats.length);

const withPrice = stats.filter(s => s.lowerPrice !== undefined && s.lowerPrice > 0);
console.log('Stats with lowerPrice > 0:', withPrice.length);

const withZeroPrice = stats.filter(s => s.lowerPrice === 0);
console.log('Stats with lowerPrice = 0:', withZeroPrice.length);

const withoutPrice = stats.filter(s => s.lowerPrice === undefined);
console.log('Stats without lowerPrice:', withoutPrice.length);
