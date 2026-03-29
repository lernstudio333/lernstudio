// src/workflows/preview.ts

/**
 * The high-level workflow for the "Card Preview" feature in the Sidebar.
 * Navigation is driven by the document map (REST API) to avoid GAS reference
 * equality issues — paragraph positions are resolved by array index, not object identity.
 */
function getSurgicalPreview(direction: 'FORWARD' | 'BACKWARD' | 'CURRENT'): NavigationResponse {
  try {
    const doc = DocumentApp.getActiveDocument();
    const paragraphs = doc.getBody().getParagraphs();

    // 1. DOCUMENT MAP: Fetch all entries and filter to card entries only
    const allParas: StructuredParagraph[] = gatherDocumentMap(doc.getId());
    const cardParas = allParas.filter(p => p.cardMetadata !== null);
    debugLog('getSurgicalPreview:documentMap', cardParas);

    if (cardParas.length === 0) {
      return { success: false, message: "No cards found in this document." };
    }

    // 2. CURRENT POSITION: detect which card (if any) the cursor is on.
    //    urlA: whole-paragraph scan — finds link even if cursor is in a different text run.
    //    urlB: single-offset check — reliable only when moveCursorToCardLink() placed the cursor.
    //    Both are logged so we can compare their behaviour across scenarios.
    const cursor = doc.getCursor();
    let currentCardIdx = -1;
    let urlA: string | null = null;
    let urlB: string | null = null;
    let cursorRunText = '';

    if (cursor) {
      const el         = cursor.getSurroundingText();
      const off        = cursor.getSurroundingTextOffset();
      cursorRunText    = el.getText().replace(/\n$/, '');
      urlB             = el.getLinkUrl(Math.max(0, off - 1));
      const cursorPara = getParaFromElement(cursor.getElement());
      urlA             = cursorPara ? findCardUrlInParagraph(cursorPara) : null;

      debugLog('getSurgicalPreview:currentCard:detection', { urlA, urlB, cursorRunText, agree: urlA === urlB });

      const meta = parseCardUrl(urlA);
      if (meta) {
        currentCardIdx = cardParas.findIndex(p => p.cardMetadata!.id === meta.id);
        debugLog('getSurgicalPreview:currentCard', { urlA, currentCardIdx });
      } else {
        debugLog('getSurgicalPreview:currentCard', {
          urlA, reason: urlA ? 'not a Lern-Studio card URL' : 'no card link in current paragraph'
        });
      }
    }

    // 3. NAVIGATION
    let targetEntry: StructuredParagraph | null = null;

    if (direction === 'CURRENT') {
      if (currentCardIdx === -1) {
        return { success: false, message: "No card at cursor position. Click a card link first." };
      }
      targetEntry = cardParas[currentCardIdx];

    } else {
      if (currentCardIdx !== -1) {
        // CASE 1: Cursor is in a card paragraph.
        // Always determine dirCursorToCard first, then decide whether to show this card or advance.
        //   cursor before link → need to move FORWARD to reach the link
        //   cursor after link  → need to move BACKWARD to reach the link
        // If cursor is NOT already on the link (urlB === null) and direction matches dirCursorToCard:
        //   → show this card (we are moving toward it).
        // Otherwise (cursor IS on the link, or moving away from it):
        //   → advance to adjacent card. Only here can we hit a boundary error.
        const entry = cardParas[currentCardIdx];
        const cursorIsBeforeLink = cursorRunText === '' || entry.textBeforeLink.includes(cursorRunText);
        const dirCursorToCard    = cursorIsBeforeLink ? 'FORWARD' : 'BACKWARD';
        debugLog('getSurgicalPreview:cursorInCardPara', { cursorRunText, urlB, cursorIsBeforeLink, dirCursorToCard, direction });

        if (urlB === null && direction === dirCursorToCard) {
          targetEntry = entry; // moving toward the link — show this card
        } else {
          // Cursor is on the link (urlB !== null) or moving away from it — step to adjacent card
          const nextIdx = currentCardIdx + (direction === 'FORWARD' ? 1 : -1);
          if (nextIdx < 0                  && direction === 'BACKWARD') return { success: false, message: "Already at the first card." };
          if (nextIdx >= cardParas.length  && direction === 'FORWARD')  return { success: false, message: "Already at the last card." };

          targetEntry = cardParas[nextIdx];
        }

      } else {
        // CASE 2: cursor is not in any card paragraph — navigate to nearest card by document position.
        const cursorDocIdx = cursor ? getCursorDocIndex(allParas, cursor) : -1;
        debugLog('getSurgicalPreview:cursorOutsideCardPara', { cursorDocIdx });

        if (cursorDocIdx !== -1) {
          targetEntry = direction === 'FORWARD'
            ? cardParas.find(cp => cp.index > cursorDocIdx) || null
            : [...cardParas].reverse().find(cp => cp.index < cursorDocIdx) || null;
        } else {
          // Can't determine position — go to first or last card
          targetEntry = direction === 'FORWARD' ? cardParas[0] : cardParas[cardParas.length - 1];
        }
        if (!targetEntry) {
          return { success: false, message: direction === 'FORWARD' ? "No more cards after this position." : "No cards before this position." };
        }
      }
    }

    // 4. GET PARAGRAPH: Direct array index — no reference equality needed
    const targetPara = paragraphs[targetEntry.index];
    if (!targetPara) {
      debugLog('getSurgicalPreview:missingPara', { entryIndex: targetEntry.index, paragraphCount: paragraphs.length });
      return { success: false, message: "Card paragraph not found in document." };
    }

    // 5. EXTRACTION: Build the RawCard (parents + children)
    const entryIdx = allParas.indexOf(targetEntry); // safe: same JS array, no GAS wrapper issue
    const card: RawCard = buildRawCard(allParas, entryIdx);

    // 6. UI SYNC: Move cursor to the card paragraph when navigating
    if (direction !== 'CURRENT') {
      moveCursorToCardLink(targetPara, targetEntry.linkCharOffset);
    }

    const res = { success: true, card };
    debugLog('getSurgicalPreview', res);
    return res;

  } catch (e) {
    return logError('getSurgicalPreview', e);
  }
}
