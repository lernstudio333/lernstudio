/**
 * Returns the paragraph element that contains a Lern-Studio card link,
 * searching forward or backward from the current cursor position.
 */
function findNearestLinkInDoc(direction: 'NEXT' | 'PREVIOUS'): GoogleAppsScript.Document.Paragraph | null {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return null;

  const paragraphs = doc.getBody().getParagraphs();
  const currentPara = getParaFromElement(cursor.getElement());
  const index = paragraphs.indexOf(currentPara);
  const step = direction === 'NEXT' ? 1 : -1;

  for (let i = index + step; i >= 0 && i < paragraphs.length; i += step) {
    const url = findCardUrlInParagraph(paragraphs[i]);
    if (url) {
      debugLog('findNearestLinkInDoc', { direction, foundAt: i, text: paragraphs[i].getText(), url });
      return paragraphs[i];
    }
  }
  debugLog('findNearestLinkInDoc', { direction, foundAt: null });
  return null;
}

/**
 * Moves the document cursor to the start of the given paragraph.
 */
function moveCursorToPara(para: GoogleAppsScript.Document.Paragraph): void {
  const doc = DocumentApp.getActiveDocument();
  doc.setCursor(doc.newPosition(para, 0));
}

/**
 * Returns the first Lern-Studio card URL found in a paragraph, or null.
 * Uses getTextAttributeIndices() to only check positions where the text style
 * changes — efficient because it avoids iterating every character.
 */
function findCardUrlInParagraph(para: GoogleAppsScript.Document.Paragraph): string | null {
  const text = para.editAsText();
  const indices = text.getTextAttributeIndices();
  for (const i of indices) {
    const url = text.getLinkUrl(i);
    if (url && parseCardUrl(url)) return url;
  }
  return null;
}

/**
 * Safely returns the Paragraph that contains the given element.
 * Handles both the case where getElement() returns a Text node (most common
 * when cursor is inside a text run) and where it returns the Paragraph directly.
 */
function getParaFromElement(element: GoogleAppsScript.Document.Element): GoogleAppsScript.Document.Paragraph {
  if (element.getType() === DocumentApp.ElementType.PARAGRAPH) {
    return element.asParagraph();
  }
  return element.getParent().asParagraph();
}
