import { describe, it, expect } from 'vitest';
import { validateCsv, validateHeaders } from './CsvValidator';

const ctx = { lessonId: 'l-uuid-1', courseId: 'c-uuid-1', programId: 'p-uuid-1' };

// ── Header validation ──────────────────────────────────────────

describe('validateHeaders — forbidden columns', () => {
  it('rejects "card ID" regardless of casing', () => {
    const errors = validateHeaders(['card ID', 'Card type', 'Question', 'Answer']);
    expect(errors[0].errorType.key).toBe('FORBIDDEN_COLUMN');
    expect(errors[0].column).toBe('card ID');
  });

  it('rejects "Card ID" (capital C)', () => {
    const errors = validateHeaders(['Card ID', 'Card type', 'Question', 'Answer']);
    expect(errors[0].errorType.key).toBe('FORBIDDEN_COLUMN');
  });

  it('rejects "sheet ID"', () => {
    const errors = validateHeaders(['Sheet ID', 'Card type', 'Question', 'Answer']);
    expect(errors[0].errorType.key).toBe('FORBIDDEN_COLUMN');
  });
});

describe('validateHeaders — required columns', () => {
  it('passes when all required columns present', () => {
    const errors = validateHeaders(['Card type', 'Question', 'Answer']);
    expect(errors).toHaveLength(0);
  });

  it('reports missing "Card type"', () => {
    const errors = validateHeaders(['Question', 'Answer']);
    expect(errors.some(e => e.column === 'Card type')).toBe(true);
  });

  it('accepts "answers" as alias for "Answer"', () => {
    const errors = validateHeaders(['Card type', 'Question', 'answers']);
    expect(errors).toHaveLength(0);
  });

  it('accepts "External Card ID" as alias for "External ID"', () => {
    const errors = validateHeaders(['Card type', 'Question', 'Answer', 'External Card ID']);
    expect(errors).toHaveLength(0);
  });
});

// ── Card type normalization ────────────────────────────────────

describe('validateRows — card type', () => {
  const h = ['Card type', 'Question', 'Answer'];

  it('accepts current-format keys', () => {
    const r = validateCsv(h, [{ 'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].cardType).toBe('SINGLE_CARD');
  });

  it('maps legacy SC → SINGLE_CARD', () => {
    const r = validateCsv(h, [{ 'Card type': 'SC', Question: 'Q', Answer: 'A' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].cardType).toBe('SINGLE_CARD');
  });

  it('maps legacy MC → MULTI_CARD', () => {
    const r = validateCsv(h, [{ 'Card type': 'MC', Question: 'Q', Answer: '- a\n- b' }], ctx);
    expect(r.validRows[0].cardType).toBe('MULTI_CARD');
  });

  it('maps legacy SYN → SYNONYM', () => {
    const r = validateCsv(h, [{ 'Card type': 'SYN', Question: 'Q', Answer: '- a\n- b' }], ctx);
    expect(r.validRows[0].cardType).toBe('SYNONYM');
  });

  it('errors on unknown card type', () => {
    const r = validateCsv(h, [{ 'Card type': 'UNKNOWN', Question: 'Q', Answer: 'A' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('UNKNOWN_CARD_TYPE');
  });

  it('errors on empty card type', () => {
    const r = validateCsv(h, [{ 'Card type': '', Question: 'Q', Answer: 'A' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('MISSING_REQUIRED_FIELD');
  });
});

// ── Answer format ──────────────────────────────────────────────

describe('validateRows — answer format', () => {
  const h = ['Card type', 'Question', 'Answer'];

  it('SINGLE_CARD accepts plain string answer', () => {
    const r = validateCsv(h, [{ 'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'Paris' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].textAnswers).toEqual(['Paris']);
  });

  it('SINGLE_CARD rejects markdown list answer', () => {
    const r = validateCsv(h, [{ 'Card type': 'SINGLE_CARD', Question: 'Q', Answer: '- Paris' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('ANSWER_FORMAT_INVALID');
  });

  it('MULTI_CARD accepts markdown list', () => {
    const r = validateCsv(h, [{ 'Card type': 'MULTI_CARD', Question: 'Q', Answer: '- Dog\n- Cat' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].textAnswers).toEqual(['Dog', 'Cat']);
  });

  it('MULTI_CARD rejects plain string answer', () => {
    const r = validateCsv(h, [{ 'Card type': 'MULTI_CARD', Question: 'Q', Answer: 'Dog' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('ANSWER_FORMAT_INVALID');
  });

  it('SYNONYM accepts markdown list', () => {
    const r = validateCsv(h, [{ 'Card type': 'SYNONYM', Question: 'Q', Answer: '- a\n- b' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
  });

  it('GAP accepts plain string', () => {
    const r = validateCsv(h, [{ 'Card type': 'GAP', Question: 'Q ___', Answer: 'word' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
  });

  it('errors on missing answer for non-IMAGES card', () => {
    const r = validateCsv(h, [{ 'Card type': 'SINGLE_CARD', Question: 'Q', Answer: '' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('MISSING_REQUIRED_FIELD');
  });
});

// ── IMAGES cross-validation ────────────────────────────────────

describe('validateRows — IMAGES card type', () => {
  const h = ['Card type', 'Question', 'Answer', 'Media'];

  it('accepts IMAGES with valid media filenames and empty answer', () => {
    const r = validateCsv(h, [{ 'Card type': 'IMAGES', Question: 'Q', Answer: '', Media: 'cat.jpg, dog.png' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].mediaFilenames).toEqual(['cat.jpg', 'dog.png']);
  });

  it('errors when IMAGES answer field is non-empty', () => {
    const r = validateCsv(h, [{ 'Card type': 'IMAGES', Question: 'Q', Answer: 'text', Media: 'a.jpg' }], ctx);
    expect(r.rowErrors[0].errors.some(e => e.errorType.key === 'ANSWER_UNEXPECTED')).toBe(true);
  });

  it('errors when IMAGES media field is missing', () => {
    const r = validateCsv(h, [{ 'Card type': 'IMAGES', Question: 'Q', Answer: '', Media: '' }], ctx);
    expect(r.rowErrors[0].errors.some(e => e.errorType.key === 'MISSING_REQUIRED_FIELD')).toBe(true);
  });

  it('errors when media contains invalid file extension', () => {
    const r = validateCsv(h, [{ 'Card type': 'IMAGES', Question: 'Q', Answer: '', Media: 'file.pdf' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('MEDIA_FORMAT_INVALID');
  });

  it('accepts webp and jpeg extensions', () => {
    const r = validateCsv(h, [{ 'Card type': 'IMAGES', Question: 'Q', Answer: '', Media: 'a.webp, b.jpeg' }], ctx);
    expect(r.rowErrors).toHaveLength(0);
  });

  it('errors when non-IMAGES card has media', () => {
    const r = validateCsv(h, [{ 'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A', Media: 'a.jpg' }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('MEDIA_UNEXPECTED');
  });
});

// ── ID validation ──────────────────────────────────────────────

describe('validateRows — ID field', () => {
  const h = ['ID', 'Card type', 'Question', 'Answer'];

  it('accepts valid UUID in ID column', () => {
    const r = validateCsv(h, [{
      ID: '550e8400-e29b-41d4-a716-446655440000',
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
    }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('errors on non-UUID value in ID column', () => {
    const r = validateCsv(h, [{
      ID: 'legacy-ref-123',
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
    }], ctx);
    expect(r.rowErrors[0].errors[0].errorType.key).toBe('INVALID_UUID');
  });

  it('allows absent ID (insert flow)', () => {
    const r = validateCsv(['Card type', 'Question', 'Answer'], [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
    }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows[0].id).toBeUndefined();
  });
});

// ── Context mismatch ───────────────────────────────────────────

describe('validateRows — context mismatch', () => {
  const h = ['Card type', 'Question', 'Answer', 'Program ID (internal)', 'Course ID (internal)', 'Lesson ID (internal)'];

  it('detects program ID mismatch and sets requiresConfirmation', () => {
    const r = validateCsv(h, [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
      'Program ID (internal)': 'other-program',
      'Course ID (internal)': '',
      'Lesson ID (internal)': '',
    }], ctx);
    expect(r.requiresConfirmation).toBe(true);
    expect(r.mismatchDetails?.programIds).toContain('other-program');
  });

  it('detects lesson ID mismatch', () => {
    const r = validateCsv(h, [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
      'Program ID (internal)': '',
      'Course ID (internal)': '',
      'Lesson ID (internal)': 'other-lesson',
    }], ctx);
    expect(r.requiresConfirmation).toBe(true);
    expect(r.mismatchDetails?.lessonIds).toContain('other-lesson');
  });

  it('mismatch does not block the row — validRows still populated', () => {
    const r = validateCsv(h, [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
      'Program ID (internal)': 'other-program',
      'Course ID (internal)': '',
      'Lesson ID (internal)': '',
    }], ctx);
    expect(r.rowErrors).toHaveLength(0);
    expect(r.validRows).toHaveLength(1);
  });

  it('skips mismatch check when ignoreParentIds is true', () => {
    const r = validateCsv(h, [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
      'Program ID (internal)': 'other-program',
      'Course ID (internal)': '',
      'Lesson ID (internal)': '',
    }], { ...ctx, ignoreParentIds: true });
    expect(r.requiresConfirmation).toBe(false);
    expect(r.mismatchDetails).toBeUndefined();
  });

  it('matching IDs do not trigger mismatch', () => {
    const r = validateCsv(h, [{
      'Card type': 'SINGLE_CARD', Question: 'Q', Answer: 'A',
      'Program ID (internal)': ctx.programId,
      'Course ID (internal)':  ctx.courseId,
      'Lesson ID (internal)':  ctx.lessonId,
    }], ctx);
    expect(r.requiresConfirmation).toBe(false);
  });
});

// ── Required field ─────────────────────────────────────────────

describe('validateRows — missing required fields', () => {
  it('errors when question is empty', () => {
    const r = validateCsv(['Card type', 'Question', 'Answer'], [{
      'Card type': 'SINGLE_CARD', Question: '', Answer: 'A',
    }], ctx);
    expect(r.rowErrors[0].errors.some(e => e.fieldName === 'Question')).toBe(true);
  });
});
