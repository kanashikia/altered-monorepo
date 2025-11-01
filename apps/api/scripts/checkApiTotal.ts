import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ALTERED_API_URL = process.env.ALTERED_API_URL || 'https://api.altered.gg';
const ALTERED_AUTH_TOKEN = process.env.ALTERED_AUTH_TOKEN;

async function checkTotals() {
  const client = axios.create({
    baseURL: ALTERED_API_URL,
    timeout: 30000,
    headers: {
      'accept': '*/*',
      'accept-language': 'fr-fr',
      'authorization': `Bearer ${ALTERED_AUTH_TOKEN}`,
      'origin': 'https://www.altered.gg',
      'referer': 'https://www.altered.gg/',
    },
  });

  console.log('Checking /cards endpoint...');
  const cardsResponse = await client.get('/cards', {
    params: { itemsPerPage: 100, page: 1, locale: 'fr-fr' }
  });
  const cardsTotal = cardsResponse.data['hydra:totalItems'];
  const cardsPages = Math.ceil(cardsTotal / 100);
  console.log(`  Total cards: ${cardsTotal}`);
  console.log(`  Pages needed (100 per page): ${cardsPages}`);

  console.log('\nChecking /cards/stats endpoint...');
  const statsResponse = await client.get('/cards/stats', {
    params: { itemsPerPage: 100, page: 1, locale: 'fr-fr' }
  });
  const statsTotal = statsResponse.data['hydra:totalItems'];
  const statsPages = Math.ceil(statsTotal / 100);
  console.log(`  Total stats: ${statsTotal}`);
  console.log(`  Pages needed (100 per page): ${statsPages}`);
}

checkTotals().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
