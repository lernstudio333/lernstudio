import { Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import type { AdminCard } from '../../types/admin.types';

const TYPE_COLORS: Record<string, string> = {
  SC: 'primary', MC: 'success', SYN: 'warning', GAP: 'info',
  'IMG-SC': 'secondary', 'IMG-MC': 'dark',
};

interface Props {
  lessonId: string;
  cardId: string;
  onNavigate?: () => void;
}

function CardEditorNav({ lessonId, cardId, onNavigate }: Props) {
  const navigate = useNavigate();
  const cards = useLessonStore(s => s.cards);
  const sortField = useLessonStore(s => s.sortField);
  const sortDir = useLessonStore(s => s.sortDir);

  const sorted = getSortedCards({ cards, sortField, sortDir });
  const currentIndex = sorted.findIndex(c => c.id === cardId);
  const total = sorted.length;
  const currentCard = sorted[currentIndex] as AdminCard | undefined;

  function goTo(index: number) {
    if (index < 0 || index >= total) return;
    onNavigate?.();
    navigate(`/admin/lessons/${lessonId}/cards/${sorted[index].id}`);
  }

  return (
    <div className="d-flex align-items-center gap-3 mb-3">
      <Button
        size="sm"
        variant="outline-secondary"
        disabled={currentIndex <= 0}
        onClick={() => goTo(currentIndex - 1)}
      >← Previous</Button>

      <span className="small text-muted">
        Card {currentIndex + 1} of {total}
      </span>

      <Button
        size="sm"
        variant="outline-secondary"
        disabled={currentIndex >= total - 1}
        onClick={() => goTo(currentIndex + 1)}
      >Next →</Button>

      {currentCard && (
        <Badge bg={TYPE_COLORS[currentCard.card_type] ?? 'secondary'} className="ms-2">
          {currentCard.card_type}
        </Badge>
      )}
    </div>
  );
}

export default CardEditorNav;
