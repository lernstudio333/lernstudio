/**
 * Returns the display text of a row for use as a parent breadcrumb or child answer.
 *
 * - No card link:   textBeforeLink (equals full text since all content goes there when no link exists)
 * - Non-GAP card:   textBeforeLink + textAfterLink joined (marker/link text stripped)
 * - GAP card:       textBeforeLink + linkText + textAfterLink joined (full sentence, gap word shown as-is)
 *
 * Note: GAP cards show the real word here — the [...]  form is only used for the quiz question itself.
 */
function getRowDisplayText(para: StructuredParagraph): string {
  // For GAP cards include the real linked word; for all others (no link or marker cards) strip it
  const cleanLinkText = para.cardMetadata?.typeKey === 'GAP' ? para.linkText : '';
  const result = [para.textBeforeLink, cleanLinkText, para.textAfterLink].filter(Boolean).join(' ');
  debugLog('getRowDisplayText', { text: para.text, type: para.cardMetadata?.typeKey, result });
  return result;
}

/**
 * Builds a full RawCard by analysing the document map around a specific index.
 * question and answer are derived from the paragraph's before/link/after split.
 */
export function buildRawCard(allParas: StructuredParagraph[], index: number): RawCard {
  const para =allParas[index];
  if (!para.cardMetadata) throw new Error("No card metadata at index " + index);

  const type = para.cardMetadata.typeKey;
  let question: string;
  let answer: string | string[] | undefined;
  let warning: string | undefined;

  if (type === 'GAP') {
    // Question = surrounding paragraph with the linked word replaced by [...]
    // Answer   = the linked word itself
    // trimEnd/trimStart: text runs from Google Docs already include surrounding spaces;
    // we trim them before adding exactly one space, to avoid doubles.
    const before = (para.textBeforeLink || '').trimEnd();
    const after  = (para.textAfterLink  || '').trimStart();
    question = `${before ? before + ' ' : ''}...${after ? ' ' + after : ''}`.trim();
    answer   = para.linkText;

  } else if (type === 'SINGLE_CARD') {
    // Question = text left of the marker
    // Answer   = text right of the marker
    question = para.textBeforeLink;
    answer   = para.textAfterLink || undefined;

  } else {
    // MULTI_CARD | SYNONYM | IMAGES
    // Question = text left of the marker; answers come from child paragraphs
    // Text to the right of the marker is unexpected — surface as a warning
    question = para.textBeforeLink;
    if (para.textAfterLink) {
      warning = `Unexpected text after marker: "${para.textAfterLink}"`;
    }
    const children = findDirectChildren(allParas, index);
    answer = children.length > 0 ? children : undefined;
  }

  const card: RawCard = {
    cardId:   para.cardMetadata.id,
    type,
    question: question.trim(),
    answer:   typeof answer === 'string' ? (answer.trim() || undefined) : answer,
    parents:  findParentContext(allParas, index, para.cardMetadata.includeAbove),
    flags:    para.cardMetadata.flags,
    rowIndex: index,
    fullUrl:  para.cardMetadata.fullUrl,
    warning
  };
  debugLog('buildRawCard', card);
  return card;
}

function findParentContext(allParas: StructuredParagraph[], startIdx: number, includeAbove: number): string[] {
  const parents: string[] = [];
  const startPara = allParas[startIdx];
  let currentLevel = startPara.level === -1 ? 99 : startPara.level;

  for (let i = startIdx - 1; i >= 0; i--) {
    const para = allParas[i];
    if (para.level < currentLevel) {
      if (parents.length >= includeAbove) break;
      parents.unshift(getRowDisplayText(para));
      currentLevel = para.level;
    }
  }
  return parents;
}

function findDirectChildren(allParas: StructuredParagraph[], startIdx: number): string[] {
  const children: string[] = [];
  const startLevel = allParas[startIdx].level;

  for (let i = startIdx + 1; i < allParas.length; i++) {
    const para =allParas[i];
    // For normal paragraphs (level -1): stop at the next normal paragraph.
    // For bullet items: stop when a sibling or ancestor bullet appears.
    if (startLevel === -1 ? para.level === -1 : (para.level <= startLevel && para.level !== -1)) break;
    if (para.level === startLevel + 1) {
      children.push(getRowDisplayText(para));
    }
  }
  return children;
}
