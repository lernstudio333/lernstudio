import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { CardTypes } from 'shared';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardType } from '../../../types/admin.types';
import ConfirmModal from '../../../components/ConfirmModal';
import SCAnswerEditor from '../answers/SCAnswerEditor';
import MCAnswerEditor from '../answers/MCAnswerEditor';
import ImgMCAnswerEditor from '../answers/ImgMCAnswerEditor';

const CARD_TYPE_OPTIONS = CardTypes.values().map(e => ({ key: e.key as CardType, label: e.export_as }));
const CT = CardTypes;

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

  const cardType = editBuffer.card_type;

  return (
    <>
      <Form.Group controlId="card-question" className="mb-3">
        <Form.Label className="small fw-semibold">Question</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={editBuffer.question ?? ''}
          onChange={e => updateEditBuffer({ question: e.target.value })}
        />
      </Form.Group>

      <Form.Group controlId="card-type" className="mb-3">
        <Form.Label className="small fw-semibold">Card Type</Form.Label>
        <Form.Select
          value={editBuffer.card_type ?? CT.SINGLE_CARD.key}
          onChange={e => handleTypeChange(e.target.value as CardType)}
        >
          {CARD_TYPE_OPTIONS.map(t => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group controlId="card-ext-id" className="mb-3">
        <Form.Label className="small fw-semibold">External ID</Form.Label>
        <Form.Control
          type="text"
          value={editBuffer.ext_id ?? ''}
          onChange={e => updateEditBuffer({ ext_id: e.target.value || null })}
        />
      </Form.Group>

      <hr className="my-2" />

      {cardType === CT.SINGLE_CARD.key && <SCAnswerEditor />}
      {(cardType === CT.MULTI_CARD.key || cardType === CT.SYNONYM.key) && <MCAnswerEditor />}
      {cardType === CT.IMAGES.key && <ImgMCAnswerEditor />}
      {cardType === CT.GAP.key && <div className="text-muted fst-italic small">GAP editor coming soon</div>}

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
