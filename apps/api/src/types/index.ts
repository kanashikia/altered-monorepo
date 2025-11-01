export interface Card {
  id: string;
  reference: string;
  name: string;
  rarity: {
    reference: string;
    name: string;
    [key: string]: any;
  };
  cardType: {
    reference: string;
    name: string;
    [key: string]: any;
  };
  mainFaction: {
    reference: string;
    name: string;
    color: string;
    [key: string]: any;
  };
  imagePath?: string;
  collectionCount?: number;
  ownership?: number;
  lowerPrice?: number;
  [key: string]: any;
}

export interface UserInfo {
  id: string;
  email: string;
  username: string;
  [key: string]: any;
}

export interface CardCollection {
  cards: Card[];
  totalItems: number;
  itemsPerPage: number;
  page: number;
}

export interface MissingCard {
  reference: string;
  name: string;
  rarity: string;
  faction: string;
  owned: number;
  missing: number;
  lowerPrice?: number;
  totalCost?: number;
}

export interface FilterData {
  rarities: string[];
  types: string[];
  factions: string[];
  [key: string]: any;
}