/**
 * Returns the display text of a row for use as a parent breadcrumb or child answer.
 *
 * - No card link:   textBeforeLink (equals full text since all content goes there when no link exists)
 * - Non-GAP card:   textBeforeLink + textAfterLink joined (marker/link text stripped)
 * - GAP card:       textBeforeLink + linkText + textAfterLink joined (full sentence, gap word shown as-is)
 *
 * Note: GAP cards show the real word here — the [...]  form is only used for the quiz question itself.
 */
function getRowDisplayText(row: NormalizedRow): string {
  // For GAP cards include the real linked word; for all others (no link or marker cards) strip it
  const cleanLinkText = row.cardMetadata?.typeKey === 'GAP' ? row.linkText : '';
  const result = [row.textBeforeLink, cleanLinkText, row.textAfterLink].filter(Boolean).join(' ');
  debugLog('getRowDisplayText', { text: row.text, type: row.cardMetadata?.typeKey, result });
  return result;
}

/**
 * Builds a full RawCard by analysing the document map around a specific index.
 * question and answer are derived from the paragraph's before/link/after split.
 */
function buildRawCard(allRows: NormalizedRow[], index: number): RawCard {
  const row = allRows[index];
  if (!row.cardMetadata) throw new Error("No card metadata at index " + index);

  const type = row.cardMetadata.typeKey;
  let question: string;
  let answer: string | undefined;
  let warning: string | undefined;

  if (type === 'GAP') {
    // Question = surrounding paragraph with the linked word replaced by [...]
    // Answer   = the linked word itself
    const left  = row.textBeforeLink ? row.textBeforeLink + ' ' : '';
    const right = row.textAfterLink  ? ' ' + row.textAfterLink  : '';
    question = `${left}[...]${right}`.trim();
    answer   = row.linkText;

  } else if (type === 'SINGLE_CARD') {
    // Question = text left of the marker
    // Answer   = text right of the marker
    question = row.textBeforeLink;
    answer   = row.textAfterLink || undefined;

  } else {
    // MULTI_CARD | SYNONYM | IMAGES
    // Question = text left of the marker; answers come from directChildren
    // Text to the right of the marker is unexpected — surface as a warning
    question = row.textBeforeLink;
    if (row.textAfterLink) {
      warning = `Unexpected text after marker: "${row.textAfterLink}"`;
    }
  }

  const card: RawCard = {
    cardId:         row.cardMetadata.id,
    type,
    question,
    answer,
    parents:        findParentContext(allRows, index, row.cardMetadata.includeAbove),
    directChildren: findDirectChildren(allRows, index),
    flags:          row.cardMetadata.flags,
    rowIndex:       index,
    fullUrl:        row.cardMetadata.fullUrl,
    warning
  };
  debugLog('buildRawCard', card);
  return card;
}

function findParentContext(allRows: NormalizedRow[], startIdx: number, limit: number): string[] {
  const parents: string[] = [];
  const startRow = allRows[startIdx];
  let currentLevel = startRow.level === -1 ? 99 : startRow.level;

  for (let i = startIdx - 1; i >= 0; i--) {
    const row = allRows[i];
    if (row.level !== -1 && row.level < currentLevel) {
      parents.unshift(getRowDisplayText(row));
      currentLevel = row.level;
    }
    if (parents.length >= limit) break;
  }
  return parents;
}

function findDirectChildren(allRows: NormalizedRow[], startIdx: number): string[] {
  const children: string[] = [];
  const startLevel = allRows[startIdx].level;

  if (startLevel === -1) return [];

  for (let i = startIdx + 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (row.level <= startLevel && row.level !== -1) break;
    if (row.level === startLevel + 1) {
      children.push(getRowDisplayText(row));
    }
  }
  return children;
}
