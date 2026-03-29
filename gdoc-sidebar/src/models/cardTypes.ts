// src/models/cardTypes.ts
// Central registry: what each card type IS and what rules apply to it.
// Execution logic lives in cardMngr/executors.ts.

const CONFIG = {
  BASE_URL: "https://www.lern-studio.de",
  API_BASE_URL: "https://xmhwvmzpbomgkeavjerk.supabase.co/functions/v1",
  REGEX: /\/c\/(\d+)\?t=([^&]+)/,
  DEFAULT_LEVEL: -1
};

// ======================== VALIDATORS ===============================

/**
 * validateRange for GAP: validates the raw GAS selection before context analysis.
 * Checks: selection exists, single paragraph, partial selection, text element.
 */
function validateGapSelection(sel): string | null {
  if (!sel) return "GAP cards require a text selection.";
  const rangeElements = sel.getRangeElements();
  if (rangeElements.length > 1) return "GAP cards only allow selection within one paragraph.";
  const rangeEl = rangeElements[0];
  if (!rangeEl.isPartial()) return "GAP cards require only part of the paragraph to be selected.";
  if (rangeEl.getElement().getType() !== DocumentApp.ElementType.TEXT) return "GAP cards require a text selection.";
  return null;
}

/**
 * validateInsert for non-GAP cards: selection is not allowed.
 * Inserting a marker with a selection active would silently delete the selected text.
 */
function validateNoSelection(ctx): string | null {
  if (ctx.isSelection) return "Place your cursor (not a selection) to insert this card type.";
  return null;
}

// ======================== CARD TYPES ===============================

const CARDTYPES = {
  "SINGLE_CARD": {
    marker: ">>",
    legacyCode: "SC",
    requiresSelection: false,
    selectionMode: 'replace' as const,   // selection → delete + insert marker
    lineBreakAfterCardRequired: false,    // question and answer stay on same line ↔️
    validateRange:   null,
    validateInsert:  validateNoSelection,
    validateConvert: null,
  },
  "MULTI_CARD": {
    marker: ">>>",
    legacyCode: "MC",
    requiresSelection: false,
    selectionMode: 'replace' as const,
    lineBreakAfterCardRequired: true,     // starts a new line for list items ⬇️
    validateRange:   null,
    validateInsert:  validateNoSelection,
    validateConvert: null,
  },
  "SYNONYM": {
    marker: ">S>",
    legacyCode: "SYN",
    requiresSelection: false,
    selectionMode: 'replace' as const,
    lineBreakAfterCardRequired: true,     // starts a new line for synonyms ⬇️
    validateRange:   null,
    validateInsert:  validateNoSelection,
    validateConvert: null,
  },
  "GAP": {
    marker: "[...]",
    legacyCode: "GAP",
    requiresSelection: true,
    selectionMode: 'wrap' as const,       // selection → wrap selected text in link
    lineBreakAfterCardRequired: false,    // inline within a sentence ➡️
    validateRange:   validateGapSelection, // partial, single-para, text-type checks on raw GAS sel
    validateInsert:  null,                 // range validator covers the selection requirement
    validateConvert: null,
  },
  "IMAGES": {
    marker: ">I>",
    legacyCode: "IMG",
    requiresSelection: false,
    selectionMode: 'replace' as const,
    lineBreakAfterCardRequired: true,
    validateRange:   null,
    validateInsert:  validateNoSelection,
    validateConvert: null,
  },
};
