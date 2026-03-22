import { describe, it, expect } from 'vitest';
import { isCardQuizzable } from './cardValidation.ts';
import type { StudyCard } from './types.ts';

function card(overrides: Partial<StudyCard> = {}): StudyCard {
  return {
    id:       'test-id',
    cardType: 'SINGLE_CARD',
    question: 'What is X?',
    tip:      null,
    position: 0,
    answers:  [{ answerText: 'X', imagePath: null, position: 0 }],
    ...overrides,
  };
}

// ── Question checks ───────────────────────────────────────────

describe('isCardQuizzable — question', () => {

  it('passes when question is non-empty', () => {
    expect(isCardQuizzable(card())).toBe(true);
  });

  it('fails when question is empty string', () => {
    expect(isCardQuizzable(card({ question: '' }))).toBe(false);
  });

  it('fails when question is whitespace only', () => {
    expect(isCardQuizzable(card({ question: '   ' }))).toBe(false);
  });

});

// ── Text answer cards (SINGLE_CARD, MULTI_CARD, SYNONYM, GAP) ─

describe('isCardQuizzable — text answer cards', () => {

  it('passes with one non-empty answer', () => {
    expect(isCardQuizzable(card())).toBe(true);
  });

  it('passes with multiple answers when at least one is non-empty', () => {
    expect(isCardQuizzable(card({
      answers: [
        { answerText: null,  imagePath: null, position: 0 },
        { answerText: 'ok',  imagePath: null, position: 1 },
      ],
    }))).toBe(true);
  });

  it('fails when all answers have empty answerText', () => {
    expect(isCardQuizzable(card({
      answers: [{ answerText: '',   imagePath: null, position: 0 }],
    }))).toBe(false);
  });

  it('fails when all answers have null answerText', () => {
    expect(isCardQuizzable(card({
      answers: [{ answerText: null, imagePath: null, position: 0 }],
    }))).toBe(false);
  });

  it('fails when all answers have whitespace-only answerText', () => {
    expect(isCardQuizzable(card({
      answers: [{ answerText: '  ', imagePath: null, position: 0 }],
    }))).toBe(false);
  });

  it('fails when answers array is empty', () => {
    expect(isCardQuizzable(card({ answers: [] }))).toBe(false);
  });

  it('works for MULTI_CARD type', () => {
    expect(isCardQuizzable(card({
      cardType: 'MULTI_CARD',
      answers:  [
        { answerText: 'part 1', imagePath: null, position: 0 },
        { answerText: 'part 2', imagePath: null, position: 1 },
      ],
    }))).toBe(true);
  });

});

// ── IMAGES cards ─────────────────────────────────────────────

describe('isCardQuizzable — IMAGES cards', () => {

  it('passes when at least one answer has imagePath', () => {
    expect(isCardQuizzable(card({
      cardType: 'IMAGES',
      answers:  [{ answerText: null, imagePath: 'media/photo.jpg', position: 0 }],
    }))).toBe(true);
  });

  it('passes with multiple image answers', () => {
    expect(isCardQuizzable(card({
      cardType: 'IMAGES',
      answers:  [
        { answerText: null, imagePath: 'media/a.jpg', position: 0 },
        { answerText: null, imagePath: 'media/b.jpg', position: 1 },
      ],
    }))).toBe(true);
  });

  it('fails when no answer has imagePath', () => {
    expect(isCardQuizzable(card({
      cardType: 'IMAGES',
      answers:  [{ answerText: null, imagePath: null, position: 0 }],
    }))).toBe(false);
  });

  it('fails when answers array is empty', () => {
    expect(isCardQuizzable(card({
      cardType: 'IMAGES',
      answers:  [],
    }))).toBe(false);
  });

});
