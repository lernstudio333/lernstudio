import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardType } from '../../../types/admin.types';

const CARD_TYPES: CardType[] = ['SC', 'MC', 'SYN', 'GAP', 'IMG-SC', 'IMG-MC'];

function BasicInfoTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  if (!editBuffer) return null;

  function handleTypeChange(newType: CardType) {
    const hasAnswers = editBuffer?.answers && editBuffer.answers.length > 0;
    if (hasAnswers && !confirm('Changing type will clear answers. Continue?')) return;
    updateEditBuffer({ card_type: newType, answers: hasAnswers ? [] : editBuffer?.answers });
  }

  return (
    <div className="d-flex flex-column gap-3">
      <Form.Group>
        <Form.Label className="small fw-semibold">Question</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={editBuffer.question ?? ''}
          onChange={e => updateEditBuffer({ question: e.target.value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-semibold">Card Type</Form.Label>
        <Form.Select
          value={editBuffer.card_type ?? 'SC'}
          onChange={e => handleTypeChange(e.target.value as CardType)}
        >
          {CARD_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-semibold">Tipp</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={editBuffer.tipp ?? ''}
          onChange={e => updateEditBuffer({ tipp: e.target.value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-semibold">Details</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={editBuffer.details ?? ''}
          onChange={e => updateEditBuffer({ details: e.target.value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label className="small fw-semibold">Source</Form.Label>
        <Form.Control
          type="text"
          value={editBuffer.source ?? ''}
          onChange={e => updateEditBuffer({ source: e.target.value })}
        />
      </Form.Group>
    </div>
  );
}

export default BasicInfoTab;
