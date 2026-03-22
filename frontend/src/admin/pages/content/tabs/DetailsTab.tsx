import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';

function DetailsTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  if (!editBuffer) return null;

  return (
    <>
      <Form.Group controlId="card-tip" className="mb-3">
        <Form.Label className="small fw-semibold">Tip</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={editBuffer.tip ?? ''}
          onChange={e => updateEditBuffer({ tip: e.target.value })}
        />
      </Form.Group>

      <Form.Group controlId="card-details" className="mb-3">
        <Form.Label className="small fw-semibold">Details</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={editBuffer.details ?? ''}
          onChange={e => updateEditBuffer({ details: e.target.value })}
        />
      </Form.Group>

      <Form.Group controlId="card-source" className="mb-3">
        <Form.Label className="small fw-semibold">Source</Form.Label>
        <Form.Control
          type="text"
          value={editBuffer.source ?? ''}
          onChange={e => updateEditBuffer({ source: e.target.value })}
        />
      </Form.Group>
    </>
  );
}

export default DetailsTab;
