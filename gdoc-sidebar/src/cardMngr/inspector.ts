
// ======================== INSPECTOR ===============================

/**
 * DISCOVERY: Inspects what is currently under the cursor or selection.
 * @returns {Object} The DocumentContext "Situation Report".
 */
function getDocumentContext() {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  const cursor = doc.getCursor();

  const ctx = selection ? getSelectionState(selection)
            : cursor    ? getCursorState(cursor)
            : { focus: 'NONE' };
  debugLog('getDocumentContext', ctx);
  return ctx;
}

/**
 * INTERNAL: Extracts state specifically from a selection.
 */
function getSelectionState(selection) {
  const rangeEl = selection.getRangeElements()[0];
  const element = rangeEl.getElement().asText();
  const start = rangeEl.getStartOffset();
  const end = rangeEl.getEndOffsetInclusive();

  const state = {
    focus: 'SELECTION',
    isSelection: true,
    element,
    text: element.getText().substring(start, end + 1),
    markerIndex: start,
    endOffset: end,
    existingLink: findLinkInRange(element, start, end)
  };
  debugLog('getSelectionState', { text: state.text, markerIndex: start, endOffset: end });
  return state;
}

function getCursorState(cursor) {
  // getSurroundingText() returns the full paragraph text (not just the current run).
  // getSurroundingTextOffset() gives the correct absolute offset within it.
  const element = cursor.getSurroundingText();
  const offset   = cursor.getSurroundingTextOffset();

  const LOOKBACK_LENGTH = 20;
  const anchor = Math.max(0, offset - LOOKBACK_LENGTH);
  const text   = element.getText().substring(anchor, offset);

  const markerMatch = detectMarkerPattern(text);
  const markerIndex = markerMatch ? anchor + markerMatch.posMatch : offset;

  const state = {
    focus: 'CURSOR',
    isSelection: false,
    element,
    text,
    markerIndex,
    endOffset: offset,
    existingLink: element.getLinkUrl(Math.max(0, offset - 1))
  };
  debugLog('getCursorState', { text, anchor, offset, markerMatch, markerIndex });
  return state;
}

/**
 * INTERNAL: Checks if any part of a specific text range contains a link.
 */
function findLinkInRange(element, start, end) {
  for (let i = start; i <= end; i++) {
    const url = element.getLinkUrl(i);
    if (url) return url;
  }
  return null;
}

// parseCardUrl() lives in src/services/MarkerDetection.ts