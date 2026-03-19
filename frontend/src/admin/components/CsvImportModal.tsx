import { useRef, useState } from 'react';
import { Modal, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../../lib/supabase';
import { validateHeaders, parseCsvString } from 'shared';
import type { CsvFileError } from 'shared';

interface RowFieldError {
  field:   string;
  message: string;
}

interface RowError {
  row:      number;
  card_id:  string;
  question: string;
  errors:   RowFieldError[];
}

interface FileError {
  type:     string;
  column?:  string;
  message:  string;
}

interface MismatchDetails {
  program_ids: string[];
  course_ids:  string[];
  lesson_ids:  string[];
}

interface ImportResult {
  status:            'success' | 'partial_success' | 'error' | 'requires_confirmation';
  imported:          number;
  updated:           number;
  skipped:           number;
  errors:            number;
  row_errors?:       RowError[];
  file_errors?:      FileError[];
  mismatch_details?: MismatchDetails;
}

interface Props {
  lessonId:   string;
  courseId:   string;
  programId:  string;
  onClose:    () => void;
  onImported: () => void;
}

function CsvImportModal({ lessonId, courseId, programId, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading,          setLoading]          = useState(false);
  const [result,           setResult]           = useState<ImportResult | null>(null);
  const [preErrors,        setPreErrors]        = useState<CsvFileError[]>([]);
  const [mismatch,         setMismatch]         = useState<MismatchDetails | null>(null);
  const [updateByExtId,    setUpdateByExtId]    = useState(false);

  // Pre-validate headers client-side when a file is selected
  function handleFileChange() {
    setPreErrors([]);
    setResult(null);
    setMismatch(null);
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { fields } = parseCsvString(text);
      const errors = validateHeaders(fields);
      setPreErrors(errors);
    };
    reader.readAsText(file);
  }

  async function doUpload(ignoreParentIds: boolean) {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('lesson_id',  lessonId);
      formData.append('course_id',  courseId);
      formData.append('program_id', programId);
      if (ignoreParentIds)  formData.append('ignore_parent_ids',  'true');
      if (updateByExtId)    formData.append('update_by_ext_id',   'true');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/import-cards`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });

      const data: ImportResult = await res.json();

      if (data.status === 'requires_confirmation') {
        setMismatch(data.mismatch_details ?? null);
      } else {
        setResult(data);
        if ((data.imported ?? 0) > 0 || (data.updated ?? 0) > 0) onImported();
      }
    } catch (err) {
      setResult({
        status: 'error', imported: 0, updated: 0, ignored: 0,
        file_errors: [{ type: 'network_error', message: String(err) }],
      });
    } finally {
      setLoading(false);
    }
  }

  function handleImport() { doUpload(false); }
  function handleConfirm() { setMismatch(null); doUpload(true); }

  const hasPreErrors = preErrors.length > 0;

  // ── Mismatch confirmation screen ────────────────────────────
  if (mismatch) {
    const parts: string[] = [];
    if (mismatch.program_ids.length) parts.push(`programs: ${mismatch.program_ids.join(', ')}`);
    if (mismatch.course_ids.length)  parts.push(`courses: ${mismatch.course_ids.join(', ')}`);
    if (mismatch.lesson_ids.length)  parts.push(`lessons: ${mismatch.lesson_ids.join(', ')}`);

    return (
      <Modal show onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>ID mismatch — continue?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-3">
            This file references different {parts.join('; ')}.<br />
            All cards will be imported into the <strong>current lesson</strong> regardless.
          </Alert>
          <p className="mb-0 small text-muted">Do you want to continue?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="warning"   onClick={handleConfirm} disabled={loading}>
            {loading ? <><Spinner size="sm" className="me-2" />Importing…</> : 'Continue anyway'}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // ── Result screen ────────────────────────────────────────────
  if (result) {
    const rowErrors = result.row_errors ?? [];
    const summary = [
      result.imported > 0  && `${result.imported} new`,
      result.updated  > 0  && `${result.updated} updated`,
      result.skipped  > 0  && `${result.skipped} skipped (already exist)`,
      result.errors   > 0  && `${result.errors} error${result.errors !== 1 ? 's' : ''}`,
    ].filter(Boolean).join(' · ');

    return (
      <Modal show onHide={onClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Import Cards from CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {result.status === 'success' && (
              <Alert variant="success" className="mb-0">✔ {summary}</Alert>
            )}
            {result.status === 'partial_success' && (
              <Alert variant="warning" className="mb-0">⚠ {summary}</Alert>
            )}
            {result.status === 'error' && (
              <Alert variant="danger" className="mb-0">
                Import failed. No cards were imported.{summary && ` ${summary}`}
              </Alert>
            )}

            {(result.file_errors ?? []).length > 0 && (
              <div>
                <div className="fw-semibold small mb-1">File errors</div>
                {result.file_errors!.map((e, i) => (
                  <div key={i} className="text-danger small">{e.message}</div>
                ))}
              </div>
            )}

            {rowErrors.length > 0 && (
              <div>
                <div className="fw-semibold small mb-1">Row errors</div>
                <div className="d-flex flex-column gap-1">
                  {rowErrors.map((e, i) => (
                    <div key={i} className="border rounded p-2 small">
                      <span className="text-danger fw-semibold">Row {e.row}</span>
                      {(e.card_id || e.question) && (
                        <span className="text-muted ms-2">{[e.card_id, e.question].filter(Boolean).join(' – ')}</span>
                      )}
                      {e.errors.map((fe, j) => (
                        <div key={j} className="ms-2 text-muted">{fe.field}: {fe.message}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // ── Upload screen ────────────────────────────────────────────
  return (
    <Modal show onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Import Cards from CSV</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-column gap-3">
          <p className="text-muted small mb-0">
            Supported columns: <code>Card type</code>, <code>Question</code>, <code>Answer</code>,{' '}
            <code>Tip</code>, <code>Media</code>, <code>ID</code>, <code>External ID</code>.
            Forbidden columns: <code>card ID</code>, <code>sheet ID</code>.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="form-control"
            onChange={handleFileChange}
          />
          {hasPreErrors && (
            <div>
              <div className="fw-semibold small text-danger mb-1">File cannot be imported</div>
              {preErrors.map((e, i) => (
                <div key={i} className="text-danger small">
                  {e.column && <strong>{e.column}: </strong>}{e.message}
                </div>
              ))}
            </div>
          )}
          <div className="form-check">
            <input
              id="updateByExtId"
              type="checkbox"
              className="form-check-input"
              checked={updateByExtId}
              onChange={e => setUpdateByExtId(e.target.checked)}
            />
            <label htmlFor="updateByExtId" className="form-check-label small">
              Update existing cards
            </label>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="primary"
          onClick={handleImport}
          disabled={loading || !fileRef.current?.files?.length || hasPreErrors}
        >
          {loading ? <><Spinner size="sm" className="me-2" />Importing…</> : 'Import'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default CsvImportModal;
