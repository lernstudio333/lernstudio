import type { CardPayload, ExistingCardSnapshot } from './types.ts';

/**
 * Compute which fields differ between an incoming CardPayload and the existing
 * DB snapshot. Only fields explicitly present in the payload are compared.
 *
 * Returns an array of field names that have changed (empty = no changes).
 */
export function diffCard(incoming: CardPayload, existing: ExistingCardSnapshot): string[] {
  const changes: string[] = [];

  if (incoming.cardType !== undefined && incoming.cardType !== existing.card_type) {
    changes.push('card_type');
  }
  if (incoming.question !== undefined && incoming.question !== existing.question) {
    changes.push('question');
  }
  if (incoming.tip !== undefined && (incoming.tip || null) !== existing.tip) {
    changes.push('tip');
  }
  if (incoming.details !== undefined && (incoming.details || null) !== existing.details) {
    changes.push('details');
  }
  if (incoming.source !== undefined && (incoming.source || null) !== existing.source) {
    changes.push('source');
  }
  if (incoming.position !== undefined && incoming.position !== existing.position) {
    changes.push('position');
  }

  // Flags comparison: normalise both sides to sorted comma string
  if (incoming.flags !== undefined) {
    const incomingFlags = [...incoming.flags].sort().join(',');
    const existingFlags = (existing.flags ?? '').split(',').map(f => f.trim()).filter(Boolean).sort().join(',');
    if (incomingFlags !== existingFlags) changes.push('flags');
  }

  // Answer comparison: normalise to string[], sort by original order, then compare
  if (incoming.answer !== undefined) {
    const incomingAnswers = normalizeAnswers(incoming.answer);
    if (JSON.stringify(incomingAnswers) !== JSON.stringify(existing.answers)) {
      changes.push('answer');
    }
  }

  return changes;
}

/**
 * Normalise the polymorphic answer field to a plain string array.
 * String → [string], string[] → string[], undefined → [].
 */
export function normalizeAnswers(answer: string | string[] | undefined): string[] {
  if (answer === undefined) return [];
  return Array.isArray(answer) ? answer : [answer];
}
