import { createEnum } from '../../core/enumFactory.ts';

export const CsvImportErrType = createEnum({

  // ── File-level (block entire import) ──────────────────────────
  FORBIDDEN_COLUMN:          { label: 'Column not allowed — remove or rename it' },
  MISSING_REQUIRED_COLUMN:   { label: 'Required column is missing' },

  // ── Context mismatch (triggers requires_confirmation) ─────────
  PROGRAM_MISMATCH:          { label: 'Program ID does not match current program' },
  COURSE_MISMATCH:           { label: 'Course ID does not match current course' },
  LESSON_MISMATCH:           { label: 'Lesson ID does not match current lesson' },

  // ── Row-level hard errors (skip that row) ─────────────────────
  MISSING_REQUIRED_FIELD:    { label: 'Required field is empty' },
  UNKNOWN_CARD_TYPE:         { label: 'Unknown card type value' },
  INVALID_UUID:              { label: 'Value is not a valid UUID' },
  ANSWER_FORMAT_INVALID:     { label: 'Answer format does not match card type' },
  ANSWER_UNEXPECTED:         { label: 'Answer field must be empty for IMAGES cards' },
  MEDIA_FORMAT_INVALID:      { label: 'Media field contains invalid filename(s)' },
  MEDIA_UNEXPECTED:          { label: 'Media field must be empty for this card type' },
  INVALID_DATA:              { label: 'Generic invalid field value' },

  // ── Backend-only ───────────────────────────────────────────────
  MEDIA_NOT_FOUND:           { label: 'Media file not found in storage' },

});
