/**
 * Returns the paragraph element that contains a Lern-Studio card link,
 * searching forward or backward from the current cursor position.
 */
function findNearestLinkInDoc(direction: 'FORWARD' | 'BACKWARD'): GoogleAppsScript.Document.Paragraph | null {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return null;

  const paragraphs = doc.getBody().getParagraphs();
  const currentPara = getParaFromElement(cursor.getElement());
  if (!currentPara) return null;
  const index = paragraphs.indexOf(currentPara);
  const step = direction === 'FORWARD' ? 1 : -1;

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
 * Finds the approximate document paragraph index for the cursor's current paragraph.
 * Uses text matching against allParas — may be unreliable when multiple paragraphs share identical text.
 */
function getCursorDocIndex(allParas: StructuredParagraph[], cursor): number {
  const para = getParaFromElement(cursor.getElement());
  if (!para) return -1;
  const text = para.getText().replace(/\n$/, '').trim();
  const entry = allParas.find(p => p.text === text);
  return entry ? entry.index : -1;
}

/**
 * Moves the document cursor to the card link in the paragraph.
 * linkCharOffset is pre-computed in StructuredParagraph — no re-scanning needed.
 * Cursor is placed one character into the link so getLinkUrl(offset-1) finds it.
 */
function moveCursorToCardLink(para: GoogleAppsScript.Document.Paragraph, linkCharOffset: number): void {
  const doc = DocumentApp.getActiveDocument();
  doc.setCursor(doc.newPosition(para.editAsText(), linkCharOffset + 1));
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
function getParaFromElement(element: GoogleAppsScript.Document.Element): GoogleAppsScript.Document.Paragraph | null {
  const type = element.getType();
  if (type === DocumentApp.ElementType.PARAGRAPH) return element.asParagraph();
  if (type === DocumentApp.ElementType.LIST_ITEM)  return element.asListItem() as any;

  const parent = element.getParent();
  if (!parent) return null;
  const parentType = parent.getType();
  if (parentType === DocumentApp.ElementType.PARAGRAPH) return parent.asParagraph();
  if (parentType === DocumentApp.ElementType.LIST_ITEM)  return parent.asListItem() as any;

  return null; // e.g. BODY_SECTION, TABLE — no containing paragraph
}
