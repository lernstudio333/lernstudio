import { Button, Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardAnswer } from '../../../types/admin.types';

function MCAnswerEditor() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  const answers: CardAnswer[] = editBuffer?.answers ?? [];

  function updateAnswer(index: number, partial: Partial<CardAnswer>) {
    const updated = answers.map((a, i) => i === index ? { ...a, ...partial } : a);
    updateEditBuffer({ answers: updated });
  }

  function addAnswer() {
    const newAnswer: CardAnswer = {
      id: '',
      card_id: editBuffer?.id ?? '',
      answer_text: '',
      is_correct: false,
      position: answers.length,
      media_id: null,
    };
    updateEditBuffer({ answers: [...answers, newAnswer] });
  }

  function removeAnswer(index: number) {
    updateEditBuffer({ answers: answers.filter((_, i) => i !== index) });
  }

  return (
    <div>
      <div className="small fw-semibold mb-2">Answers</div>
      {answers.map((answer, index) => (
        <div key={index} className="d-flex align-items-center gap-2 mb-2">
          <Form.Check
            type="checkbox"
            checked={answer.is_correct}
            onChange={e => updateAnswer(index, { is_correct: e.target.checked })}
            title="Correct"
          />
          <Form.Control
            type="text"
            value={answer.answer_text}
            onChange={e => updateAnswer(index, { answer_text: e.target.value })}
            placeholder={`Answer ${index + 1}`}
            size="sm"
          />
          <Button
            size="sm"
            variant="outline-danger"
            onClick={() => removeAnswer(index)}
          >×</Button>
        </div>
      ))}
      <Button size="sm" variant="outline-secondary" onClick={addAnswer}>+ Add Answer</Button>
    </div>
  );
}

export default MCAnswerEditor;
