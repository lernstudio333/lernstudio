import { useEffect, useState, useCallback } from 'react';
import { Table, Spinner, Alert, Form, Button, Badge } from 'react-bootstrap';
import { supabase } from '../../../lib/supabase';
import type { AdminLearningRow, ListCardsAdminRequest, ListCardsAdminResponse } from 'shared/features/learnings';

// ── Types ──────────────────────────────────────────────────────

interface HierarchyOption { id: string; title: string; }

type SortField =
  | 'program' | 'course' | 'lesson' | 'card' | 'cardType'
  | 'score' | 'lastVisited' | 'createdAt' | 'updatedAt';

const CARD_TYPES = ['SINGLE_CARD', 'MULTI_CARD', 'SYNONYM', 'GAP', 'IMAGES'] as const;
const PAGE_SIZE  = 50;

// ── Helpers ────────────────────────────────────────────────────

function fmt(ts: string | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function SortTh({
  field, label, sortField, sortDir, onSort,
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: 'asc' | 'desc';
  onSort: (f: SortField) => void;
}) {
  const active = sortField === field;
  return (
    <th
      role="button"
      onClick={() => onSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
    >
      {label}{' '}
      <span className="text-muted" style={{ fontSize: '0.7em' }}>
        {active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
      </span>
    </th>
  );
}

// ── Main component ─────────────────────────────────────────────

function LearningsPage() {
  // Filter state
  const [programs, setPrograms]   = useState<HierarchyOption[]>([]);
  const [courses,  setCourses]    = useState<HierarchyOption[]>([]);
  const [lessons,  setLessons]    = useState<HierarchyOption[]>([]);
  const [programId, setProgramId] = useState('');
  const [courseId,  setCourseId]  = useState('');
  const [lessonId,  setLessonId]  = useState('');
  const [cardTypes, setCardTypes] = useState<string[]>([]);

  // Sort + page
  const [sortField, setSortField] = useState<SortField>('program');
  const [sortDir,   setSortDir]   = useState<'asc' | 'desc'>('asc');
  const [page,      setPage]      = useState(1);

  // Data
  const [rows,       setRows]       = useState<AdminLearningRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // ── Load hierarchy for filters ─────────────────────────────
  useEffect(() => {
    supabase.from('programs').select('id, title').order('title').then(({ data }) => {
      setPrograms((data ?? []) as HierarchyOption[]);
    });
  }, []);

  useEffect(() => {
    if (!programId) { setCourses([]); setCourseId(''); return; }
    supabase.from('courses').select('id, title').eq('program_id', programId).order('title').then(({ data }) => {
      setCourses((data ?? []) as HierarchyOption[]);
      setCourseId('');
    });
  }, [programId]);

  useEffect(() => {
    if (!courseId) { setLessons([]); setLessonId(''); return; }
    supabase.from('lessons').select('id, title').eq('course_id', courseId).order('title').then(({ data }) => {
      setLessons((data ?? []) as HierarchyOption[]);
      setLessonId('');
    });
  }, [courseId]);

  // ── Fetch data ─────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const body: ListCardsAdminRequest = {
        ...(programId  && { programId }),
        ...(courseId   && { courseId }),
        ...(lessonId   && { lessonId }),
        ...(cardTypes.length > 0 && { cardTypes }),
        sortField,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      };

      const { data: result, error: fnError } = await supabase.functions.invoke<ListCardsAdminResponse>(
        'list-cards-admin',
        { body },
      );

      if (fnError) throw fnError;
      if (!result) throw new Error('Empty response');

      setRows(result.rows);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [programId, courseId, lessonId, cardTypes, sortField, sortDir, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Sort handler ───────────────────────────────────────────
  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  // ── Card type toggle ───────────────────────────────────────
  function toggleCardType(ct: string) {
    setCardTypes(prev =>
      prev.includes(ct) ? prev.filter(t => t !== ct) : [...prev, ct]
    );
    setPage(1);
  }

  // ── Reset filters ──────────────────────────────────────────
  function resetFilters() {
    setProgramId('');
    setCourseId('');
    setLessonId('');
    setCardTypes([]);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const sortThProps = { sortField, sortDir, onSort: handleSort };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="d-flex flex-column h-100" style={{ minHeight: 0 }}>
      <div className="d-flex align-items-center justify-content-between mb-3 flex-shrink-0">
        <h5 className="mb-0">Learnings</h5>
        <span className="text-muted small">{totalCount.toLocaleString()} rows</span>
      </div>

      {/* Filters */}
      <div className="mb-3 flex-shrink-0 d-flex flex-wrap gap-2 align-items-end">
        <Form.Select
          size="sm" style={{ width: 'auto', minWidth: '160px' }}
          value={programId}
          onChange={e => { setProgramId(e.target.value); setPage(1); }}
        >
          <option value="">All programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </Form.Select>

        <Form.Select
          size="sm" style={{ width: 'auto', minWidth: '160px' }}
          value={courseId}
          disabled={!programId}
          onChange={e => { setCourseId(e.target.value); setPage(1); }}
        >
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </Form.Select>

        <Form.Select
          size="sm" style={{ width: 'auto', minWidth: '160px' }}
          value={lessonId}
          disabled={!courseId}
          onChange={e => { setLessonId(e.target.value); setPage(1); }}
        >
          <option value="">All lessons</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </Form.Select>

        {/* Card type toggles */}
        <div className="d-flex gap-1 flex-wrap">
          {CARD_TYPES.map(ct => (
            <Button
              key={ct}
              size="sm"
              variant={cardTypes.includes(ct) ? 'primary' : 'outline-secondary'}
              onClick={() => toggleCardType(ct)}
              style={{ fontSize: '0.7rem', padding: '2px 8px' }}
            >
              {ct}
            </Button>
          ))}
        </div>

        {(programId || courseId || lessonId || cardTypes.length > 0) && (
          <Button size="sm" variant="link" className="p-0 text-muted" onClick={resetFilters}>
            Reset
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <Alert variant="danger" className="flex-shrink-0">{error}</Alert>}

      {/* Table */}
      <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" size="sm" /> Loading…</div>
        ) : (
          <Table hover size="sm" className="text-start mb-0" style={{ fontSize: '0.8rem' }}>
            <thead className="table-light sticky-top">
              <tr>
                <SortTh field="program"     label="Program"      {...sortThProps} />
                <SortTh field="course"      label="Course"       {...sortThProps} />
                <SortTh field="lesson"      label="Lesson"       {...sortThProps} />
                <SortTh field="card"        label="Question"     {...sortThProps} />
                <SortTh field="cardType"    label="Type"         {...sortThProps} />
                <th>Answers</th>
                <th>User</th>
                <SortTh field="score"       label="Score"        {...sortThProps} />
                <SortTh field="lastVisited" label="Last Visited" {...sortThProps} />
                <th>Fav</th>
                <SortTh field="createdAt"   label="Created"      {...sortThProps} />
                <SortTh field="updatedAt"   label="Updated"      {...sortThProps} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={`${row.cardId}-${row.userId ?? 'none'}-${i}`}>
                  <td className="text-truncate" style={{ maxWidth: '120px' }}>{row.programTitle}</td>
                  <td className="text-truncate" style={{ maxWidth: '120px' }}>{row.courseTitle}</td>
                  <td className="text-truncate" style={{ maxWidth: '120px' }}>{row.lessonTitle}</td>
                  <td className="text-truncate" style={{ maxWidth: '200px' }} title={row.question}>{row.question}</td>
                  <td>
                    <Badge bg="secondary" style={{ fontSize: '0.65rem' }}>{row.cardType}</Badge>
                  </td>
                  <td className="text-truncate text-muted" style={{ maxWidth: '160px' }} title={row.answers ?? ''}>
                    {row.answers ?? '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {row.userName
                      ? row.userName
                      : row.userId
                        ? <span className="text-muted font-monospace" style={{ fontSize: '0.7em' }}>{row.userId.slice(0, 8)}…</span>
                        : <span className="text-muted fst-italic">not studied</span>
                    }
                  </td>
                  <td className="text-end">
                    {row.score != null ? row.score : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(row.lastVisited)}</td>
                  <td className="text-center">{row.isFavorite ? '♥' : ''}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(row.createdAt)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmt(row.updatedAt)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center text-muted py-4">No results</td>
                </tr>
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 d-flex align-items-center gap-2 mt-2 pt-2 border-top">
          <Button
            size="sm" variant="outline-secondary"
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
          >‹ Prev</Button>
          <span className="text-muted small">Page {page} / {totalPages}</span>
          <Button
            size="sm" variant="outline-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
          >Next ›</Button>
        </div>
      )}
    </div>
  );
}

export default LearningsPage;
