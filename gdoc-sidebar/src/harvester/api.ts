// --------------------
// Helper functions
// --------------------

function getElText(el: any): string {
  return el.textRun?.content || '';
}

function getElLinkUrl(el: any): string | null {
  return el.textRun?.textStyle?.link?.url || null;
}

function isLink(el: any): boolean {
  return !!getElLinkUrl(el);
}

function trimLeadingAndTrailingNewlines(text: string): string {
  return text.replace(/^\n+|\n+$/g, '');
}

// Partition paragraph elements into three segments: before / link / after
function segmentParagraph(elements: any[] = []) {
  let beforeText = '';
  let afterText = '';
  let firstLink: { text: string; url: string | null; charOffset: number } | null = null;

  const firstLinkIndex = elements.findIndex(isLink);

  if (firstLinkIndex !== -1) {
    const beforeRaw = elements.slice(0, firstLinkIndex).map(getElText).join('');

    const linkElement = elements[firstLinkIndex];
    firstLink = {
      text: getElText(linkElement),
      url: getElLinkUrl(linkElement),
      charOffset: beforeRaw.length  // exact char position before trimming
    };

    beforeText = trimLeadingAndTrailingNewlines(beforeRaw);
    firstLink.text = trimLeadingAndTrailingNewlines(firstLink.text).trim();
    afterText = trimLeadingAndTrailingNewlines(elements.slice(firstLinkIndex + 1).map(getElText).join(''));
  } else {
    beforeText = trimLeadingAndTrailingNewlines(elements.map(getElText).join(''));
  }

  return { beforeText, afterText, firstLink };
}

function isParagraph(item: any): item is { paragraph: any } {
  return "paragraph" in item;
}

function getBulletLevel(p: any): number {
  return p.bullet ? (p.bullet.nestingLevel ?? 0) : -1;
}

function createStructuredParagraph(idx: number, level: number, segments: ReturnType<typeof segmentParagraph>): StructuredParagraph {
  const text = (segments.beforeText + (segments.firstLink?.text || '') + segments.afterText).replace(/\n$/, '').trim();

  const para: StructuredParagraph = {
    index: idx,
    text,
    level,
    cardMetadata:   segments.firstLink ? parseCardUrl(segments.firstLink.url) : null,
    textBeforeLink: segments.beforeText,
    linkText:       segments.firstLink?.text || '',
    textAfterLink:  segments.afterText,
    linkCharOffset: segments.firstLink?.charOffset ?? 0
  };

  if (para.cardMetadata) {
    debugLog('gatherDocumentMap:cardRow', {
      idx,
      text,
      textBeforeLink: para.textBeforeLink,
      linkText: para.linkText,
      textAfterLink: para.textAfterLink
    });
  }

  return para;
}

// --------------------
// Main function
// --------------------

function gatherDocumentMap(docId: string): StructuredParagraph[] {
  const gDocItems = Docs.Documents!.get(docId, { fields: 'body/content' });
  if (!gDocItems.body?.content) return [];

  // Extract only paragraphs
  const paragraphs = gDocItems.body.content.filter(isParagraph);

  // Transform paragraphs into structured paragraph objects
  return paragraphs.map((item, idx) => {
    const p = item.paragraph!;
    const level = getBulletLevel(p);
    const segments = segmentParagraph(p.elements || []);
    return createStructuredParagraph(idx, level, segments);
  });
}
