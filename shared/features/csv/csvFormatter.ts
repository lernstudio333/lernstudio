import { CARD_COLUMN_DEFS } from './columnDefs.ts';
import type { CsvExportRow } from './columnDefs.ts';

// ── Formatting ─────────────────────────────────────────────────

/** RFC 4180 compliant field quoting. */
export function csvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Serialize a 2D array of strings to a CSV string (CRLF line endings). */
export function buildCsvString(rows: string[][]): string {
  return rows.map(row => row.map(csvField).join(',')).join('\r\n');
}

/** Format a string[] answer for a CSV Answer cell (single string or markdown list). */
export function formatAnswerForCsv(answers: string[]): string {
  if (answers.length === 0) return '';
  if (answers.length === 1) return answers[0];
  return answers.map(a => `- ${a}`).join('\n');
}

/** Parse a CSV Answer cell back to string[]. */
export function parseAnswerFromCsv(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('- ')) {
    return trimmed.split('\n').map(line => line.replace(/^- /, '').trim()).filter(Boolean);
  }
  return [trimmed];
}

// ── Export ─────────────────────────────────────────────────────

/** Determine which columns to include in the export, based on the data. */
export function getExportColumns(rows: CsvExportRow[]) {
  return CARD_COLUMN_DEFS.filter(col => {
    if (col.showInExport) return col.showInExport(rows);
    return col.alwaysExport ?? false;
  });
}

/**
 * Convert an array of CsvExportRow objects to a CSV string.
 * Columns are conditionally included based on data completeness (e.g. internal
 * ID columns are omitted when all rows have external IDs).
 */
export function formatCsv(rows: CsvExportRow[]): string {
  const cols = getExportColumns(rows);
  const header = cols.map(c => c.header);
  const dataRows = rows.map(row => cols.map(col => col.fromDomain(row)));
  return buildCsvString([header, ...dataRows]);
}

// ── Parsing ────────────────────────────────────────────────────

/**
 * Parse a CSV string into fields + rows, compatible with PapaParse output shape.
 * Handles RFC 4180: quoted fields, escaped double-quotes (""), CRLF and LF endings.
 * Used in tests and frontend pre-validation.
 */
export function parseCsvString(csv: string): {
  fields: string[];
  rows: Record<string, string>[];
} {
  const lines = _tokenizeCsv(csv);
  if (lines.length === 0) return { fields: [], rows: [] };

  const [headerFields, ...dataLines] = lines;
  const rows: Record<string, string>[] = dataLines
    .filter(row => !(row.length === 1 && row[0] === ''))
    .map(row => {
      const obj: Record<string, string> = {};
      headerFields.forEach((field, i) => {
        obj[field] = row[i] ?? '';
      });
      return obj;
    });

  return { fields: headerFields, rows };
}

/** Tokenize a CSV string into a 2D array of cell strings (rows × cells). */
function _tokenizeCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let i = 0;

  while (i <= csv.length) {
    let field = '';

    if (csv[i] === '"') {
      // Quoted field
      i++; // skip opening quote
      while (i < csv.length) {
        if (csv[i] === '"') {
          if (i + 1 < csv.length && csv[i + 1] === '"') {
            field += '"';
            i += 2;
          } else {
            i++; // skip closing quote
            break;
          }
        } else {
          field += csv[i++];
        }
      }
    } else {
      // Unquoted field — read until comma or line ending
      while (i < csv.length && csv[i] !== ',' && csv[i] !== '\r' && csv[i] !== '\n') {
        field += csv[i++];
      }
    }

    row.push(field);

    if (i >= csv.length) {
      rows.push(row);
      break;
    }

    if (csv[i] === ',') {
      i++;
    } else if (csv[i] === '\r' || csv[i] === '\n') {
      if (csv[i] === '\r' && i + 1 < csv.length && csv[i + 1] === '\n') i += 2;
      else i++;
      rows.push(row);
      row = [];
    }
  }

  return rows;
}
