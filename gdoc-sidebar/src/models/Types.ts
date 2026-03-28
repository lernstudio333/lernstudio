// src/models/Types.ts
// No `export` keywords — all types are global (required for GAS module:"None" script mode).

// Derived from CARDTYPES in Metadata.ts — stays in sync automatically when card types are added/removed.
type CardType = keyof typeof CARDTYPES;

interface CardMeta {
  id: string;
  typeKey: CardType;
  flags: string[];
  includeAbove: number;
  fullUrl?: string;
}

interface RawCard {
  cardId: string;
  type: CardType;
  question: string;
  answer?: string;
  directChildren: string[];
  parents: string[];
  flags: string[];
  rowIndex: number;
  fullUrl?: string;
}

interface NormalizedRow {
  index: number;
  text: string;
  level: number;
  cardMetadata: CardMeta | null;
}

interface NavigationResponse {
  success: boolean;
  card?: RawCard;
  message?: string;
  error?: string;
}

interface UpsertResponse {
  success: boolean;
  action: 'INSERTED' | 'UPDATED' | 'PREVIEW_ONLY';
  cardMetadata?: CardMeta;
  error?: string;
}

interface PairingResponse {
  session_token: string | null;
  lesson_name?: string;
  error?: string;
}

interface SyncReport {
  inserted: RawCard[];
  updated: RawCard[];
}

interface IntegrityReport {
  success: boolean;
  duplicates: { [cardId: string]: number[] };
  totalDuplicates: number;
  message?: string;
}
