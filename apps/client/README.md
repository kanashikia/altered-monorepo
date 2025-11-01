# Altered TCG - Collection Tracker

Application React pour gérer et visualiser votre collection de cartes Altered TCG.

## Fonctionnalités

- 📊 **Tableau interactif** avec tri par colonne (référence, nom, rareté, faction, quantités)
- 🔍 **Filtrage avancé** par faction (Lyra, Axiom, Bravos, Muna, Ordis, Yzmir) et rareté (Commun, Rare, Unique)
- 🔎 **Recherche** par nom ou référence de carte
- 📈 **Statistiques** en temps réel (total de cartes, cartes manquantes, cartes possédées)
- 💾 **Sauvegarde locale** des données avec localStorage
- 🔄 **Mise à jour quotidienne** automatique des données
- 🎨 **Interface au style Altered TCG** avec couleurs par faction

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## Build

```bash
npm run build
```

## Mise à jour automatique des données

### Option 1: Automatique via l'application

L'application vérifie automatiquement si les données ont plus de 24h et les met à jour au démarrage.

### Option 2: Script cron (recommandé pour production)

Pour mettre à jour les données quotidiennement, ajoutez cette ligne à votre crontab:

```bash
# Ouvrir crontab
crontab -e

# Ajouter cette ligne pour une mise à jour à 2h du matin chaque jour
0 2 * * * /chemin/vers/altered-monorepo/apps/client/public/update-script.sh
```

Ou manuellement:

```bash
./public/update-script.sh
```

## API

L'application récupère les données depuis:
```
http://localhost:3000/api/cards/missing/export?format=csv
```

Format CSV attendu (séparateur: tabulation):
```
Reference    Nom    Rareté    Faction    Possédées    Manquantes
ALT_ALIZE_A_AX_35_C    Vaike, l'Énergéticienne    Commun    Axiom    0    3
```

## Technologies

- **React** 18 avec Hooks
- **Vite** pour le build et le dev
- **CSS3** avec variables CSS
- **localStorage** pour la persistance des données

## Structure

```
src/
├── App.jsx          # Composant principal avec logique de tri/filtrage
├── App.css          # Styles spécifiques au composant
└── index.css        # Styles globaux et variables CSS (couleurs Altered TCG)
```

## Personnalisation

Les couleurs peuvent être modifiées dans `src/index.css`:

```css
:root {
  /* Altered TCG color palette */
  --bg-primary: #1a1a2e;
  --accent-primary: #e94560;

  /* Faction colors */
  --lyra: #9b59b6;
  --axiom: #3498db;
  /* ... */
}
```
