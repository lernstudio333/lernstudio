function getFullDocumentCards(): RawCard[] {
  const docId = DocumentApp.getActiveDocument().getId();
  
  // VS Code knows this exists because it scanned api.ts
  const allParas: StructuredParagraph[] = gatherDocumentMap(docId); 

  return allParas
    .filter(para => para.cardMetadata !== null)
    .map(para => buildRawCard(allParas, para.index)); // Scanned from extraction.ts
}
