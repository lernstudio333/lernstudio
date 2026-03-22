import { useEffect, useState } from 'react';
import { Tabs, Tab, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import CardEditorNav from './CardEditorNav';
import BasicInfoTab from './tabs/BasicInfoTab';
import DetailsTab from './tabs/DetailsTab';
import CardModesTab from './tabs/CardModesTab';
import UnsavedChangesModal from '../../components/UnsavedChangesModal';

interface Props {
  lessonId: string;
  cardId: string;
}

function CardEditorPanel({ lessonId, cardId }: Props) {
  const navigate = useNavigate();
  const cards = useLessonStore(s => s.cards);
  const sortField = useLessonStore(s => s.sortField);
  const sortDir = useLessonStore(s => s.sortDir);
  const initEditBuffer = useLessonStore(s => s.initEditBuffer);
  const saveCard = useLessonStore(s => s.saveCard);
  const addNewCard = useLessonStore(s => s.addNewCard);
  const isDirty = useLessonStore(s => s.isDirty);
  const editBuffer = useLessonStore(s => s.editBuffer);

  const [saving, setSaving] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const sorted = getSortedCards({ cards, sortField, sortDir });
  const card = sorted.find(c => c.id === cardId);

  // Init buffer when card changes
  useEffect(() => {
    if (card) initEditBuffer(card);
  }, [cardId, card?.id]);

  // Keyboard nav (ArrowLeft / ArrowRight)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const currentIndex = sorted.findIndex(c => c.id === cardId);
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        requestAction(() => navigate(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex - 1].id}`));
      }
      if (e.key === 'ArrowRight' && currentIndex < sorted.length - 1) {
        requestAction(() => navigate(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex + 1].id}`));
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cardId, sorted, isDirty]);

  /** Guard: if dirty show modal, otherwise run immediately. */
  function requestAction(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action);
      setShowUnsaved(true);
    } else {
      action();
    }
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    await saveCard();
    setSaving(false);
    setShowUnsaved(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function handleDiscard() {
    setShowUnsaved(false);
    pendingAction?.();
    setPendingAction(null);
    if (card) initEditBuffer(card);
  }

  async function handleSave() {
    setSaving(true);
    await saveCard();
    setSaving(false);
  }

  async function handleNewCard() {
    requestAction(async () => {
      const newId = await addNewCard();
      if (newId) navigate(`/admin/lessons/${lessonId}/cards/${newId}`);
    });
  }

  if (!card) return <div className="text-muted p-3">Card not found</div>;
  if (!editBuffer) return <Spinner animation="border" size="sm" />;

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-end mb-2">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => requestAction(() => navigate(`/admin/lessons/${lessonId}`))}
          title="Close editor"
        >✕</Button>
      </div>
      <CardEditorNav
        lessonId={lessonId}
        cardId={cardId}
        onNavigate={path => requestAction(() => navigate(path))}
        onNewCard={handleNewCard}
      />

      <Tabs defaultActiveKey="basic" className="mb-3" unmountOnExit>
        <Tab eventKey="basic" title="Basic Info">
          <BasicInfoTab />
        </Tab>
        <Tab eventKey="details" title="Details">
          <DetailsTab />
        </Tab>
        <Tab eventKey="modes" title="Modes">
          <CardModesTab />
        </Tab>
      </Tabs>

      <div className="d-flex justify-content-end gap-2 mt-3 pt-3 border-top">
        {isDirty && <span className="text-warning small align-self-center">Unsaved changes</span>}
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
        >
          {saving ? <><Spinner animation="border" size="sm" className="me-1" />Saving…</> : 'Save'}
        </Button>
      </div>

      <UnsavedChangesModal
        show={showUnsaved}
        onSave={handleSaveAndContinue}
        onDiscard={handleDiscard}
        onCancel={() => { setShowUnsaved(false); setPendingAction(null); }}
      />
    </div>
  );
}

export default CardEditorPanel;
