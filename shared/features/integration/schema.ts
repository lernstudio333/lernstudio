import type { CardsRequest } from './types.ts';

// ── Validation result ─────────────────────────────────────────────────────────

export type CardsRequestValidation =
  | { ok: true;  data: CardsRequest }
  | { ok: false; error: string };

// ── Valid card types ──────────────────────────────────────────────────────────

const VALID_CARD_TYPES = new Set(['SINGLE_CARD', 'MULTI_CARD', 'SYNONYM', 'GAP', 'IMAGES']);

// ── Validators ────────────────────────────────────────────────────────────────

function validateCardPayload(card: unknown, index: number): string | null {
  if (!card || typeof card !== 'object') return `cards[${index}]: must be an object`;
  const c = card as Record<string, unknown>;

  if (!c.extId || typeof c.extId !== 'string')
    return `cards[${index}].extId: required string`;
  if (!c.question || typeof c.question !== 'string')
    return `cards[${index}].question: required string`;
  if (c.cardType !== undefined && !VALID_CARD_TYPES.has(c.cardType as string))
    return `cards[${index}].cardType: must be one of ${[...VALID_CARD_TYPES].join(', ')}`;
  if (c.answer !== undefined) {
    const a = c.answer;
    const isStringArray = Array.isArray(a) && (a as unknown[]).every(v => typeof v === 'string');
    if (typeof a !== 'string' && !isStringArray)
      return `cards[${index}].answer: must be a string or string[]`;
  }
  if (c.position !== undefined && (typeof c.position !== 'number' || !Number.isInteger(c.position)))
    return `cards[${index}].position: must be an integer`;
  if (c.flags !== undefined) {
    const isStringArray = Array.isArray(c.flags) && (c.flags as unknown[]).every(v => typeof v === 'string');
    if (!isStringArray)
      return `cards[${index}].flags: must be a string[]`;
  }

  return null;
}

export function validateCardsRequest(body: unknown): CardsRequestValidation {
  if (!body || typeof body !== 'object')
    return { ok: false, error: 'Request body must be an object' };
  const b = body as Record<string, unknown>;

  if (b.dry_run !== undefined && typeof b.dry_run !== 'boolean')
    return { ok: false, error: 'dry_run must be a boolean' };
  if (!Array.isArray(b.cards) || b.cards.length === 0)
    return { ok: false, error: 'cards must be a non-empty array' };

  for (let i = 0; i < b.cards.length; i++) {
    const err = validateCardPayload(b.cards[i], i);
    if (err) return { ok: false, error: err };
  }

  return { ok: true, data: b as unknown as CardsRequest };
}
