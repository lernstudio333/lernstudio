import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { CardTypes } from 'shared';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardType } from '../../../types/admin.types';
import ConfirmModal from '../../../components/ConfirmModal';

const CARD_TYPE_OPTIONS = CardTypes.values().map(e => ({ key: e.key as CardType, label: e.export_as }));

function BasicInfoTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);
  const [pendingType, setPendingType] = useState<CardType | null>(null);

  if (!editBuffer) return null;

  function handleTypeChange(newType: CardType) {
    const hasAnswers = editBuffer?.answers && editBuffer.answers.length > 0;
    if (hasAnswers) { setPendingType(newType); return; }
    updateEditBuffer({ card_type: newType });
  }

  function confirmTypeChange() {
    if (!pendingType) return;
    updateEditBuffer({ card_type: pendingType, answers: [] });
    setPendingType(null);
  }

  return (
    <>
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
          value={editBuffer.card_type ?? CardTypes.SINGLE_CARD.key}
          onChange={e => handleTypeChange(e.target.value as CardType)}
        >
          {CARD_TYPE_OPTIONS.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </Form.Select>
      </Form.Group>

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
        <Form.Label className="small fw-semibold">External ID</Form.Label>
        <Form.Control
          type="text"
          value={editBuffer.ext_id ?? ''}
          onChange={e => updateEditBuffer({ ext_id: e.target.value || null })}
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

    <ConfirmModal
      show={!!pendingType}
      title="Change Card Type?"
      confirmLabel="Change Type"
      confirmVariant="warning"
      onConfirm={confirmTypeChange}
      onCancel={() => setPendingType(null)}
    >
      <p>Changing the card type will clear all existing answers. This cannot be undone.</p>
      <p>Are you sure you want to continue?</p>
    </ConfirmModal>
    </>
  );
}

export default BasicInfoTab;
