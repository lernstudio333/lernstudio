// ── Card answer (flat, DB-shaped) ─────────────────────────────

export type StudyCardAnswer = {
  answerText: string | null;
  imagePath:  string | null;  // "{bucket}/{path}" — use resolveImageUrl() in frontend
  position:   number;
};

// ── Base card (no learning state) ─────────────────────────────

export type StudyCard = {
  id:       string;
  cardType: string;
  question: string;
  tip:      string | null;
  position: number;
  answers:  StudyCardAnswer[];
};

// ── Per-user learning state ───────────────────────────────────

/**
 * Snapshot of user_cards_learnings for one card.
 * null = card has never been studied by this user.
 */
export type LearningSnapshot = {
  score:        number;
  errorsByType: Record<string, number>;
  lastVisited:  string | null;
  favoriteDate: string | null;
} | null;

// ── Card with learning state (used for study cards) ───────────

export type StudyCardWithLearning = StudyCard & {
  learning: LearningSnapshot;
};

// ── API request / response ────────────────────────────────────

export type FetchStudyCardsRequest = {
  lessonId:            string;
  quizMode:            'NEW' | 'REPEAT' | 'LIST';
  studyCardCount?:     number;       // default: NUMBER_CARDS_PER_SESSION
  distractorCardCount?: number;      // default: NUMBER_DISTRACTOR_CARDS; only for NEW/REPEAT
  favoriteOnly?:       boolean;
};

export type FetchStudyCardsResponse = {
  studyCards:      StudyCardWithLearning[];
  distractorCards: StudyCard[];         // empty for LIST mode
};
