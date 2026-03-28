
// ======================== INSPECTOR ===============================

/**
 * DISCOVERY: Inspects what is currently under the cursor or selection.
 * @returns {Object} The DocumentContext "Situation Report".
 */
function getDocumentContext() {
  const doc = DocumentApp.getActiveDocument();
  const selection = doc.getSelection();
  const cursor = doc.getCursor();

  if (selection) return getSelectionState(selection);
  if (cursor) return getCursorState(cursor);
  
  return { focus: 'NONE' };
}

/**
 * INTERNAL: Extracts state specifically from a selection.
 */
function getSelectionState(selection) {
  const rangeEl = selection.getRangeElements()[0];
  const element = rangeEl.getElement().asText();
  const start = rangeEl.getStartOffset();
  const end = rangeEl.getEndOffsetInclusive();

  return {
    focus: 'SELECTION',
    isSelection: true,
    element: element,
    // The "Analysis Segment" is the exact string selected
    text: element.getText().substring(start, end + 1),
    // The offset where the selection starts in the Doc Element
    analysisSegmentStartOffset: start, 
    endOffset: end,
    existingLink: findLinkInRange(element, start, end)
  };
}

function getCursorState(cursor) {
  const element = cursor.getElement().asText();
  const offset = cursor.getOffset();
  const lookBackLimit = 20;
  const start = Math.max(0, offset - lookBackLimit);

  return {
    focus: 'CURSOR',
    isSelection: false,
    element: element,
    text: element.getText().substring(start, offset),
    // The offset where the lookback starts in the Doc Element
    analysisSegmentStartOffset: start, 
    endOffset: offset,
    existingLink: element.getLinkUrl(Math.max(0, offset - 1))
  };
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