import { CardTypes } from '../../core/enums.ts';

/** Map legacy CSV type strings to CardTypes enum keys. */
export const legacyCardTypeLookup: Record<string, string> = {
  SC:       'SINGLE_CARD',
  MC:       'MULTI_CARD',
  GAP:      'GAP',
  SYN:      'SYNONYM',
  IMG:      'IMAGES',
  'IMG-SC': 'IMAGES',
  'IMG-MC': 'IMAGES',
};

/**
 * Normalize a raw card type string from CSV to a CardTypes enum key.
 * Accepts both current keys ('SINGLE_CARD') and legacy codes ('SC').
 * Returns null if the value is not recognized.
 */
export function normalizeCardType(raw: string): string | null {
  const trimmed = raw.trim();
  const fromLegacy = legacyCardTypeLookup[trimmed];
  if (fromLegacy) return fromLegacy;
  const entry = CardTypes.values().find(e => e.key === trimmed);
  return entry ? entry.key : null;
}
