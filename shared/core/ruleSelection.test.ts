import { describe, it, expect, vi, afterEach } from 'vitest';
import { selectQuizzingRule, isValidQuizMode } from './ruleSelection.ts';
import { CardTypes, QuizMode, allowTypedAnswer, allowArrangeOrder } from './enums.ts';
import type { BasicCard, QuizzingRule } from './enums.ts';

// ── Helpers ───────────────────────────────────────────────────

function card(answer: BasicCard['answer'], cardType = 'SINGLE_CARD'): BasicCard {
  return { cardType, question: 'Q', answer };
}

/** Pull the quizzing rules array for a card type (bypasses private typing). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rulesFor(cardType: string): QuizzingRule[] {
  return (CardTypes.from(cardType) as any).quizzing;
}

function ruleWithMode(modeKey: string, cardType = 'SINGLE_CARD'): QuizzingRule {
  return rulesFor(cardType).find(r => String(r.mode) === modeKey)!;
}

afterEach(() => { vi.restoreAllMocks(); });

// ─────────────────────────────────────────────────────────────
// isValidQuizMode
// ─────────────────────────────────────────────────────────────

describe('isValidQuizMode', () => {

  it('passes when filter is null', () => {
    const rule = ruleWithMode('DISPLAY_ANSWER');
    expect(isValidQuizMode(rule, card('anything'))).toBe(true);
  });

  it('allowTypedAnswer: passes for single-element short string[]', () => {
    const rule = ruleWithMode('TYPED_ANSWER');
    expect(isValidQuizMode(rule, card(['abc']))).toBe(true);
  });

  it('allowTypedAnswer: fails for single-element string[] exceeding MAX_TYPED_ANSWER_LENGTH', () => {
    const rule = ruleWithMode('TYPED_ANSWER');
    expect(isValidQuizMode(rule, card(['toolongstring']))).toBe(false);
  });

  it('allowTypedAnswer: fails for multi-element string[]', () => {
    const rule = ruleWithMode('TYPED_ANSWER');
    expect(isValidQuizMode(rule, card(['part1', 'part2']))).toBe(false);
  });

  it('allowArrangeOrder: passes for string[] with ≥2 items', () => {
    const rule = ruleWithMode('ARRANGE_ORDER', 'MULTI_CARD');
    expect(isValidQuizMode(rule, card(['A', 'B'], 'MULTI_CARD'))).toBe(true);
    expect(isValidQuizMode(rule, card(['A', 'B', 'C'], 'MULTI_CARD'))).toBe(true);
  });

  it('allowArrangeOrder: fails for string[] with fewer than MIN_ARRANGE_ORDER_PARTS', () => {
    const rule = ruleWithMode('ARRANGE_ORDER', 'MULTI_CARD');
    expect(isValidQuizMode(rule, card(['only one'], 'MULTI_CARD'))).toBe(false);
  });

  it('allowArrangeOrder: fails for plain string answer', () => {
    const rule = ruleWithMode('ARRANGE_ORDER', 'MULTI_CARD');
    expect(isValidQuizMode(rule, card('plain string', 'MULTI_CARD'))).toBe(false);
  });

  it('viable callback can veto a rule that passes the filter', () => {
    const rule = ruleWithMode('DISPLAY_ANSWER');
    expect(isValidQuizMode(rule, card('x'), () => false)).toBe(false);
  });

  it('viable callback is not called when filter already fails', () => {
    const rule      = ruleWithMode('TYPED_ANSWER');
    const viableSpy = vi.fn(() => true);
    isValidQuizMode(rule, card('toolongstring'), viableSpy);
    expect(viableSpy).not.toHaveBeenCalled();
  });

  it('both filter and viable must pass', () => {
    const rule = ruleWithMode('TYPED_ANSWER');
    // short answer (filter passes) but viable rejects
    expect(isValidQuizMode(rule, card(['ok']), () => false)).toBe(false);
    // short answer (filter passes) and viable accepts
    expect(isValidQuizMode(rule, card(['ok']), () => true)).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────
// selectQuizzingRule
//
// shuffleArray with Math.random = 0.1 always uses j = floor(0.1 * (i+1)):
//   pool of 1: [A]           → [A]          first = A
//   pool of 2: [A,B]         → [B,A]        first = B
//   pool of 3: [A,B,C]       → [C,B,A] → [B,C,A]   first = B
//   pool of 4: [A,B,C,D]     → [B,C,D,A]   first = B
// ─────────────────────────────────────────────────────────────

describe('selectQuizzingRule', () => {

  it('score 0 → always DISPLAY_ANSWER (only eligible rule)', () => {
    // No randomness involved: only 1 rule in pool
    const result = selectQuizzingRule('SINGLE_CARD', 0, card('anything'));
    expect(String(result.mode)).toBe('DISPLAY_ANSWER');
  });

  it('score 1 → MULTIPLE_CHOICE base (no POOL rules eligible yet)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // pool = [MC(1)] — only base, no pool candidates at score 1
    const result = selectQuizzingRule('SINGLE_CARD', 1, card('anything'));
    expect(String(result.mode)).toBe('MULTIPLE_CHOICE');
  });

  it('score 5 with long answer → SELF_ASSESSMENT (TYPED_ANSWER filtered out)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // pool = [MC_rand(base), TYPED_ANSWER, SA] at score 5
    // shuffleArray([base, TYPED, SA], 3):
    //   i=2: j=floor(0.1*3)=0 → swap [0]↔[2] → [SA, TYPED, base]
    //   i=1: j=floor(0.1*2)=0 → swap [0]↔[1] → [TYPED, SA, base]
    // first = TYPED_ANSWER → filter fails (>1 element array)
    // next  = SA           → filter null  → ✓
    const result = selectQuizzingRule('SINGLE_CARD', 5, card(['this', 'answer', 'is', 'too', 'long']));
    expect(String(result.mode)).toBe('SELF_ASSESSMENT');
  });

  it('score 5 with short single-element answer → TYPED_ANSWER wins the shuffle', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // same shuffle order as above → first = TYPED_ANSWER → filter passes (1-element, short)
    const result = selectQuizzingRule('SINGLE_CARD', 5, card(['abc']));
    expect(String(result.mode)).toBe('TYPED_ANSWER');
  });

  it('viable callback prevents MC → falls back to DISPLAY_ANSWER', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // score 1: pool = [MC], but viable rejects MC
    // pool exhausted → descend replaceChain [DA(0), MC(1)] from high to low
    // MC fails viable → DA passes → return DA
    const result = selectQuizzingRule(
      'SINGLE_CARD', 1, card('x'),
      r => String(r.mode) !== 'MULTIPLE_CHOICE',
    );
    expect(String(result.mode)).toBe('DISPLAY_ANSWER');
  });

  it('MULTI_CARD score 3 with 2-part answer includes ARRANGE_ORDER in pool', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // pool = [MC_rand(base), ARRANGE_ORDER(pool)]
    // shuffleArray([MC_rand, ARRANGE], 2):
    //   i=1: j=floor(0.1*2)=0 → swap [0]↔[1] → [ARRANGE, MC_rand]
    // first = ARRANGE_ORDER → allowArrangeOrder(['A','B']) passes → ✓
    const result = selectQuizzingRule('MULTI_CARD', 3, card(['A', 'B'], 'MULTI_CARD'));
    expect(String(result.mode)).toBe('ARRANGE_ORDER');
  });

  it('MULTI_CARD score 3 with 1-part answer → ARRANGE_ORDER filtered out → MC', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    // pool = [MC_rand, ARRANGE_ORDER]
    // shuffled → [ARRANGE, MC_rand]
    // ARRANGE fails allowArrangeOrder (only 1 part) → try MC_rand → filter null → ✓
    const result = selectQuizzingRule('MULTI_CARD', 3, card(['only one'], 'MULTI_CARD'));
    expect(String(result.mode)).toBe('MULTIPLE_CHOICE');
  });

  it('unknown cardType falls back to SINGLE_CARD rules', () => {
    const result = selectQuizzingRule('UNKNOWN_TYPE', 0, card('x'));
    expect(String(result.mode)).toBe('DISPLAY_ANSWER');
  });

  it('ultimate fallback: all rules rejected → rules[0] returned', () => {
    // Reject everything via viable — even the fallback should not trigger in practice,
    // but the function must not throw
    const result = selectQuizzingRule('SINGLE_CARD', 0, card('x'), () => false);
    expect(String(result.mode)).toBe('DISPLAY_ANSWER'); // rules[0] is returned unguarded
  });

});
