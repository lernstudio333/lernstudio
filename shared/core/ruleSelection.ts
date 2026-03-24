import { CardTypes, SupersedeMode } from './enums.ts';
import type { BasicCard, QuizzingRule } from './enums.ts';
import { shuffleArray } from './utils.ts';

/**
 * Returns true if a QuizzingRule is compatible with the current card shape.
 *
 * Checks two things:
 *   1. The rule's static filter (e.g. allowTypedAnswer, allowArrangeOrder) —
 *      these look at the BasicCard's answer structure.
 *   2. An optional `viable` callback for runtime constraints that can't be
 *      expressed as a static filter (e.g. MC needs enough distractors).
 *
 * Note: min_score eligibility is NOT checked here — that belongs to the pool
 * construction step in selectQuizzingRule.
 */
export function isValidQuizMode(
  rule:     QuizzingRule,
  basicCard: BasicCard,
  viable?:  (rule: QuizzingRule) => boolean,
): boolean {
  const blockedByFlag = rule.blockedBy?.some(f => (basicCard.flags ?? []).includes(f)) ?? false;
  return !blockedByFlag &&
         (rule.filter === null || rule.filter(basicCard)) &&
         (viable === undefined  || viable(rule));
}

/**
 * Selects a QuizzingRule for a card given its type, score, and current BasicCard shape.
 *
 * Algorithm:
 * 1. Find base = highest applicable REPLACE_LOWER rule (score >= min_score)
 * 2. Collect all applicable POOL rules (score >= min_score, filter not yet checked)
 * 3. Shuffle [base, ...poolCandidates]; try each via isValidQuizMode — skip failures
 * 4. If pool exhausted: descend the REPLACE_LOWER chain (high → low), same check
 * 5. Ultimate fallback: rules[0] (DISPLAY_ANSWER — always filter:null)
 *
 * @param cardType  Card type key (e.g. 'SINGLE_CARD', 'MULTI_CARD')
 * @param score     Current learning score for this card
 * @param basicCard Transformed card — used by isValidQuizMode for filter evaluation
 * @param viable    Optional runtime check (e.g. MC needs enough distractors).
 *                  Static card-shape checks should live in the rule's filter fn.
 */
export function selectQuizzingRule(
  cardType:  string,
  score:     number,
  basicCard: BasicCard,
  viable?:   (rule: QuizzingRule) => boolean,
): QuizzingRule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rules: QuizzingRule[] = (CardTypes.from(cardType) as any).quizzing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?? (CardTypes.SINGLE_CARD as any).quizzing as QuizzingRule[];

  // REPLACE_LOWER chain, ascending by min_score (index 0 = simplest)
  const replaceChain = rules.filter(r =>
    r.supersede === SupersedeMode.REPLACE_LOWER && score >= r.min_score,
  );
  const base: QuizzingRule = replaceChain[replaceChain.length - 1] ?? rules[0];

  // POOL candidates — isValidQuizMode checked inside the loop
  const poolCandidates = rules.filter(r =>
    r.supersede === SupersedeMode.POOL && score >= r.min_score,
  );

  // Try pool in random order
  const pool = shuffleArray([base, ...poolCandidates]);
  for (const rule of pool) {
    if (isValidQuizMode(rule, basicCard, viable)) return rule;
  }

  // Pool exhausted: descend REPLACE_LOWER chain
  for (let i = replaceChain.length - 1; i >= 0; i--) {
    if (isValidQuizMode(replaceChain[i], basicCard, viable)) return replaceChain[i];
  }

  // Ultimate fallback (DISPLAY_ANSWER — filter: null, always passes)
  return rules[0];
}
