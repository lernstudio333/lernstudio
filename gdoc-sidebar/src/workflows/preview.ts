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
      targetPara = cursor ? getParaFromElement(cursor.getElement()) : null;
    } else {
      // Look for the next/previous paragraph that contains a Lern-Studio link
      targetPara = findNearestLinkInDoc(direction); // From harvester/navigation.ts
    }

    if (!targetPara) {
      const res = { success: false, message: `No card found ${direction.toLowerCase()}.` };
      debugLog('getSurgicalPreview', res);
      return res;
    }

    // 2. API: Fetch the document map via REST API
    const docId = doc.getId();
    const allRows: NormalizedRow[] = gatherDocumentMap(docId);
    debugLog('getSurgicalPreview:documentMap', allRows.filter(r => r.cardMetadata !== null));

    // 3. MAPPING: Find the index of the target paragraph in the map
    const targetText = targetPara.getText().trim();
    const rowIndex = allRows.findIndex(r => r.text === targetText && r.cardMetadata !== null);

    if (rowIndex === -1) {
      const res = { success: false, message: "Found a link, but it's not a valid Lern-Studio card." };
      debugLog('getSurgicalPreview', res);
      return res;
    }

    // 4. EXTRACTION: Build the RawCard (parents + children)
    const card: RawCard = buildRawCard(allRows, rowIndex);

    // 5. UI SYNC: Move cursor to the card paragraph if we navigated
    if (direction !== 'CURRENT') {
      moveCursorToPara(targetPara);
    }

    const res = { success: true, card };
    debugLog('getSurgicalPreview', res);
    return res;

  } catch (e) {
    return logError('getSurgicalPreview', e);
  }
}