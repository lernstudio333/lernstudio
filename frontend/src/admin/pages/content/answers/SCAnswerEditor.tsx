import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardAnswer } from '../../../types/admin.types';

function SCAnswerEditor() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  const answer = editBuffer?.answers?.[0];
  const text = answer?.answer_text ?? '';

  function handleChange(value: string) {
    const updated: CardAnswer = {
      id: answer?.id ?? '',
      card_id: editBuffer?.id ?? '',
      answer_text: value,
      is_correct: true,
      position: 0,
      media_id: null,
    };
    updateEditBuffer({ answers: [updated] });
  }

  return (
    <Form.Group>
      <Form.Label className="small fw-semibold">Correct Answer</Form.Label>
      <Form.Control
        type="text"
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder="Enter the correct answer"
      />
    </Form.Group>
  );
}

export default SCAnswerEditor;
