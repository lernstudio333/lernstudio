// ============================================================
// csvHeaders.ts — bidirectional mapping between internal field
// names and CSV column header strings.
//
// Used by:
//   - CSV export (field → header label)
//   - CSV import (header label → field)
//
// Keep this file free of enum imports and validation logic;
// those belong in the import/export feature layer.
// ============================================================

export const CsvHeaderMap = {
  id:                "ID",
  externalId:        "External ID",
  externalProgramId: "Program ID",
  externalCourseId:  "Course ID",
  externalLessonId:  "Lesson ID",
  programId:         "Program ID (internal)",
  courseId:          "Course ID (internal)",
  lessonId:          "Lesson ID (internal)",
  cardType:          "Card type",
  question:          "Question",
  answer:            "Answer",
  tip:               "Tip",
  description:       "Description",
  media:             "Media",
  tags:              "Tags",
} as const;

export type CsvField = keyof typeof CsvHeaderMap;
export type CsvHeader = (typeof CsvHeaderMap)[CsvField];

/** Reverse lookup: CSV column header → internal field name */
export const CsvHeaderToField = Object.fromEntries(
  Object.entries(CsvHeaderMap).map(([k, v]) => [v, k])
) as Record<CsvHeader, CsvField>;
