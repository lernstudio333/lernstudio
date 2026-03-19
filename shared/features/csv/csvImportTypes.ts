import type { CsvImportErrType } from './CsvImportErrType.ts';

/** Minimal shape of a CsvImportErrType entry used in error objects. */
export type CsvErrEntry = typeof CsvImportErrType[keyof Pick<
  typeof CsvImportErrType,
  | 'FORBIDDEN_COLUMN' | 'MISSING_REQUIRED_COLUMN'
  | 'PROGRAM_MISMATCH' | 'COURSE_MISMATCH' | 'LESSON_MISMATCH'
  | 'MISSING_REQUIRED_FIELD' | 'UNKNOWN_CARD_TYPE' | 'INVALID_UUID'
  | 'ANSWER_FORMAT_INVALID' | 'ANSWER_UNEXPECTED'
  | 'MEDIA_FORMAT_INVALID' | 'MEDIA_UNEXPECTED'
  | 'INVALID_DATA' | 'MEDIA_NOT_FOUND'
>];

/** Context provided at import time — identifies the lesson being imported into. */
export type CsvImportContext = {
  lessonId:         string;
  courseId:         string;
  programId:        string;
  /** When true, skip parent ID mismatch checks (user has confirmed the discrepancy). */
  ignoreParentIds?: boolean;
};

/** A fully mapped, ready-to-persist card produced by a successful row validation. */
export type CsvMappedCard = {
  id?:            string;    // UUID — present means upsert; absent means insert
  extId?:         string;
  cardType:       string;    // normalized key: 'SINGLE_CARD' | 'MULTI_CARD' | ...
  question:       string;
  textAnswers:    string[];  // non-IMAGES cards
  mediaFilenames: string[];  // IMAGES cards — Edge Function resolves to media_ids
  tip?:           string;
};

/** A single field-level error within a CSV row. */
export type CsvFieldError = {
  fieldName:  string;
  fieldValue: string;
  errorType:  CsvErrEntry;
};

/** All errors collected for one CSV data row. */
export type CsvRowError = {
  row:      number;   // 1-indexed: row 1 = first data row after header
  cardId:   string;   // ID or extId if available, else ''
  question: string;
  errors:   CsvFieldError[];
};

/** A file-level error that blocks the entire import. */
export type CsvFileError = {
  errorType: CsvErrEntry;
  column?:   string;
  message:   string;
};

/** Full result returned by validateCsv(). */
export type CsvValidationResult = {
  fileErrors:           CsvFileError[];
  rowErrors:            CsvRowError[];
  requiresConfirmation: boolean;
  mismatchDetails?: {
    programIds: string[];
    courseIds:  string[];
    lessonIds:  string[];
  };
  /** Valid mapped cards — only populated when there are no file-level errors. */
  validRows:            CsvMappedCard[];
};
