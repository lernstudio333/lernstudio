// ── Incoming payload from external source (e.g. Google Docs sidebar) ──

export interface CardPayload {
  extId:      string;
  cardType?:  string;
  question:   string;
  answer?:    string | string[];
  details?:   string;
  source?:    string;
  tip?:       string;
  flags?:     string[];   // e.g. ['NO_BACKWARD', 'NO_TYPING'] — stored as comma string in DB
  position?:  number;
  created_at?: string;
  updated_at?: string;
}

export interface CardsRequest {
  dry_run?: boolean;
  cards:    CardPayload[];
}

// ── Snapshot of an existing DB card used for diffing ──

export interface ExistingCardSnapshot {
  card_type: string;
  question:  string;
  tip:       string | null;
  details:   string | null;
  source:    string | null;
  position:  number;
  flags:     string | null;
  answers:   string[]; // answer_text values sorted by position
}

// ── Update report ──

export interface UpdateReportItem {
  external_id: string;
  action:      'insert' | 'update';
  changes?:    string[]; // field names that differ (only for 'update')
}

export interface CardsResponse {
  inserted: UpdateReportItem[];
  updated:  UpdateReportItem[];
}
