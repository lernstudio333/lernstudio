import { z } from 'zod';

// ── Sub-schemas ───────────────────────────────────────────────

export const MediaRefSchema = z.object({
  bucket: z.string(),
  path:   z.string(),
  width:  z.number().int().positive(),
  height: z.number().int().positive(),
});

/**
 * The answer field is polymorphic depending on card type:
 *  - SINGLE_CARD / GAP  → single string
 *  - MULTI_CARD / SYN   → array of strings
 *  - IMAGES             → array of MediaRef
 */
export const CardAnswerSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.array(MediaRefSchema),
]);

// ── Card API schema ───────────────────────────────────────────

/**
 * API-facing Card type.
 * Assembled from the `cards` + `card_answers` DB rows.
 * card_type uses legacy DB values for now; will be migrated to CardTypes enum keys.
 */
export const CardSchema = z.object({
  id:        z.string().uuid(),
  extId:     z.string().nullable(),
  lessonId:  z.string().uuid(),
  cardType:  z.enum(['SINGLE_CARD', 'MULTI_CARD', 'SYNONYM', 'GAP', 'IMAGES']),
  question:  z.string(),
  answer:    CardAnswerSchema,
  tip:       z.string().nullable(),
  position:  z.number().int(),
});
