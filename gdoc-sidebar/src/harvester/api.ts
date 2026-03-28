/**
 * Fetches the document via REST API and flattens it into a normalised row map.
 * Each row captures the paragraph's full text, indentation level, card metadata,
 * and the three-way split around the card link (before / link-text / after).
 */
function gatherDocumentMap(docId: string): NormalizedRow[] {
  const apiDoc = Docs.Documents!.get(docId, { fields: 'body/content' });
  if (!apiDoc.body?.content) return [];

  return apiDoc.body.content
    .filter(item => "paragraph" in item)
    .map((item, idx) => {
      const p = item.paragraph!;
      const level = p.bullet ? (p.bullet.nestingLevel || 0) : -1;

      // Split elements into before-link / link / after-link segments
      let textBeforeLink = '';
      let linkText = '';
      let textAfterLink = '';
      let url: string | null = null;
      let foundLink = false;

      (p.elements || []).forEach(e => {
        const content = e.textRun?.content || '';
        const linkUrl = e.textRun?.textStyle?.link?.url || null;

        if (!foundLink && linkUrl) {
          url = linkUrl;
          linkText = content;
          foundLink = true;
        } else if (!foundLink) {
          textBeforeLink += content;
        } else {
          textAfterLink += content;
        }
      });

      // Trim trailing newlines that the Docs API appends to paragraph content
      textBeforeLink = textBeforeLink.replace(/\n$/, '').trim();
      linkText       = linkText.replace(/\n$/, '').trim();
      textAfterLink  = textAfterLink.replace(/\n$/, '').trim();

      const text = (textBeforeLink + linkText + textAfterLink).trim();

      return {
        index:          idx,
        text,
        level,
        cardMetadata:   url ? parseCardUrl(url) : null,
        textBeforeLink,
        linkText,
        textAfterLink
      };
    });
}
