import { Modal, Button } from 'react-bootstrap';
import { ReactNode } from 'react';

interface Props {
  show: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  confirmVariant?: string;
  confirmDisabled?: boolean;
  children: ReactNode;
}

function ConfirmModal({
  show, title, onConfirm, onCancel,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  confirmDisabled = false,
  children,
}: Props) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default ConfirmModal;
