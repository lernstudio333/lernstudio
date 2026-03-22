import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';

function DetailsTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  if (!editBuffer) return null;

  return (
    <div className="d-flex flex-column gap-3">
      <Form.Group>
        <Form.Label className="small fw-semibold">Tip</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={editBuffer.tip ?? ''}
          onChange={e => updateEditBuffer({ tip: e.target.value })}
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

export default DetailsTab;
