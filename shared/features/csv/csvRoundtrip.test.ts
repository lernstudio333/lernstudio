import { describe, it, expect } from 'vitest';
import { formatCsv, parseCsvString, formatAnswerForCsv, parseAnswerFromCsv } from './csvFormatter';
import { validateCsv } from './CsvValidator';
import type { CsvExportRow } from './columnDefs';

const ctx = { lessonId: 'lesson-uuid-1', courseId: 'course-uuid-1', programId: 'prog-uuid-1' };

// Sample rows covering all card types
const sampleRows: CsvExportRow[] = [
  {
    id:           '11111111-1111-1111-1111-111111111111',
    extId:        'ext-1',
    programId:    'prog-uuid-1',
    courseId:     'course-uuid-1',
    lessonId:     'lesson-uuid-1',
    extProgramId: 'p1',
    extCourseId:  'c1',
    extLessonId:  'l1',
    cardType:     'SINGLE_CARD',
    question:     'What is 2+2?',
    answer:       '4',
    tip:          'Basic math',
    media:        '',
  },
  {
    id:           '22222222-2222-2222-2222-222222222222',
    extId:        '',
    programId:    'prog-uuid-1',
    courseId:     'course-uuid-1',
    lessonId:     'lesson-uuid-1',
    extProgramId: 'p1',
    extCourseId:  'c1',
    extLessonId:  'l1',
    cardType:     'MULTI_CARD',
    question:     'Pick the mammals',
    answer:       '- Dog\n- Cat\n- Whale',
    tip:          '',
    media:        '',
  },
  {
    id:           '33333333-3333-3333-3333-333333333333',
    extId:        'ext-3',
    programId:    'prog-uuid-1',
    courseId:     'course-uuid-1',
    lessonId:     'lesson-uuid-1',
    extProgramId: 'p1',
    extCourseId:  'c1',
    extLessonId:  'l1',
    cardType:     'IMAGES',
    question:     'Which animal?',
    answer:       '',
    tip:          '',
    media:        'cat.jpg, dog.png',
  },
  {
    id:           '44444444-4444-4444-4444-444444444444',
    extId:        '',
    programId:    'prog-uuid-1',
    courseId:     'course-uuid-1',
    lessonId:     'lesson-uuid-1',
    extProgramId: '',
    extCourseId:  '',
    extLessonId:  '',
    cardType:     'SYNONYM',
    question:     'Happy',
    answer:       '- Glad\n- Joyful\n- Cheerful',
    tip:          '',
    media:        '',
  },
  {
    id:           '55555555-5555-5555-5555-555555555555',
    extId:        '',
    programId:    'prog-uuid-1',
    courseId:     'course-uuid-1',
    lessonId:     'lesson-uuid-1',
    extProgramId: '',
    extCourseId:  '',
    extLessonId:  '',
    cardType:     'GAP',
    question:     'The capital of France is ___.',
    answer:       'Paris',
    tip:          '',
    media:        '',
  },
];

// ── Answer serialization ───────────────────────────────────────

describe('formatAnswerForCsv / parseAnswerFromCsv roundtrip', () => {
  it('single answer', () => {
    const answers = ['Paris'];
    expect(parseAnswerFromCsv(formatAnswerForCsv(answers))).toEqual(answers);
  });

  it('multi-item list', () => {
    const answers = ['Dog', 'Cat', 'Whale'];
    expect(parseAnswerFromCsv(formatAnswerForCsv(answers))).toEqual(answers);
  });

  it('empty answer', () => {
    expect(parseAnswerFromCsv(formatAnswerForCsv([]))).toEqual([]);
  });

  it('answer with commas and quotes', () => {
    const answers = ['Paris, France', 'Berlin "the capital"'];
    expect(parseAnswerFromCsv(formatAnswerForCsv(answers))).toEqual(answers);
  });
});

// ── Full CSV roundtrip ─────────────────────────────────────────

describe('formatCsv → parseCsvString → validateCsv roundtrip', () => {
  it('produces CSV with no file or row errors', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);

    expect(result.fileErrors).toHaveLength(0);
    expect(result.rowErrors).toHaveLength(0);
    expect(result.validRows).toHaveLength(sampleRows.length);
  });

  it('preserves card count', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows).toHaveLength(5);
  });

  it('preserves card types', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows.map(c => c.cardType))
      .toEqual(['SINGLE_CARD', 'MULTI_CARD', 'IMAGES', 'SYNONYM', 'GAP']);
  });

  it('preserves SINGLE_CARD answer', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows[0].textAnswers).toEqual(['4']);
  });

  it('preserves MULTI_CARD list answers', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows[1].textAnswers).toEqual(['Dog', 'Cat', 'Whale']);
  });

  it('preserves IMAGES media filenames', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows[2].mediaFilenames).toEqual(['cat.jpg', 'dog.png']);
  });

  it('preserves SYNONYM list answers', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows[3].textAnswers).toEqual(['Glad', 'Joyful', 'Cheerful']);
  });

  it('preserves GAP answer', () => {
    const csv = formatCsv(sampleRows);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.validRows[4].textAnswers).toEqual(['Paris']);
  });

  it('handles question with comma and double-quotes', () => {
    const row: CsvExportRow = {
      ...sampleRows[0],
      question: 'What is "life", really?',
      answer:   'Complicated, very much so',
    };
    const csv = formatCsv([row]);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.rowErrors).toHaveLength(0);
    expect(result.validRows[0].question).toBe('What is "life", really?');
    expect(result.validRows[0].textAnswers).toEqual(['Complicated, very much so']);
  });

  it('handles answer with embedded newlines in a list', () => {
    const row: CsvExportRow = {
      ...sampleRows[1],
      answer: '- First item\n- Second item\n- Third item',
    };
    const csv = formatCsv([row]);
    const { fields, rows } = parseCsvString(csv);
    const result = validateCsv(fields, rows, ctx);
    expect(result.rowErrors).toHaveLength(0);
    expect(result.validRows[0].textAnswers).toEqual(['First item', 'Second item', 'Third item']);
  });
});
