import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardAnswer } from '../../../types/admin.types';
import MediaPickerModal from '../../../components/MediaPickerModal';
import MediaThumbnail from '../../../components/MediaThumbnail';

function ImgSCAnswerEditor() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);
  const [showPicker, setShowPicker] = useState(false);

  const answer = editBuffer?.answers?.[0];

  function handleSelect(mediaId: string) {
    const updated: CardAnswer = {
      id: answer?.id ?? '',
      card_id: editBuffer?.id ?? '',
      answer_text: mediaId,
      position: 0,
      media_id: mediaId,
    };
    updateEditBuffer({ answers: [updated] });
    setShowPicker(false);
  }

  return (
    <div>
      <div className="small fw-semibold mb-2">Image Answer</div>
      {answer?.media_id ? (
        <div className="d-flex align-items-center gap-3 mb-2">
          <MediaThumbnail mediaId={answer.media_id} size={80} />
          <Button size="sm" variant="outline-secondary" onClick={() => setShowPicker(true)}>Change</Button>
        </div>
      ) : (
        <Button size="sm" variant="outline-secondary" onClick={() => setShowPicker(true)}>Choose Image</Button>
      )}
      <MediaPickerModal
        show={showPicker}
        onSelect={handleSelect}
        onClose={() => setShowPicker(false)}
      />
    </div>
  );
}

export default ImgSCAnswerEditor;
