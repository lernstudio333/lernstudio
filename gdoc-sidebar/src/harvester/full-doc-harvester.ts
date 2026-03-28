function getFullDocumentCards(): RawCard[] {
  const docId = DocumentApp.getActiveDocument().getId();
  
  // VS Code knows this exists because it scanned api.ts
  const allRows: NormalizedRow[] = gatherDocumentMap(docId); 

  return allRows
    .filter(row => row.cardMetadata !== null)
    .map(row => buildRawCard(allRows, row.index)); // Scanned from extraction.ts
}
