import type { StudyCard } from './types.ts';

/**
 * Returns true if a card has enough data to be quizzed.
 *
 * Rules:
 *   - Question must be non-empty
 *   - IMAGES cards: at least one answer with a resolved imagePath
 *   - All other types: at least one answer with non-empty answerText
 *
 * Invalid cards are silently dropped by the edge function before selection.
 * This avoids quiz modes receiving cards they cannot render.
 */
export function isCardQuizzable(card: StudyCard): boolean {
  if (!card.question?.trim()) return false;

  if (card.cardType === 'IMAGES') {
    return card.answers.some(a => a.imagePath != null);
  }

  return card.answers.some(a => a.answerText?.trim());
}
