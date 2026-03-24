import { describe, it, expect } from 'vitest';
import { diffCard, normalizeAnswers } from './cardDiff.ts';
import type { ExistingCardSnapshot } from './types.ts';

const base: ExistingCardSnapshot = {
  card_type: 'SINGLE_CARD',
  question:  'What is the capital of France?',
  tip:       null,
  details:   null,
  source:    null,
  position:  0,
  answers:   ['Paris'],
};

describe('diffCard', () => {
  it('returns empty array when nothing differs', () => {
    expect(diffCard({
      extId:    'x',
      cardType: 'SINGLE_CARD',
      question: 'What is the capital of France?',
      answer:   'Paris',
      position: 0,
    }, base)).toEqual([]);
  });

  it('detects changed question', () => {
    expect(diffCard({ extId: 'x', question: 'Changed?' }, base)).toContain('question');
  });

  it('detects changed card_type', () => {
    expect(diffCard({ extId: 'x', question: base.question, cardType: 'GAP' }, base)).toContain('card_type');
  });

  it('detects changed answer (string → different string)', () => {
    expect(diffCard({ extId: 'x', question: base.question, answer: 'Berlin' }, base)).toContain('answer');
  });

  it('detects changed answer (string → array)', () => {
    expect(diffCard({ extId: 'x', question: base.question, answer: ['Paris', 'Lyon'] }, base)).toContain('answer');
  });

  it('does not report unchanged answer', () => {
    expect(diffCard({ extId: 'x', question: base.question, answer: 'Paris' }, base)).not.toContain('answer');
  });

  it('does not report answer when answer is omitted', () => {
    expect(diffCard({ extId: 'x', question: base.question }, base)).not.toContain('answer');
  });

  it('detects changed tip (null → value)', () => {
    expect(diffCard({ extId: 'x', question: base.question, tip: 'Hint' }, base)).toContain('tip');
  });

  it('treats empty string as null for tip', () => {
    // existing tip is null; empty string incoming should not flag a change
    expect(diffCard({ extId: 'x', question: base.question, tip: '' }, base)).not.toContain('tip');
  });

  it('detects changed position', () => {
    expect(diffCard({ extId: 'x', question: base.question, position: 5 }, base)).toContain('position');
  });

  it('returns multiple changed fields', () => {
    const changes = diffCard({ extId: 'x', question: 'New?', position: 3 }, base);
    expect(changes).toContain('question');
    expect(changes).toContain('position');
  });
});

describe('normalizeAnswers', () => {
  it('wraps a string in an array', () => {
    expect(normalizeAnswers('Paris')).toEqual(['Paris']);
  });

  it('returns an array unchanged', () => {
    expect(normalizeAnswers(['A', 'B'])).toEqual(['A', 'B']);
  });

  it('returns [] for undefined', () => {
    expect(normalizeAnswers(undefined)).toEqual([]);
  });
});
