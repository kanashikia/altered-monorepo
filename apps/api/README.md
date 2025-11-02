# API Altered TCG

API Node.js/TypeScript pour naviguer parmi les informations du jeu Altered TCG et exporter les cartes manquantes.

## 🚀 Installation

```bash
npm install
```

## ⚙️ Configuration

1. Copiez le fichier `.env.example` vers `.env`:
```bash
cp .env.example .env
```

2. Modifiez le fichier `.env` avec votre token d'authentification:
```env
PORT=3000
ALTERED_API_URL=https://api.altered.gg
ALTERED_AUTH_TOKEN=votre_token_bearer_ici
```

## 🏃 Démarrage

### Mode développement
```bash
npm run dev
```

### Mode production
```bash
npm run build
npm start
```

## 📡 Endpoints disponibles

### User

- **GET /api/user/me**
  - Récupère les informations de l'utilisateur connecté
  - Response: `{ success: true, data: {...} }`

- **GET /api/user/zendesk/jwt**
  - Récupère le JWT Zendesk
  - Response: `{ success: true, data: "jwt_token" }`

### Cards

- **GET /api/cards/all**
  - Récupère toutes les cartes
  - Query params: `locale` (default: fr-fr)
  - Response: `{ success: true, data: [...], count: 123 }`

- **GET /api/cards/missing**
  - Récupère les cartes manquantes (moins de 3 exemplaires)
  - Query params: `locale` (default: fr-fr)
  - Response:
    ```json
    {
      "success": true,
      "data": [
        {
          "reference": "ALT_CORE_B_AX_01_C",
          "name": "Carte Example",
          "rarity": "COMMON",
          "faction": "AXIOM",
          "owned": 1,
          "missing": 2
        }
      ],
      "statistics": {
        "totalUniqueCardsMissing": 45,
        "totalCardsMissing": 87,
        "byRarity": [...],
        "byFaction": [...]
      }
    }
    ```

- **GET /api/cards/missing/export**
  - Exporte les cartes manquantes
  - Query params:
    - `locale` (default: fr-fr)
    - `format` (json|csv|txt, default: json)
  - Response: Fichier téléchargeable

- **GET /api/cards/filters**
  - Récupère les filtres disponibles (rarités, types, factions)
  - Query params: `locale` (default: fr-fr)
  - Response: `{ success: true, data: {...} }`

## 📥 Exemples d'utilisation

### Récupérer les cartes manquantes
```bash
curl http://localhost:3000/api/cards/missing
```

### Exporter en CSV
```bash
curl "http://localhost:3000/api/cards/missing/export?format=csv" -o missing_cards.csv
```

### Exporter en TXT
```bash
curl "http://localhost:3000/api/cards/missing/export?format=txt" -o missing_cards.txt
```

### Exporter en JSON
```bash
curl "http://localhost:3000/api/cards/missing/export?format=json" -o missing_cards.json
```

## 🚧 Limites de requêtes & reprise automatique

L'API officielle Altered applique des limitations strictes (`429 Too Many Requests`). Le service contourne ce plafond en paginant les appels et en enregistrant un point de reprise (JSON) dans `apps/api/cache/` après chaque page. Concrètement :

- Chaque tentative de récupération sauvegarde `completedPages` et les données déjà reçues.
- En cas d'erreur réseau ou de quota, l'exécution s'arrête mais les fichiers restent disponibles.
- Relancez la même commande plus tard (`npm run dev:api`, script d'export, etc.) : le service lit la cache, reprend à la page suivante et continue jusqu'à avoir tout récupéré.
- La cache se périme au bout de 24 h; supprimez `apps/api/cache/` si vous voulez forcer un téléchargement intégral.

Cette mécanique garantit que vous n'épuisez pas la limite de requêtes et que vous finissez par obtenir l'intégralité du catalogue même en cas de coupure.

## 🏗️ Architecture

```
src/
├── index.ts              # Point d'entrée de l'application
├── routes/               # Définition des routes Express
│   ├── cardsRoutes.ts
│   └── userRoutes.ts
├── services/             # Logique métier
│   ├── alteredApiService.ts  # Service pour appeler l'API Altered
│   └── cardAnalyzer.ts       # Analyse des cartes manquantes
├── types/                # Définitions TypeScript
│   └── index.ts
└── utils/                # Utilitaires
    └── exporters.ts      # Exporteurs CSV/JSON/TXT
```

## 🎯 Fonctionnalités

- ✅ Récupération de toutes les cartes de votre collection
- ✅ Analyse des cartes manquantes (objectif: 3 exemplaires de chaque)
- ✅ Statistiques par rareté et par faction
- ✅ Export en JSON, CSV et TXT
- ✅ Support multilingue (paramètre `locale`)

## 📝 Notes

- Le token d'authentification doit être valide pour accéder à l'API Altered
- L'API cible les cartes de votre collection personnelle
- Le nombre cible de cartes est fixé à 3 par défaut (playset complet)
