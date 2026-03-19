import { CsvHeaderMap } from '../../csvHeaders.ts';

// ── Types ──────────────────────────────────────────────────────

/** Flat row shape used internally for both CSV export formatting and import mapping. */
export type CsvExportRow = {
  id:           string;
  extId:        string;
  programId:    string;
  courseId:     string;
  lessonId:     string;
  extProgramId: string;
  extCourseId:  string;
  extLessonId:  string;
  cardType:     string;
  question:     string;
  answer:       string;
  tip:          string;
  media:        string;
};

export type ColumnDef = {
  /** Internal field key in CsvExportRow */
  field:         keyof CsvExportRow;
  /** Primary CSV column header string */
  header:        string;
  /** Whether this column must be present in an import file */
  required?:     boolean;
  /** Always include in export output */
  alwaysExport?: boolean;
  /** Include in export only when this returns true (overrides alwaysExport) */
  showInExport?: (rows: CsvExportRow[]) => boolean;
  /** Serialize a domain row to a CSV cell value */
  fromDomain:    (row: CsvExportRow) => string;
  /** Deserialize a raw CSV cell string to a plain string (no validation here) */
  toDomain:      (value: string) => string;
  /** Alternative header names accepted during import (case-insensitive) */
  aliases?:      string[];
};

// ── Forbidden / ignored columns ────────────────────────────────

/** Columns that must not appear in import files, with user-facing remediation. */
export const FORBIDDEN_IMPORT_COLUMNS: Record<string, string> = {
  'card id':  'Rename this column to "External ID" or delete it before importing.',
  'sheet id': 'Delete this column before importing.',
};

/** Column headers that are silently ignored during import (no error). */
export const IGNORED_IMPORT_COLUMNS = new Set(['mode', 'options']);

// ── Column definitions ─────────────────────────────────────────

export const CARD_COLUMN_DEFS: ColumnDef[] = [
  {
    field:        'id',
    header:       CsvHeaderMap.id,
    required:     false,
    showInExport: (rows) => rows.some(r => !r.extId),
    fromDomain:   (r) => r.id,
    toDomain:     (v) => v,
  },
  {
    field:        'extId',
    header:       CsvHeaderMap.externalId,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.extId,
    toDomain:     (v) => v,
    aliases:      ['External Card ID'],
  },
  {
    field:        'programId',
    header:       CsvHeaderMap.programId,
    required:     false,
    showInExport: (rows) => rows.some(r => !r.extProgramId),
    fromDomain:   (r) => r.programId,
    toDomain:     (v) => v,
  },
  {
    field:        'extProgramId',
    header:       CsvHeaderMap.externalProgramId,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.extProgramId,
    toDomain:     (v) => v,
  },
  {
    field:        'courseId',
    header:       CsvHeaderMap.courseId,
    required:     false,
    showInExport: (rows) => rows.some(r => !r.extCourseId),
    fromDomain:   (r) => r.courseId,
    toDomain:     (v) => v,
  },
  {
    field:        'extCourseId',
    header:       CsvHeaderMap.externalCourseId,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.extCourseId,
    toDomain:     (v) => v,
  },
  {
    field:        'lessonId',
    header:       CsvHeaderMap.lessonId,
    required:     false,
    showInExport: (rows) => rows.some(r => !r.extLessonId),
    fromDomain:   (r) => r.lessonId,
    toDomain:     (v) => v,
  },
  {
    field:        'extLessonId',
    header:       CsvHeaderMap.externalLessonId,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.extLessonId,
    toDomain:     (v) => v,
  },
  {
    field:        'cardType',
    header:       CsvHeaderMap.cardType,
    required:     true,
    alwaysExport: true,
    fromDomain:   (r) => r.cardType,
    toDomain:     (v) => v,
  },
  {
    field:        'question',
    header:       CsvHeaderMap.question,
    required:     true,
    alwaysExport: true,
    fromDomain:   (r) => r.question,
    toDomain:     (v) => v,
  },
  {
    field:        'answer',
    header:       CsvHeaderMap.answer,
    required:     true,
    alwaysExport: true,
    fromDomain:   (r) => r.answer,
    toDomain:     (v) => v,
    aliases:      ['answers', 'Answers'],
  },
  {
    field:        'tip',
    header:       CsvHeaderMap.tip,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.tip,
    toDomain:     (v) => v,
  },
  {
    field:        'media',
    header:       CsvHeaderMap.media,
    required:     false,
    alwaysExport: true,
    fromDomain:   (r) => r.media,
    toDomain:     (v) => v,
  },
];

// ── Row normalizer ─────────────────────────────────────────────

/** Lowercase-header → field lookup, built once at module load. */
const _headerToField = new Map<string, keyof CsvExportRow>();
for (const col of CARD_COLUMN_DEFS) {
  _headerToField.set(col.header.toLowerCase(), col.field);
  for (const alias of (col.aliases ?? [])) {
    _headerToField.set(alias.toLowerCase(), col.field);
  }
}

/**
 * Normalize a raw PapaParse row (keyed by CSV column headers) to a partial
 * CsvExportRow keyed by internal field names. Unknown columns are ignored.
 */
export function normalizeRow(raw: Record<string, string>): Partial<CsvExportRow> {
  const result: Partial<CsvExportRow> = {};
  for (const [key, value] of Object.entries(raw)) {
    const field = _headerToField.get(key.toLowerCase());
    if (field !== undefined) {
      result[field] = value?.trim() ?? '';
    }
  }
  return result;
}
