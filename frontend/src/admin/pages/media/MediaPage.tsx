import { useEffect, useRef, useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../../../lib/supabase';
import type { AdminMedia } from '../../types/admin.types';

interface MediaItem extends AdminMedia {
  publicUrl: string;
}

function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error: err } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) { setError(err.message); setLoading(false); return; }
    const withUrls = (data ?? []).map((item: AdminMedia) => {
      const { data: pub } = supabase.storage.from('media').getPublicUrl(item.url);
      return { ...item, publicUrl: pub.publicUrl };
    });
    setItems(withUrls);
    setLoading(false);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filename = `${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('media').upload(filename, file);
    if (uploadErr) { setError(uploadErr.message); setUploading(false); return; }
    await supabase.from('media').insert({ url: filename, tags: [] });
    await load();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.url}"?`)) return;
    await supabase.storage.from('media').remove([item.url]);
    await supabase.from('media').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  }

  const filtered = search
    ? items.filter(m => m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
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
            placeholder="Search by tag…"
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
          <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={handleUpload} />
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {filtered.length === 0 && <div className="text-muted">No media found</div>}

      <div className="row g-3">
        {filtered.map(item => (
          <div key={item.id} className="col-6 col-md-3 col-lg-2">
            <div className="border rounded overflow-hidden position-relative" style={{ aspectRatio: '1' }}>
              <img
                src={item.publicUrl}
                alt={item.tags?.join(', ')}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 py-0 px-1"
                onClick={() => handleDelete(item)}
                title="Delete"
              >×</button>
            </div>
            <div className="text-muted small mt-1 text-truncate">{item.tags?.join(', ') || item.url}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MediaPage;
