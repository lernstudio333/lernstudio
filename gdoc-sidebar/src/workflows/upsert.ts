/**
 * ORCHESTRATOR: The main entry point for the Sidebar.
 */
function handleInsertMarkerOrchestrator(params) {
  // Cast to any: getDocumentContext() returns a discriminated union but TypeScript
  // can't narrow it post-guard since focus is inferred as string, not a literal type.
  const context = getDocumentContext() as any;
  
  if (context.focus === 'NONE') {
    return { success: false, error: "Place your cursor in the document." };
  }

  console.log("CONTEXT LINK", context.existingLink)
  const card = parseCardUrl(context.existingLink);
  console.log("CARD AFTER parseCardUrl", card)

  if (card) {
    return { 
      success: true, 
      action: 'PREVIEW_ONLY', 
      cardMetadata: card, // <--- MAKE SURE THIS LINE SAYS 'cardMetadata: card'
      cardUrl: context.existingLink,
      message: "Card detected. Reviewing contents..." 
    };
  }



  // 🧪 STRATEGY 1: Convert typed text (e.g. "||>>>")
  const match = detectMarkerPattern(context.text);
  if (match) {
    return executeConversion(context, match, params);
  }

  // 📝 STRATEGY 2: Fresh Insertion / Wrapping Selection
  return executeInsertion(context, params);
}
