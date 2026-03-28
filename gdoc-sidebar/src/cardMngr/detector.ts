
// ======================== DETECTORS  ===============================

// detectMarkerPattern() lives in src/services/MarkerDetection.ts

// ======================== EXECUTORS  ===============================

/**
 * EXECUTION: Converts existing typed text (like ||>>>) into a styled link.
 */
function executeConversion(context, match, params) {
  const { element, analysisSegmentStartOffset } = context;

  // Doc Position = Start of the Segment we analyzed + where the match is inside it
  const start = analysisSegmentStartOffset + match.posMatch;
  const end = start + match.matchLength - 1;

  const url = buildMarkerUrl(match.typeKey, match.pipesCount, params.noBackward, params.noTyping);

  element.setLinkUrl(start, end, url);
  element.setBold(start, end, true);
  element.setForegroundColor(start, end, '#1a73e8');

  handlePostInsertionFormatting(context, match.typeKey, match.trailingSpaceLength > 0);

  return { success: true, action: 'CONVERTED', symbol: match.symbol };
}

/**
 * EXECUTION: Inserts a brand new marker or wraps a selection.
 */
function executeInsertion(context, params) {
  const { element, analysisSegmentStartOffset, endOffset, isSelection } = context;
  const config = CARDTYPES[params.cardType];

  const url = buildMarkerUrl(params.cardType, params.includeAbove || 0, params.noBackward, params.noTyping);
  const markerText = config.marker;

  if (isSelection) {
    // If text is selected, we wrap it or replace it depending on card type
    // For GAPs, we usually keep the text. For Markers, we replace it.
    element.deleteText(analysisSegmentStartOffset, endOffset);
    element.insertText(analysisSegmentStartOffset, markerText);
  } else {
    element.insertText(analysisSegmentStartOffset, markerText);
  }

  const endPos = analysisSegmentStartOffset + markerText.length - 1;
  element.setLinkUrl(analysisSegmentStartOffset, endPos, url);
  element.setBold(analysisSegmentStartOffset, endPos, true);

  handlePostInsertionFormatting(context, params.cardType, false);

  return { success: true, action: 'INSERTED', symbol: markerText };
}

/**
 * PURE: Builds the standardized URL with query parameters.
 */
function buildMarkerUrl(typeKey: string, pipesCount: number, noBackward: boolean, noTyping: boolean): string {
  const id = Date.now(); // In production, consider a more robust UID
  const flags: string[] = [];
  if (noBackward) flags.push("NO_BW");
  if (noTyping) flags.push("NO_TYPING");

  const flagQuery = flags.length ? `&flags=${flags.join(',')}` : '';
  return `${CONFIG.BASE_URL}?id=${id}&cardtype=${typeKey}&depth=${pipesCount}${flagQuery}`;
}

/**
 * SIDE-EFFECT: Handles newlines and spaces after an action.
 */
function handlePostInsertionFormatting(context, typeKey: string, alreadyHasSpace: boolean) {
  const config = CARDTYPES[typeKey];
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();

  if (!cursor) return;

  if (config.lineBreakAfterCardRequired) {
    cursor.insertText('\n');
  } else if (!alreadyHasSpace && !context.isSelection) {
    cursor.insertText(' ');
  }
}