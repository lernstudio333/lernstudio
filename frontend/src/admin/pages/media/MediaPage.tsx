import { useEffect, useRef, useState } from 'react';
import { Button, Spinner, Alert, Form } from 'react-bootstrap';
import ConfirmModal from '../../components/ConfirmModal';
import { supabase } from '../../../lib/supabase';
import type { AdminMedia } from '../../types/admin.types';
import { useLessonStore } from '../../stores/lessonStore';

const MEDIA_BUCKET = import.meta.env.VITE_MEDIA_BUCKET as string;

interface MediaItem extends AdminMedia {
  publicUrl: string;
}

interface UsageEntry {
  lesson_id:    string;
  lesson_title: string;
  card_id:      string;
  card_question: string;
}

function MediaPage() {
  const purgeMediaFromCards = useLessonStore(s => s.purgeMediaFromCards);
  const [items,           setItems]           = useState<MediaItem[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [search,          setSearch]          = useState('');
  const [uploading,       setUploading]       = useState(false);
  const [isDragging,      setIsDragging]      = useState(false);
  const [pendingDelete,   setPendingDelete]   = useState<MediaItem | null>(null);
  const [usage,           setUsage]           = useState<UsageEntry[]>([]);
  const [loadingUsage,    setLoadingUsage]    = useState(false);
  const [overrideChecked, setOverrideChecked] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error: err } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const withUrls = (data ?? []).map((item: AdminMedia) => {
      const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(item.path);
      return { ...item, publicUrl: pub.publicUrl };
    });
    setItems(withUrls);
    setLoading(false);
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    const { data, error: fnErr } = await supabase.functions.invoke<{
      uploaded: AdminMedia[];
      errors:   { file: string; error: string }[];
    }>('upload-media', { body: formData });

    if (fnErr) {
      setError(fnErr.message);
    } else if (data?.errors?.length) {
      setError(data.errors.map(e => `${e.file}: ${e.error}`).join('\n'));
    }

    await load();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    uploadFiles(Array.from(e.target.files ?? []));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith('image/') || f.type.startsWith('video/'),
    );
    uploadFiles(files);
  }

  async function handleDeleteClick(item: MediaItem) {
    setLoadingUsage(true);
    setOverrideChecked(false);
    setPendingDelete(item);
    const { data } = await supabase.rpc('list_image_usage', { p_media_id: item.id });
    setUsage((data as UsageEntry[]) ?? []);
    setLoadingUsage(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { error: rpcErr } = await supabase.rpc('delete_media_safe', {
      p_media_id: pendingDelete.id,
      override:   usage.length > 0,
    });
    if (rpcErr) { setError(rpcErr.message); return; }
    await supabase.storage.from(MEDIA_BUCKET).remove([pendingDelete.path]);
    purgeMediaFromCards(pendingDelete.id);
    setItems(prev => prev.filter(i => i.id !== pendingDelete.id));
    setPendingDelete(null);
  }

  function closeDeleteModal() {
    setPendingDelete(null);
    setUsage([]);
    setOverrideChecked(false);
  }

  const filtered = search
    ? items.filter(m => m.path?.toLowerCase().includes(search.toLowerCase()))
    : items;

  if (loading) return <div><Spinner animation="border" size="sm" /> Loading…</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Media</h5>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            style={{ width: '200px' }}
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Button
            size="sm"
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner animation="border" size="sm" /> : 'Upload'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="d-none"
            onChange={handleFileInput}
          />
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="mb-3 rounded d-flex align-items-center justify-content-center"
        style={{
          border:     `2px dashed ${isDragging ? 'var(--bs-primary)' : 'var(--bs-border-color)'}`,
          background: isDragging ? 'var(--bs-primary-bg-subtle)' : undefined,
          minHeight:  72,
          cursor:     uploading ? 'default' : 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          color:      isDragging ? 'var(--bs-primary)' : 'var(--bs-secondary-color)',
          fontSize:   '0.875rem',
          userSelect: 'none',
        }}
      >
        {uploading
          ? <><Spinner animation="border" size="sm" className="me-2" />Uploading…</>
          : 'Drop images here, or click to select multiple files'
        }
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}

      {filtered.length === 0 && <div className="text-muted">No media found</div>}

      <div className="row g-3">
        {filtered.map(item => (
          <div key={item.id} className="col-6 col-md-3 col-lg-2">
            <div className="border rounded overflow-hidden position-relative" style={{ aspectRatio: '1' }}>
              <img
                src={item.publicUrl}
                alt={item.path}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 py-0 px-1"
                onClick={() => handleDeleteClick(item)}
                title="Delete"
              >×</button>
            </div>
            <div className="text-muted small mt-1 text-truncate" title={item.path}>{item.path}</div>
          </div>
        ))}
      </div>

      <ConfirmModal
        show={!!pendingDelete}
        title="Delete Media File?"
        confirmLabel="Delete"
        confirmVariant="danger"
        confirmDisabled={loadingUsage || (usage.length > 0 && !overrideChecked)}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
      >
        {loadingUsage ? (
          <div className="text-center py-2"><Spinner animation="border" size="sm" /> Checking usage…</div>
        ) : usage.length > 0 ? (
          <>
            <p>This file is currently used in the following locations:</p>
            <ul className="mb-3">
              {Object.entries(
                usage.reduce((acc, u) => {
                  if (!acc[u.lesson_id]) acc[u.lesson_id] = { title: u.lesson_title, cards: [] };
                  acc[u.lesson_id].cards.push(u.card_question || '(no question)');
                  return acc;
                }, {} as Record<string, { title: string; cards: string[] }>)
              ).map(([lessonId, { title, cards }]) => (
                <li key={lessonId}>
                  {cards.length} answer(s) in lesson &ldquo;{title}&rdquo;
                  <ul>{cards.map((q, i) => <li key={i}>{q}</li>)}</ul>
                </li>
              ))}
            </ul>
            <p>Deleting it will remove the file and clear all references.</p>
            <Form.Check
              type="checkbox"
              label="Yes, I want to delete this file and clear all references."
              checked={overrideChecked}
              onChange={e => setOverrideChecked(e.target.checked)}
            />
          </>
        ) : (
          <p>Are you sure you want to delete this media file? This action cannot be undone.</p>
        )}
      </ConfirmModal>
    </div>
  );
}

export default MediaPage;
