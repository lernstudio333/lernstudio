/**
 * src/harvester/transformer.ts
 * Pure function: converts a RawCard (document-side model) into an ApiCard (API payload).
 * No GAS dependencies — safe to unit-test in Node.js.
 *
 * The `export` keyword is stripped by flatten-all.js before GAS compilation,
 * making rawCardToApiCard a plain global function in the deployed script.
 */
export function rawCardToApiCard(rawCard: RawCard, docId: string): ApiCard {
  return {
    extId:    `${docId}#${rawCard.cardId}`,
    cardType: rawCard.type,
    question: rawCard.question,
    answer:   rawCard.answer,
    position: rawCard.rowIndex
  };
}
