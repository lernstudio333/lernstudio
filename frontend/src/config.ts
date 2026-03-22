// ============================================================
// Frontend App Configuration
// ============================================================

/** Enable verbose quiz diagnostics in the browser console.
 *  Automatically true in dev mode (Vite), false in production builds. */
export const DEBUG_QUIZ = import.meta.env.DEV;

/** Supabase Storage public URL prefix. Combined with VITE_SUPABASE_URL + imagePath
 *  to construct a ready-to-use image src. */
export const SUPABASE_STORAGE_PUBLIC_PATH = '/storage/v1/object/public/';

/** Converts a stored imagePath ("{bucket}/{path}") to a full public URL. */
export function resolveImageUrl(imagePath: string): string {
  return `${import.meta.env.VITE_SUPABASE_URL}${SUPABASE_STORAGE_PUBLIC_PATH}${imagePath}`;
}
