// src/services/MarkerDetection.ts
// Shared detection & parsing utilities for card markers.
// Used by both the Inspector/Detector workflow (cardMngr/) and the Harvester.

/**
 * PURE FUNCTION: Scans a string segment for card markers and depth pipes.
 * Identifies patterns at the end of a string (e.g. "||>>>") and extracts
 * the card type, pipe count, and match position.
 *
 * @param text - The text segment to scan (usually the look-back string from the cursor).
 * @returns Match details, or null if no marker is found at the end of the string.
 *
 * @example
 * detectMarkerPattern("abc||>>>")
 * // → { typeKey: "MULTI_CARD", symbol: ">>>", pipesCount: 2, posMatch: 3, matchLength: 5, trailingSpaceLength: 0 }
 */
function detectMarkerPattern(text: string) {
  if (!text || typeof text !== 'string') return null;

  // (\|*)                          Group 1: Zero or more depth pipes
  // (>>|>>>|>S>|>I>|\[\.\.\.\])   Group 2: The marker symbol
  // (\s*)$                         Group 3: Optional trailing spaces at end of string
  const markerRegex = /(\|*)(>>|>>>|>S>|>I>|\[\.\.\.\])(\s*)$/;
  const match = text.match(markerRegex);
  if (!match) return null;

  const [fullMatch, pipes, symbol, trailingSpace] = match;
  const typeKey = Object.keys(CARDTYPES).find(key => CARDTYPES[key].marker === symbol);

  return {
    typeKey: typeKey || 'UNKNOWN',
    symbol,
    pipesCount: pipes.length,
    posMatch: match.index as number,
    matchLength: fullMatch.length,
    trailingSpaceLength: trailingSpace.length
  };
}

/**
 * PURE FUNCTION: Parses a URL and returns CardMeta if it's a valid
 * Lern-Studio internal link. Returns null for external or unrecognised URLs.
 *
 * @param url - The URL string to inspect (e.g. from getLinkUrl()).
 * @returns CardMeta object or null.
 */
function parseCardUrl(url: string | null): CardMeta | null {
  if (!url || typeof url !== 'string') return null;

  const normalizedBase = CONFIG.BASE_URL.replace(/\/$/, '');
  if (!url.includes(normalizedBase)) return null;

  const idMatch    = url.match(/[?&]id=([^&]*)/);
  const typeMatch  = url.match(/[?&]cardtype=([^&]*)/);
  const flagsMatch = url.match(/[?&]flags=([^&]*)/);
  const depthMatch = url.match(/[?&]depth=([^&]*)/);

  if (!idMatch) return null;

  const meta: CardMeta = {
    id:           idMatch[1],
    typeKey:      (typeMatch ? typeMatch[1] : 'UNKNOWN') as CardType,
    flags:        (flagsMatch && flagsMatch[1]) ? flagsMatch[1].split(',') : [],
    includeAbove: depthMatch ? parseInt(depthMatch[1], 10) : 0,
    fullUrl:      url
  };
  debugLog('parseCardUrl', meta);
  return meta;
}
