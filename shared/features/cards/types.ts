import type { z } from 'zod';
import type { CardSchema, MediaRefSchema, CardAnswerSchema } from './schema';

/** Lightweight media reference (image stored in Supabase Storage). */
export type MediaRef = z.infer<typeof MediaRefSchema>;

/** Polymorphic answer value — string, string[], or MediaRef[]. */
export type CardAnswer = z.infer<typeof CardAnswerSchema>;

/**
 * API-facing Card type, inferred from the Zod schema.
 * Use this type throughout the frontend and Edge Functions.
 */
export type Card = z.infer<typeof CardSchema>;
