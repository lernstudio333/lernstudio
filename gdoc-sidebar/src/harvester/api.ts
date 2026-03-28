/**
 * Fetches the document via REST API and flattens it into a map.
 */
function gatherDocumentMap(docId: string): NormalizedRow[] {
  const apiDoc = Docs.Documents!.get(docId, { fields: 'body/content' });
  if (!apiDoc.body?.content) return [];

  return apiDoc.body.content
    .filter(item => "paragraph" in item)
    .map((item, idx) => {
      const p = item.paragraph!;
      const text = p.elements?.map(e => e.textRun?.content || "").join("").trim() || "";
      const level = p.bullet ? (p.bullet.nestingLevel || 0) : -1;
      
      // Find link in elements
      let url: string | null = null;
      p.elements?.some(e => {
        if (e.textRun?.textStyle?.link?.url) {
          url = e.textRun.textStyle.link.url;
          return true;
        }
        return false;
      });

      return {
        index: idx,
        text: text,
        level: level,
        cardMetadata: url ? parseCardUrl(url) : null // From models/Metadata.ts
      };
    });
}
