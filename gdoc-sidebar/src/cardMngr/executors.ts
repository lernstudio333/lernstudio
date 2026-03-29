// src/cardMngr/executors.ts
// Execution layer: all GAS document mutations for card insertion and conversion.
// Validation logic lives in src/models/cardTypes.ts (CARDTYPES[type].validateInsert/validateConvert).

// ======================== EXECUTORS  ===============================

/**
 * EXECUTION: Converts existing typed text (like ||>>>) into a styled link.
 */
function executeConversion(context, match, params) {
  const { element, markerIndex } = context;

  // markerIndex is already the absolute doc position (resolved in getCursorState)
  const start = markerIndex;
  const end = start + match.matchLength - match.trailingSpaceLength - 1;

  const url = buildMarkerUrl(match.typeKey, match.pipesCount, params.noBackward, params.noTyping);

  debugLog('executeConversion', { markerIndex: start, end, url, typeKey: match.typeKey });
  element.setLinkUrl(start, end, url);
  element.setBold(start, end, true);
  element.setForegroundColor(start, end, '#1a73e8');

  handlePostInsertionFormatting(context, match.typeKey, match.trailingSpaceLength > 0);

  return { success: true, action: 'CONVERTED', symbol: match.symbol };
}

/**
 * EXECUTION: Inserts a brand new marker or wraps a GAP selection.
 * Dispatches on config.selectionMode ('wrap' vs 'replace') — no hardcoded cardType checks.
 */
function executeInsertion(context, params) {
  const { element, markerIndex, endOffset, isSelection } = context;
  const config = CARDTYPES[params.cardType];

  const url = buildMarkerUrl(params.cardType, params.includeAbove || 0, params.noBackward, params.noTyping);
  const markerText = config.marker;

  debugLog('executeInsertion', { markerIndex, endOffset, isSelection, cardType: params.cardType, markerText, url });

  if (isSelection && config.selectionMode === 'wrap') {
    // GAP: delete + re-insert selected text, then link — creates a clean text run.
    const selectedText = element.getText().substring(markerIndex, endOffset + 1);
    element.deleteText(markerIndex, endOffset);
    element.insertText(markerIndex, selectedText);
    element.setLinkUrl(markerIndex, markerIndex + selectedText.length - 1, url);

  } else if (isSelection) {
    // Non-GAP selection: delete selected text, insert marker symbol.
    element.deleteText(markerIndex, endOffset);
    element.insertText(markerIndex, markerText);
    const endPos = markerIndex + markerText.length - 1;
    element.setLinkUrl(markerIndex, endPos, url);
    element.setBold(markerIndex, endPos, true);
    handlePostInsertionFormatting(context, params.cardType, false);

  } else {
    // Fresh cursor insertion: use cursor.insertText() — position is implicit,
    // offsets on the returned Text are relative to the inserted text (0 = first char).
    const freshCursor = DocumentApp.getActiveDocument().getCursor();
    if (!freshCursor) return { success: false, error: "Cursor lost during execution." };

    const surrText   = freshCursor.getSurroundingText().getText();
    const surrOffset = freshCursor.getSurroundingTextOffset();

    const spaceBefore = needsSpaceBefore(surrText, surrOffset);
    const linebreak   = config.lineBreakAfterCardRequired && needsNewlineAfter(surrText, surrOffset);
    const spaceAfter  = !linebreak && needsSpaceAfter(surrText, surrOffset);

    const insertStr  = (spaceBefore ? ' ' : '') + markerText + (linebreak ? '\n' : spaceAfter ? ' ' : '');
    const linkOffset = spaceBefore ? 1 : 0;

    freshCursor.insertText(insertStr)
               .setLinkUrl(linkOffset, linkOffset + markerText.length - 1, url)
               .setBold(linkOffset, linkOffset + markerText.length - 1, true);
  }

  return { success: true, action: 'INSERTED', symbol: markerText };
}

/**
 * PURE: Builds the standardized card URL with query parameters.
 */
function buildMarkerUrl(typeKey: string, pipesCount: number, noBackward: boolean, noTyping: boolean): string {
  const id = Date.now();
  const flags: string[] = [];
  if (noBackward) flags.push("NO_BW");
  if (noTyping)   flags.push("NO_TYPING");
  const flagQuery = flags.length ? `&flags=${flags.join(',')}` : '';
  return `${CONFIG.BASE_URL}?id=${id}&cardtype=${typeKey}&depth=${pipesCount}${flagQuery}`;
}

/**
 * SIDE-EFFECT: Post-insertion formatting for executeConversion (typed marker → link).
 * For fresh cursor insertion, formatting is handled inline via cursor.insertText().
 */
function handlePostInsertionFormatting(context, typeKey: string, alreadyHasSpace: boolean) {
  const config = CARDTYPES[typeKey];
  const cursor = DocumentApp.getActiveDocument().getCursor();
  if (!cursor) return;

  const surrText   = cursor.getSurroundingText().getText();
  const surrOffset = cursor.getSurroundingTextOffset();

  if (config.lineBreakAfterCardRequired && needsNewlineAfter(surrText, surrOffset)) {
    cursor.insertText('\n');
  } else if (!alreadyHasSpace && needsSpaceAfter(surrText, surrOffset)) {
    cursor.insertText(' ');
  }
}

// ======================== SPACING HELPERS ===============================

/**
 * Returns true if a space is needed before the insertion point.
 * Checks for any whitespace character (tabs, nbsp, etc.) — not just plain space.
 */
function needsSpaceBefore(text: string, offset: number): boolean {
  return offset > 0 && !/\s/.test(text.charAt(offset - 1));
}

/**
 * Returns true if a space is needed after the insertion point.
 * Checks for any whitespace character — not just plain space.
 */
function needsSpaceAfter(text: string, offset: number): boolean {
  return offset < text.length && !/\s/.test(text.charAt(offset));
}

/**
 * Returns true if a newline is needed after the insertion point.
 * Uses .trim() to ignore trailing whitespace before deciding.
 * (Previous simpler version: `return offset < text.length` — revert if this causes issues.)
 */
function needsNewlineAfter(text: string, offset: number): boolean {
  return text.substring(offset).trim() !== '';
}
