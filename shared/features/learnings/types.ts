// ── Per-card learning update (sent by frontend at end of session) ─────────────

/**
 * One entry per card studied in a session.
 * - score:        full current score (replacement, not delta); floor 0 enforced by backend
 * - errorsByType: full updated dict keyed by ErrorType enum keys; backend replaces existing value
 * - lastVisited:  ISO timestamp; defaults to now() on backend if omitted
 * - favoriteDate: ISO timestamp → favorited; null → unfavorited; omit → leave unchanged
 */
export type LearningUpdate = {
  cardId:        string;
  score:         number;
  errorsByType?: Record<string, number>;
  lastVisited?:  string;
  favoriteDate?: string | null;
};

// ── Batch request ─────────────────────────────────────────────────────────────

export type BatchLearningUpdateRequest = {
  updates: LearningUpdate[];
};

// ── Batch response ────────────────────────────────────────────────────────────

export type LearningUpdateError = {
  cardId: string;
  reason: string;
};

export type BatchLearningUpdateResponse = {
  updatedCount: number;
  errors?:      LearningUpdateError[];
};
