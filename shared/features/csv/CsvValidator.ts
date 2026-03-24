import { CsvImportErrType } from './CsvImportErrType.ts';
import { normalizeCardType } from './legacyCardTypeLookup.ts';
import { parseAnswerFromCsv } from './csvFormatter.ts';
import { CARD_COLUMN_DEFS, FORBIDDEN_IMPORT_COLUMNS, normalizeRow } from './columnDefs.ts';
import type {
  CsvImportContext,
  CsvValidationResult,
  CsvRowError,
  CsvFileError,
  CsvMappedCard,
  CsvFieldError,
} from './csvImportTypes.ts';

// ── Constants ──────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_FILENAME_RE = /\.(jpg|jpeg|png|webp|gif|svg)$/i;

// ── Helpers ────────────────────────────────────────────────────

function isValidUuid(s: string): boolean { return UUID_RE.test(s); }
function isValidImageFilename(s: string): boolean { return IMAGE_FILENAME_RE.test(s.trim()); }
function isMarkdownList(s: string): boolean { return s.trim().startsWith('- '); }

// ── Header validation ──────────────────────────────────────────

/** Validate the CSV header row. Returns file-level errors only. */
export function validateHeaders(fields: string[]): CsvFileError[] {
  const errors: CsvFileError[] = [];
  const lowerFields = fields.map(f => f.toLowerCase());

  // Check for forbidden columns (case-insensitive)
  for (const field of fields) {
    const msg = FORBIDDEN_IMPORT_COLUMNS[field.toLowerCase()];
    if (msg) {
      errors.push({
        errorType: CsvImportErrType.FORBIDDEN_COLUMN,
        column:    field,
        message:   `Column "${field}" is not allowed. ${msg}`,
      });
    }
  }

  // Check required columns are present (accept aliases)
  for (const col of CARD_COLUMN_DEFS.filter(c => c.required)) {
    const found =
      lowerFields.includes(col.header.toLowerCase()) ||
      (col.aliases ?? []).some(a => lowerFields.includes(a.toLowerCase()));
    if (!found) {
      errors.push({
        errorType: CsvImportErrType.MISSING_REQUIRED_COLUMN,
        column:    col.header,
        message:   `Required column "${col.header}" is missing.`,
      });
    }
  }

  return errors;
}

// ── Row validation ─────────────────────────────────────────────

/** Validate all data rows. Returns row errors, mismatch info, and valid mapped cards. */
export function validateRows(
  rawRows: Record<string, string>[],
  context: CsvImportContext,
): Pick<CsvValidationResult, 'rowErrors' | 'requiresConfirmation' | 'mismatchDetails' | 'validRows'> {
  const rowErrors: CsvRowError[] = [];
  const validRows: CsvMappedCard[] = [];
  const mismatchProgramIds = new Set<string>();
  const mismatchCourseIds  = new Set<string>();
  const mismatchLessonIds  = new Set<string>();

  for (let i = 0; i < rawRows.length; i++) {
    const r      = normalizeRow(rawRows[i]);
    const rowNum = i + 1; // 1-indexed
    const errors: CsvFieldError[] = [];

    const id          = r.id       ?? '';
    const extId       = r.extId    ?? '';
    const question    = r.question ?? '';
    const rawCardType = r.cardType ?? '';
    const answer      = r.answer   ?? '';
    const media       = r.media    ?? '';
    const tip         = r.tip      ?? '';
    // Normalize flags: trim each entry after splitting, drop empty parts
    const flags       = (r.flags ?? '').split(',').map(f => f.trim()).filter(Boolean).join(',');

    // ID must be a valid UUID if present
    if (id && !isValidUuid(id)) {
      errors.push({ fieldName: 'ID', fieldValue: id, errorType: CsvImportErrType.INVALID_UUID });
    }

    // Question is required
    if (!question) {
      errors.push({ fieldName: 'Question', fieldValue: '', errorType: CsvImportErrType.MISSING_REQUIRED_FIELD });
    }

    // Card type must be present and recognized
    const normalizedType = normalizeCardType(rawCardType);
    if (!rawCardType) {
      errors.push({ fieldName: 'Card type', fieldValue: '', errorType: CsvImportErrType.MISSING_REQUIRED_FIELD });
    } else if (!normalizedType) {
      errors.push({ fieldName: 'Card type', fieldValue: rawCardType, errorType: CsvImportErrType.UNKNOWN_CARD_TYPE });
    }

    // Answer / media cross-validation (only when card type is known)
    if (normalizedType) {
      const isImages = normalizedType === 'IMAGES';
      const isMulti  = normalizedType === 'MULTI_CARD' || normalizedType === 'SYNONYM';

      if (isImages) {
        // answer field is silently ignored for IMAGES cards
        if (media) {
          const filenames = media.split(',').map(f => f.trim()).filter(Boolean);
          if (filenames.some(f => !isValidImageFilename(f))) {
            errors.push({ fieldName: 'Media', fieldValue: media, errorType: CsvImportErrType.MEDIA_FORMAT_INVALID });
          }
        }
        // empty media is allowed — card is imported without media answers
      } else {
        if (media) {
          errors.push({ fieldName: 'Media', fieldValue: media, errorType: CsvImportErrType.MEDIA_UNEXPECTED });
        }
        // For SINGLE_CARD / GAP: markdown list is likely a mistake (would import multiple answers)
        if (answer && !isMulti && isMarkdownList(answer)) {
          errors.push({ fieldName: 'Answer', fieldValue: answer, errorType: CsvImportErrType.ANSWER_FORMAT_INVALID });
        }
        // MULTI_CARD / SYNONYM accept both plain strings (single answer) and markdown lists
        // empty answer is allowed — card is imported without answers
      }
    }

    // Context mismatch: collect mismatch IDs but don't add to rowErrors —
    // they trigger requires_confirmation rather than blocking the row.
    if (!context.ignoreParentIds) {
      const csvProgramId = r.programId ?? '';
      const csvCourseId  = r.courseId  ?? '';
      const csvLessonId  = r.lessonId  ?? '';

      if (csvProgramId && csvProgramId !== context.programId) mismatchProgramIds.add(csvProgramId);
      if (csvCourseId  && csvCourseId  !== context.courseId)  mismatchCourseIds.add(csvCourseId);
      if (csvLessonId  && csvLessonId  !== context.lessonId)  mismatchLessonIds.add(csvLessonId);
    }

    if (errors.length > 0) {
      rowErrors.push({ row: rowNum, cardId: id || extId || '', question, errors });
    } else if (normalizedType) {
      const isImages = normalizedType === 'IMAGES';
      validRows.push({
        id:             id     || undefined,
        extId:          extId  || undefined,
        cardType:       normalizedType,
        question,
        textAnswers:    isImages ? [] : parseAnswerFromCsv(answer),
        mediaFilenames: isImages ? media.split(',').map(f => f.trim()).filter(Boolean) : [],
        tip:            tip   || undefined,
        flags:          flags || undefined,
      });
    }
  }

  const requiresConfirmation =
    mismatchProgramIds.size > 0 ||
    mismatchCourseIds.size  > 0 ||
    mismatchLessonIds.size  > 0;

  return {
    rowErrors,
    requiresConfirmation,
    mismatchDetails: requiresConfirmation ? {
      programIds: [...mismatchProgramIds],
      courseIds:  [...mismatchCourseIds],
      lessonIds:  [...mismatchLessonIds],
    } : undefined,
    validRows,
  };
}

// ── Main entry point ───────────────────────────────────────────

/**
 * Validate a parsed CSV (header fields + data rows).
 * Returns a CsvValidationResult with file errors, row errors, mismatch info, and valid rows.
 * Stops at file-level errors — row validation is skipped if the file structure is invalid.
 */
export function validateCsv(
  fields: string[],
  rawRows: Record<string, string>[],
  context: CsvImportContext,
): CsvValidationResult {
  const fileErrors = validateHeaders(fields);

  if (fileErrors.length > 0) {
    return { fileErrors, rowErrors: [], requiresConfirmation: false, validRows: [] };
  }

  const rowResult = validateRows(rawRows, context);
  return { fileErrors: [], ...rowResult };
}
