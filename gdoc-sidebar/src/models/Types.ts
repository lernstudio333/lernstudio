// src/models/Types.ts
// No `export` keywords — all types are global (required for GAS module:"None" script mode).

// Derived from CARDTYPES in cardTypes.ts — stays in sync automatically when card types are added/removed.
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
  answer?: string | string[];
  parents: string[];
  flags: string[];
  rowIndex: number;
  fullUrl?: string;
  warning?: string;       // Set when unexpected text is found to the right of a non-SINGLE_CARD marker
}

interface StructuredParagraph {
  index: number;
  text: string;           // Full concatenated paragraph text (used for parent/child matching)
  level: number;
  cardMetadata: CardMeta | null;
  textBeforeLink: string;  // Text to the left of the card link
  linkText: string;        // Text content of the linked run (marker symbol or gap word)
  textAfterLink: string;   // Text to the right of the card link (answer for SINGLE_CARD, warning for others)
  linkCharOffset: number;  // Character offset of the link start within the paragraph (for cursor placement)
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

// Shape of a single card sent to POST /integration/cards
interface ApiCard {
  extId: string;           // `${docId}#${cardId}` — stable key for upsert matching
  cardType: string;
  question: string;
  answer?: string | string[];
  position: number;        // paragraph index — preserves document order
}

interface IntegrityReport {
  success: boolean;
  duplicates: { [cardId: string]: number[] };
  totalDuplicates: number;
  message?: string;
}
