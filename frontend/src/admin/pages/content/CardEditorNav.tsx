import { Button, Badge } from 'react-bootstrap';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import type { AdminCard } from '../../types/admin.types';

const TYPE_COLORS: Record<string, string> = {
  SC: 'primary', MC: 'success', SYN: 'warning', GAP: 'info',
  'IMG-SC': 'secondary', 'IMG-MC': 'dark',
};

interface Props {
  lessonId: string;
  cardId: string;
  onNavigate: (path: string) => void;
  onNewCard:  () => void;
}

function CardEditorNav({ lessonId, cardId, onNavigate, onNewCard }: Props) {
  const cards = useLessonStore(s => s.cards);
  const sortField = useLessonStore(s => s.sortField);
  const sortDir = useLessonStore(s => s.sortDir);

  const sorted = getSortedCards({ cards, sortField, sortDir });
  const currentIndex = sorted.findIndex(c => c.id === cardId);
  const total = sorted.length;
  const currentCard = sorted[currentIndex] as AdminCard | undefined;

  return (
    <div className="d-flex align-items-center gap-2 mb-3">
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={currentIndex <= 0}
        onClick={() => onNavigate(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex - 1].id}`)}
      >← Prev</Button>

      <span className="small text-muted">
        {currentIndex + 1} / {total}
      </span>

      <Button
        size="sm"
        variant="outline-secondary"
        disabled={currentIndex >= total - 1}
        onClick={() => onNavigate(`/admin/lessons/${lessonId}/cards/${sorted[currentIndex + 1].id}`)}
      >Next →</Button>

      <Button
        size="sm"
        variant="outline-primary"
        onClick={onNewCard}
        title="New card"
      >+ New</Button>

      {currentCard && (
        <Badge bg={TYPE_COLORS[currentCard.card_type] ?? 'secondary'} className="ms-1">
          {currentCard.card_type}
        </Badge>
      )}
    </div>
  );
}

export default CardEditorNav;
