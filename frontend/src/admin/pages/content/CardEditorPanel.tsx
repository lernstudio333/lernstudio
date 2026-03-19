import { useEffect, useState } from 'react';
import { Tabs, Tab, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import CardEditorNav from './CardEditorNav';
import BasicInfoTab from './tabs/BasicInfoTab';
import AnswersTab from './tabs/AnswersTab';
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
  const isDirty = useLessonStore(s => s.isDirty);
  const editBuffer = useLessonStore(s => s.editBuffer);

  const [saving, setSaving] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const [showUnsaved, setShowUnsaved] = useState(false);

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
        handleNavRequest(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex - 1].id}`);
      }
      if (e.key === 'ArrowRight' && currentIndex < sorted.length - 1) {
        handleNavRequest(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex + 1].id}`);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cardId, sorted, isDirty]);

  function handleNavRequest(path: string) {
    if (isDirty) {
      setPendingNav(path);
      setShowUnsaved(true);
    } else {
      navigate(path);
    }
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    await saveCard();
    setSaving(false);
    setShowUnsaved(false);
    if (pendingNav) { navigate(pendingNav); setPendingNav(null); }
  }

  function handleDiscard() {
    setShowUnsaved(false);
    if (pendingNav) { navigate(pendingNav); setPendingNav(null); }
    if (card) initEditBuffer(card);
  }

  async function handleSave() {
    setSaving(true);
    await saveCard();
    setSaving(false);
  }

  if (!card) return <div className="text-muted p-3">Card not found</div>;
  if (!editBuffer) return <Spinner animation="border" size="sm" />;

  return (
    <div className="border rounded p-3">
      <div className="d-flex justify-content-end mb-2">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => handleNavRequest(`/admin/lessons/${lessonId}`)}
          title="Close editor"
        >✕</Button>
      </div>
      <CardEditorNav
        lessonId={lessonId}
        cardId={cardId}
        onNavigate={() => {
          if (isDirty) {
            // nav handled via handleNavRequest
          }
        }}
      />

      <Tabs defaultActiveKey="basic" className="mb-3" unmountOnExit>
        <Tab eventKey="basic" title="Basic Info">
          <BasicInfoTab />
        </Tab>
        <Tab eventKey="answers" title="Answers">
          <AnswersTab />
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
        onCancel={() => { setShowUnsaved(false); setPendingNav(null); }}
      />
    </div>
  );
}

export default CardEditorPanel;
