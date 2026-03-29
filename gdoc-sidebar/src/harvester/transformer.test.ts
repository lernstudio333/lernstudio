import { describe, it, expect } from 'vitest';
import { rawCardToApiCard } from './transformer';

const DOC_ID = 'doc-abc123';

describe('rawCardToApiCard — one test per card type', () => {

  it('SINGLE_CARD: question left of marker, answer right (depth=0, no parents)', () => {
    const raw = {
      cardId:  '1000000000001',
      type:    'SINGLE_CARD' as const,
      question: 'The powerhouse of the cell is',
      answer:  'the mitochondria',
      parents: [],
      flags:   [],
      rowIndex: 4,
      fullUrl: 'https://www.lern-studio.de?id=1000000000001&cardtype=SINGLE_CARD&depth=0'
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.extId).toBe('doc-abc123#1000000000001');
    expect(result.cardType).toBe('SINGLE_CARD');
    expect(result.question).toBe('The powerhouse of the cell is');
    expect(result.answer).toBe('the mitochondria');
    expect(result.position).toBe(4);
  });

  it('SINGLE_CARD: answer is undefined when nothing is right of the marker', () => {
    const raw = {
      cardId: '1000000000002', type: 'SINGLE_CARD' as const,
      question: 'Define osmosis', answer: undefined,
      parents: [], flags: [], rowIndex: 7,
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.question).toBe('Define osmosis');
    expect(result.answer).toBeUndefined();
  });

  it('GAP: question contains ..., answer is the gap word (depth=0, no parents)', () => {
    const raw = {
      cardId:  '1000000000003',
      type:    'GAP' as const,
      question: 'The craniosacral system includes the ... and the spinal cord.',
      answer:  'brain',
      parents: [],
      flags:   [],
      rowIndex: 12,
      fullUrl: 'https://www.lern-studio.de?id=1000000000003&cardtype=GAP&depth=0'
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.cardType).toBe('GAP');
    expect(result.question).toContain('...');
    expect(result.question).toBe('The craniosacral system includes the ... and the spinal cord.');
    expect(result.answer).toBe('brain');
  });

  it('MULTI_CARD: question is the heading, answer is array of bullet children (depth=0, no parents)', () => {
    const raw = {
      cardId:  '1000000000004',
      type:    'MULTI_CARD' as const,
      question: 'Biosphere',
      answer:  ['liquid body', 'living field'],
      parents: [],
      flags:   [],
      rowIndex: 28,
      fullUrl: 'https://www.lern-studio.de?id=1000000000004&cardtype=MULTI_CARD&depth=0'
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.cardType).toBe('MULTI_CARD');
    expect(result.question).toBe('Biosphere');
    expect(result.answer).toEqual(['liquid body', 'living field']);
  });

  it('MULTI_CARD: answer is undefined when there are no children', () => {
    const raw = {
      cardId: '1000000000005', type: 'MULTI_CARD' as const,
      question: 'Empty card', answer: undefined,
      parents: [], flags: [], rowIndex: 30,
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.answer).toBeUndefined();
  });

  it('SYNONYM: parents prepended when depth=1', () => {
    const raw = {
      cardId:  '1000000000006',
      type:    'SYNONYM' as const,
      question: 'Synonyme',
      answer:  ['Craniosacral-Rhythmus', 'Primäre Respiration', 'CRI'],
      parents: ['Craniosacral Therapy'],
      flags:   [],
      rowIndex: 39,
      fullUrl: 'https://www.lern-studio.de?id=1000000000006&cardtype=SYNONYM&depth=1'
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.cardType).toBe('SYNONYM');
    expect(result.question).toBe('Craniosacral Therapy > Synonyme');
    expect(result.answer).toEqual(['Craniosacral-Rhythmus', 'Primäre Respiration', 'CRI']);
  });

  it('IMAGES: question is the label, answer is array of image references (depth=0, no parents)', () => {
    const raw = {
      cardId:  '1000000000007',
      type:    'IMAGES' as const,
      question: 'Anatomy diagram',
      answer:  ['spine_lateral.png', 'spine_anterior.png'],
      parents: [],
      flags:   ['NO_BACKWARD'],
      rowIndex: 55,
      fullUrl: 'https://www.lern-studio.de?id=1000000000007&cardtype=IMAGES&depth=0'
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.cardType).toBe('IMAGES');
    expect(result.question).toBe('Anatomy diagram');
    expect(result.answer).toEqual(['spine_lateral.png', 'spine_anterior.png']);
  });

  it('parents are joined into question with " > " separator (depth=2)', () => {
    const raw = {
      cardId: '1000000000008', type: 'SINGLE_CARD' as const,
      question: 'What is ATP?', answer: 'Adenosine triphosphate',
      parents: ['Biology', 'Biochemistry'], flags: [], rowIndex: 9,
    };
    const result = rawCardToApiCard(raw, DOC_ID);
    expect(result.question).toBe('Biology > Biochemistry > What is ATP?');
  });

});
