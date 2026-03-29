/**
 * ORCHESTRATOR: The main entry point for the Sidebar.
 */
function handleInsertMarkerOrchestrator(params) {
  const sel = DocumentApp.getActiveDocument().getSelection();

  // Cast to any: getDocumentContext() returns a discriminated union but TypeScript
  // can't narrow it post-guard since focus is inferred as string, not a literal type.
  const context = getDocumentContext() as any;

  if (context.focus === 'NONE') {
    return { success: false, error: "Place your cursor in the document." };
  }

  // Check if cursor is already on an existing card link
  const card = parseCardUrl(context.existingLink);
  debugLog('handleInsertMarkerOrchestrator:existingCard', { existingLink: context.existingLink, card });

  if (card) {
    const res = { success: true, action: 'PREVIEW_ONLY', cardMetadata: card, cardUrl: context.existingLink, message: "Card detected. Reviewing contents..." };
    debugLog('handleInsertMarkerOrchestrator:result', res);
    return res;
  }

  const config = CARDTYPES[params.cardType];

  // 🧪 STRATEGY 1: Convert typed text (e.g. "||>>>")
  const match = detectMarkerPattern(context.text);
  debugLog('handleInsertMarkerOrchestrator:strategy', { match: match || null, isSelection: context.isSelection, cardType: params.cardType });
  if (match) {
    // The marker position may already be a styled card link (e.g. cursor moved past it into the next word).
    // In that case, surface the existing card rather than stamping a new URL over it.
    const linkAtMarker = context.element.getLinkUrl(context.markerIndex);
    const existingAtMarker = parseCardUrl(linkAtMarker);
    if (existingAtMarker) {
      const res = { success: true, action: 'PREVIEW_ONLY', cardMetadata: existingAtMarker, cardUrl: linkAtMarker, message: "Card detected. Reviewing contents..." };
      debugLog('handleInsertMarkerOrchestrator:result', res);
      return res;
    }
    const convErr = config.validateConvert?.(context);
    if (convErr) return { success: false, error: convErr };
    const res = executeConversion(context, match, params);
    debugLog('handleInsertMarkerOrchestrator:result', res);
    return res;
  }

  // 📝 STRATEGY 2: Fresh Insertion / Wrapping Selection
  // validateRange: raw GAS selection checks (partial, single-para, text type) — runs first
  // validateInsert: logical context checks (selection allowed/required for this card type)
  const rangeErr = config.validateRange?.(sel);
  if (rangeErr) return { success: false, error: rangeErr };
  const insErr = config.validateInsert?.(context);
  if (insErr) return { success: false, error: insErr };
  const res = executeInsertion(context, params);
  debugLog('handleInsertMarkerOrchestrator:result', res);
  return res;
}
