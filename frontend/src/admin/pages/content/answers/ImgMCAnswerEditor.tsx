import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardAnswer } from '../../../types/admin.types';
import MediaPickerModal from '../../../components/MediaPickerModal';
import MediaThumbnail from '../../../components/MediaThumbnail';

function ImgMCAnswerEditor() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);
  const [pickingIndex, setPickingIndex] = useState<number | null>(null);

  const answers: CardAnswer[] = editBuffer?.answers ?? [];

  function handleSelect(mediaId: string) {
    if (pickingIndex === null) return;
    const updated = [...answers];
    if (pickingIndex < updated.length) {
      updated[pickingIndex] = { ...updated[pickingIndex], media_id: mediaId, answer_text: mediaId };
    } else {
      updated.push({
        id: '',
        card_id: editBuffer?.id ?? '',
        answer_text: mediaId,
        is_correct: false,
        position: pickingIndex,
        media_id: mediaId,
      });
    }
    updateEditBuffer({ answers: updated });
    setPickingIndex(null);
  }

  function toggleCorrect(index: number) {
    const updated = answers.map((a, i) => i === index ? { ...a, is_correct: !a.is_correct } : a);
    updateEditBuffer({ answers: updated });
  }

  function removeAnswer(index: number) {
    updateEditBuffer({ answers: answers.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <div className="small fw-semibold mb-2">Image Answers (up to 5)</div>
      <div className="d-flex flex-wrap gap-3">
        {answers.map((answer, index) => (
          <div key={index} className="border rounded p-2 text-center" style={{ width: '100px' }}>
            {answer.media_id ? (
              <MediaThumbnail mediaId={answer.media_id} size={60} />
            ) : (
              <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, margin: '0 auto' }}>
                ?
              </div>
            )}
            <div className="mt-1">
              <Form.Check
                type="checkbox"
                label="Correct"
                checked={answer.is_correct}
                onChange={() => toggleCorrect(index)}
                className="small"
              />
            </div>
            <div className="d-flex justify-content-center gap-1 mt-1">
              <Button size="sm" variant="outline-secondary" className="py-0 px-1" onClick={() => setPickingIndex(index)}>✎</Button>
              <Button size="sm" variant="outline-danger" className="py-0 px-1" onClick={() => removeAnswer(index)}>×</Button>
            </div>
          </div>
        ))}
        {answers.length < 5 && (
          <div
            className="border rounded d-flex align-items-center justify-content-center"
            style={{ width: '100px', height: '100px', cursor: 'pointer', borderStyle: 'dashed' }}
            onClick={() => setPickingIndex(answers.length)}
          >
            + Add
          </div>
        )}
      </div>
      <MediaPickerModal
        show={pickingIndex !== null}
        onSelect={handleSelect}
        onClose={() => setPickingIndex(null)}
      />
    </div>
  );
}

export default ImgMCAnswerEditor;
