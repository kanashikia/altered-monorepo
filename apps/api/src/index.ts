import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AlteredApiService } from './services/alteredApiService';
import { createCardsRouter } from './routes/cardsRoutes';
import { createUserRouter } from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ALTERED_API_URL = process.env.ALTERED_API_URL || 'https://api.altered.gg';
const ALTERED_AUTH_TOKEN = process.env.ALTERED_AUTH_TOKEN;

if (!ALTERED_AUTH_TOKEN) {
  console.error('ERREUR: ALTERED_AUTH_TOKEN n\'est pas défini dans le fichier .env');
  process.exit(1);
}

const apiService = new AlteredApiService(ALTERED_API_URL, ALTERED_AUTH_TOKEN);

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Altered TCG',
    version: '1.0.0',
    endpoints: {
      user: {
        '/api/user/me': 'Récupérer les informations de l\'utilisateur',
        '/api/user/zendesk/jwt': 'Récupérer le JWT Zendesk',
      },
      cards: {
        '/api/cards/all': 'Récupérer toutes les cartes (avec param ?locale=fr-fr)',
        '/api/cards/missing': 'Récupérer les cartes manquantes (avec statistiques)',
        '/api/cards/missing/export': 'Exporter les cartes manquantes (?format=json|csv|txt)',
        '/api/cards/filters': 'Récupérer les filtres disponibles',
      },
    },
  });
});

app.use('/api/user', createUserRouter(apiService));
app.use('/api/cards', createCardsRouter(apiService));

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📚 Documentation disponible sur http://localhost:${PORT}`);
});