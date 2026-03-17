// ============================================================
// Quiz Engine Constants
// ============================================================

/** Maximum number of cards loaded into a single session. */
export const NUMBER_CARDS_PER_SESSION = 20;

/** Size of the distractor pool fetched from the backend for multiple-choice options. */
export const NUMBER_DISTRACTOR_CARDS = 100;

/** Learning score below which a card is treated as "new" (not yet in spaced repetition). */
export const THRESHOLD_NEW_VS_REPEAT = 7;

/** Minimum time (hours) before a learned card is eligible for review again. */
export const MIN_CARD_REVIEW_INTERVAL_hh = 2;

/** Minimum review interval in milliseconds (derived from hours). */
export const MIN_CARD_REVIEW_INTERVAL_ms = MIN_CARD_REVIEW_INTERVAL_hh * 60 * 60 * 1000;
