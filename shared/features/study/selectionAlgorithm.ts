import {
  THRESHOLD_NEW_VS_REPEAT,
  MIN_CARD_REVIEW_INTERVAL_ms,
  NUMBER_CARDS_PER_SESSION,
} from '../../core/constants.ts';
import type { StudyCardWithLearning } from './types.ts';

// ── NEW mode ──────────────────────────────────────────────────

/**
 * Select cards for a "learn new" session.
 *
 * Priority order (ported from legacy getCardsLearnNew):
 *   1. Cards already in progress (0 < score < THRESHOLD) not reviewed within
 *      MIN_CARD_REVIEW_INTERVAL, sorted descending by score (near-completion first).
 *   2. Cards never studied (no learning row), filling remaining slots.
 *
 * The 2-hour cooldown applies between sessions only; the caller must not pass
 * cards that were just studied in the current session.
 */
export function selectNewCards(
  cards:        StudyCardWithLearning[],
  favoriteOnly: boolean,
  count:        number = NUMBER_CARDS_PER_SESSION,
): StudyCardWithLearning[] {
  const now  = Date.now();
  const pool = favoriteOnly ? cards.filter(c => c.learning?.favoriteDate != null) : cards;

  // In-progress: has learning row, score below threshold, reviewed > 2h ago
  const inProgress = pool
    .filter(c =>
      c.learning !== null &&
      c.learning.score < THRESHOLD_NEW_VS_REPEAT &&
      (
        c.learning.lastVisited === null ||
        now - new Date(c.learning.lastVisited).getTime() > MIN_CARD_REVIEW_INTERVAL_ms
      ),
    )
    .sort((a, b) => b.learning!.score - a.learning!.score)  // descending: near-complete first
    .slice(0, count);

  const remaining   = count - inProgress.length;
  if (remaining === 0) return inProgress;

  // Truly new: no learning row yet
  const inProgressIds = new Set(inProgress.map(c => c.id));
  const neverStudied  = pool
    .filter(c => !inProgressIds.has(c.id) && c.learning === null)
    .slice(0, remaining);

  return [...inProgress, ...neverStudied];
}

// ── REPEAT mode ───────────────────────────────────────────────

/**
 * Select cards for a "repeat" session.
 *
 * Selects cards with score >= THRESHOLD and sorts by urgency descending so
 * overdue low-scoring cards appear first.
 *
 * Urgency formula: (daysPassed + 1 + jitter) / score
 *   - More days since last review → higher urgency
 *   - Lower score → higher urgency
 *   - Small random jitter prevents identical ordering across sessions
 *
 * NOTE: This is an intentional fix from the legacy algorithm, which sorted
 * by score/(daysPassed+1) and had the direction inverted. The legacy code
 * contained a TODO to move to an exponential time scale — that remains a
 * future improvement.
 */
export function selectRepeatCards(
  cards:        StudyCardWithLearning[],
  favoriteOnly: boolean,
  count:        number = NUMBER_CARDS_PER_SESSION,
): StudyCardWithLearning[] {
  const now  = Date.now();
  const pool = favoriteOnly ? cards.filter(c => c.learning?.favoriteDate != null) : cards;

  // Pre-compute a stable jitter per card so comparisons are consistent
  const jitter = new Map(pool.map(c => [c.id, Math.random() * 0.3]));

  function urgency(c: StudyCardWithLearning): number {
    const learning    = c.learning!;
    const daysPassed  = learning.lastVisited
      ? (now - new Date(learning.lastVisited).getTime()) / (1000 * 60 * 60 * 24)
      : 999; // never visited → maximum urgency
    return (daysPassed + 1 + (jitter.get(c.id) ?? 0)) / Math.max(1, learning.score);
  }

  return pool
    .filter(c => c.learning !== null && c.learning.score >= THRESHOLD_NEW_VS_REPEAT)
    .sort((a, b) => urgency(b) - urgency(a))  // descending: most urgent first
    .slice(0, count);
}

// ── LIST mode ─────────────────────────────────────────────────

/**
 * Return all cards in lesson order (no limit).
 * Used when the user wants to browse all cards in a lesson with their learning state.
 * Not for admin — the admin card listing is a separate endpoint (listCardsAdmin, Step 12).
 */
export function selectListCards(
  cards:        StudyCardWithLearning[],
  favoriteOnly: boolean,
): StudyCardWithLearning[] {
  const pool = favoriteOnly ? cards.filter(c => c.learning?.favoriteDate != null) : cards;
  return pool.slice().sort((a, b) => a.position - b.position);
}

// ── Main entry point ──────────────────────────────────────────

export function selectStudyCards(
  cards:        StudyCardWithLearning[],
  quizMode:     'NEW' | 'REPEAT' | 'LIST',
  favoriteOnly: boolean,
  count?:       number,
): StudyCardWithLearning[] {
  switch (quizMode) {
    case 'NEW':    return selectNewCards(cards, favoriteOnly, count);
    case 'REPEAT': return selectRepeatCards(cards, favoriteOnly, count);
    case 'LIST':   return selectListCards(cards, favoriteOnly);
  }
}
