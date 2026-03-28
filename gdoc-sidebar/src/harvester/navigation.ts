function findNearestLinkInDoc(direction: 'NEXT' | 'PREVIOUS'): GoogleAppsScript.Document.Paragraph | null {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) return null;

  const paragraphs = doc.getBody().getParagraphs();
  const currentPara = cursor.getElement().asParagraph();
  let index = paragraphs.indexOf(currentPara);
  const step = (direction === 'NEXT') ? 1 : -1;

  for (let i = index + step; i >= 0 && i < paragraphs.length; i += step) {
    const p = paragraphs[i];
    if (p.getLinkUrl()) { // Basic check first
       const meta = parseCardUrl(p.getLinkUrl()!);
       if (meta) return p;
    }
  }
  return null;
}

function moveCursorToPara(para: GoogleAppsScript.Document.Paragraph): void {
  const doc = DocumentApp.getActiveDocument();
  doc.setCursor(doc.newPosition(para, 0));
}