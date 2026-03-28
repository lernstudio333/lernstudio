// src/workflows/preview.ts

/**
 * The high-level workflow for the "Card Preview" feature in the Sidebar.
 * It coordinates finding the card, mapping the document, and extracting metadata.
 */
function getSurgicalPreview(direction: 'NEXT' | 'PREVIOUS' | 'CURRENT'): NavigationResponse {
  try {
    const doc = DocumentApp.getActiveDocument();
    
    // 1. NAVIGATION: Find the target paragraph
    let targetPara: GoogleAppsScript.Document.Paragraph | null = null;
    
    if (direction === 'CURRENT') {
      // Try to get the paragraph where the user's cursor is currently sitting
      const cursor = doc.getCursor();
      targetPara = cursor ? cursor.getElement().asParagraph() : null;
    } else {
      // Look for the next/previous paragraph that contains a Lern-Studio link
      targetPara = findNearestLinkInDoc(direction); // From harvester/navigation.ts
    }

    if (!targetPara) {
      return { success: false, message: `No card found ${direction.toLowerCase()}.` };
    }

    // 2. API: Fetch the "Map" of the document via REST API for speed
    const docId = doc.getId();
    const allRows: NormalizedRow[] = gatherDocumentMap(docId); // From harvester/api.ts

    // 3. MAPPING: Find the index of our target paragraph within that map
    const targetText = targetPara.getText().trim();
    // We look for a row that matches the text AND has card metadata
    const rowIndex = allRows.findIndex(r => r.text === targetText && r.cardMetadata !== null);

    if (rowIndex === -1) {
      return { success: false, message: "Found a link, but it's not a valid Lern-Studio card." };
    }

    // 4. EXTRACTION: Build the rich RawCard object (Uphill context + Downhill children)
    const card: RawCard = buildRawCard(allRows, rowIndex); // From harvester/extraction.ts

    // 5. UI SYNC: If we navigated, move the physical cursor in the Doc to match
    if (direction !== 'CURRENT') {
      moveCursorToPara(targetPara); // From harvester/navigation.ts
    }

    return {
      success: true,
      card: card
    };

  } catch (e) {
    // Uses the centralized logger from system/util.ts
    return logError("Preview Workflow", e);
  }
}