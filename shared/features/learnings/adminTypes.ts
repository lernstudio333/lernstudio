// ── Admin learnings list ───────────────────────────────────────────────────────
// One row per (user, card) pair. Cards never studied by anyone appear once
// with userId = null ("not studied yet").

export type AdminLearningRow = {
  // User
  userId:        string | null;
  userName:      string | null;
  // Hierarchy
  programId:     string;
  programTitle:  string;
  programExtId:  string | null;
  courseId:      string;
  courseTitle:   string;
  courseExtId:   string | null;
  lessonId:      string;
  lessonTitle:   string;
  lessonExtId:   string | null;
  // Card
  cardId:        string;
  cardExtId:     string | null;
  cardType:      string;
  question:      string;
  answers:       string | null;   // answers joined with ' | '
  // Learning state (null for unstudied cards)
  score:         number | null;
  lastVisited:   string | null;
  isFavorite:    boolean | null;
  // Timestamps
  createdAt:     string;
  updatedAt:     string;
};

// ── Request ────────────────────────────────────────────────────────────────────

export type ListCardsAdminRequest = {
  programId?:  string;
  courseId?:   string;
  lessonId?:   string;
  cardTypes?:  string[];
  sortField?:  string;  // 'program' | 'course' | 'lesson' | 'card' | 'cardType' | 'score' | 'lastVisited' | 'createdAt' | 'updatedAt'
  sortDir?:    'asc' | 'desc';
  page?:       number;
  pageSize?:   number;
};

// ── Response ───────────────────────────────────────────────────────────────────

export type ListCardsAdminResponse = {
  rows:       AdminLearningRow[];
  totalCount: number;
  page:       number;
  pageSize:   number;
};
