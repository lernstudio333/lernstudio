/**
 * Builds a full RawCard by analyzing the map around a specific index.
 */
function buildRawCard(allRows: NormalizedRow[], index: number): RawCard {
  const row = allRows[index];
  if (!row.cardMetadata) throw new Error("No metadata found at index " + index);

  return {
    cardId: row.cardMetadata.id,
    type: row.cardMetadata.typeKey,
    question: row.text,
    parents: findParentContext(allRows, index, row.cardMetadata.includeAbove),
    directChildren: findDirectChildren(allRows, index),
    flags: row.cardMetadata.flags,
    rowIndex: index,
    fullUrl: row.cardMetadata.fullUrl
  };
}

function findParentContext(allRows: NormalizedRow[], startIdx: number, limit: number): string[] {
  const parents: string[] = [];
  const startRow = allRows[startIdx];
  let currentLevel = startRow.level === -1 ? 99 : startRow.level;

  // Search backwards for rows with a lower level (indentation)
  for (let i = startIdx - 1; i >= 0; i--) {
    const row = allRows[i];
    if (row.level !== -1 && row.level < currentLevel) {
      parents.unshift(row.text);
      currentLevel = row.level;
    }
    if (parents.length >= limit) break;
  }
  return parents;
}

function findDirectChildren(allRows: NormalizedRow[], startIdx: number): string[] {
  const children: string[] = [];
  const startLevel = allRows[startIdx].level;
  
  // If not a bullet, it can't have children in our model
  if (startLevel === -1) return [];

  for (let i = startIdx + 1; i < allRows.length; i++) {
    const row = allRows[i];
    // Stop if we hit a row that is at the same level or higher (closer to margin)
    if (row.level <= startLevel && row.level !== -1) break;
    // Only collect immediate children (startLevel + 1)
    if (row.level === startLevel + 1) {
      children.push(row.text);
    }
  }
  return children;
}
