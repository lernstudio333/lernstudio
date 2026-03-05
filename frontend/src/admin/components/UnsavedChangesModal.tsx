import { Modal, Button } from 'react-bootstrap';

interface Props {
  show: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

function UnsavedChangesModal({ show, onSave, onDiscard, onCancel }: Props) {
  return (
    <Modal show={show} centered onHide={onCancel}>
      <Modal.Header closeButton>
        <Modal.Title>Unsaved changes</Modal.Title>
      </Modal.Header>
      <Modal.Body>You have unsaved changes. What would you like to do?</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="outline-danger" onClick={onDiscard}>Discard</Button>
        <Button variant="primary" onClick={onSave}>Save &amp; Continue</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default UnsavedChangesModal;
