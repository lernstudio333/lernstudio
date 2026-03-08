import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const MEDIA_BUCKET = import.meta.env.VITE_MEDIA_BUCKET as string;

interface Props {
  mediaId: string;
  size?: number;
}

function MediaThumbnail({ mediaId, size = 60 }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('media')
      .select('path')
      .eq('id', mediaId)
      .single()
      .then(({ data }) => {
        if (!data?.path) return;
        const { data: publicData } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path);
        setUrl(publicData.publicUrl);
      });
  }, [mediaId]);

  if (!url) {
    return (
      <div
        className="bg-light border d-flex align-items-center justify-content-center text-muted"
        style={{ width: size, height: size, fontSize: '0.6rem' }}
      >
        IMG
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: 4 }}
    />
  );
}

export default MediaThumbnail;
