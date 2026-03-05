import { useEffect, useState } from 'react';
import { Modal, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../../lib/supabase';
import type { AdminMedia } from '../types/admin.types';

interface Props {
  show: boolean;
  onSelect: (mediaId: string) => void;
  onClose: () => void;
}

function MediaPickerModal({ show, onSelect, onClose }: Props) {
  const [media, setMedia] = useState<(AdminMedia & { publicUrl: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const items = (data ?? []) as AdminMedia[];
        const withUrls = items.map(item => {
          const { data: pub } = supabase.storage.from('media').getPublicUrl(item.url);
          return { ...item, publicUrl: pub.publicUrl };
        });
        setMedia(withUrls);
        setLoading(false);
      });
  }, [show]);

  const filtered = search
    ? media.filter(m => m.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
    : media;

  return (
    <Modal show={show} onHide={onClose} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Choose Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <input
          className="form-control form-control-sm mb-3"
          placeholder="Search by tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading && <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>}
        {!loading && filtered.length === 0 && (
          <Alert variant="info">No media found</Alert>
        )}
        <div className="row g-2">
          {filtered.map(item => (
            <div key={item.id} className="col-3">
              <div
                className="border rounded overflow-hidden"
                style={{ cursor: 'pointer', aspectRatio: '1' }}
                onClick={() => onSelect(item.id)}
                title={item.tags?.join(', ')}
              >
                <img
                  src={item.publicUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default MediaPickerModal;
