import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { useLessonStore } from '../../stores/lessonStore';
import type { AdminCard } from '../../types/admin.types';
import { Form, Badge } from 'react-bootstrap';

interface Props {
  card: AdminCard;
  lessonId: string;
  cardId: string | undefined;
  isDraggable: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  SC: 'primary', MC: 'success', SYN: 'warning', GAP: 'info',
  'IMG-SC': 'secondary', 'IMG-MC': 'dark',
};

function CardListRow({ card, lessonId, cardId, isDraggable }: Props) {
  const navigate = useNavigate();
  const selectedCardIds = useLessonStore(s => s.selectedCardIds);
  const toggleSelectCard = useLessonStore(s => s.toggleSelectCard);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSelected = selectedCardIds.has(card.id);
  const isActive = card.id === cardId;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isActive ? 'table-primary' : ''}
      onClick={() => navigate(`/admin/lessons/${lessonId}/cards/${card.id}`)}
    >
      <td style={{ width: '30px' }} onClick={e => e.stopPropagation()}>
        {isDraggable && (
          <span
            {...attributes}
            {...listeners}
            style={{ cursor: 'grab', color: '#999' }}
            title="Drag to reorder"
          >⠿</span>
        )}
      </td>
      <td style={{ width: '32px' }} onClick={e => e.stopPropagation()}>
        <Form.Check
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelectCard(card.id)}
        />
      </td>
      <td className="text-truncate" style={{ maxWidth: '250px' }}>
        {card.question || <span className="text-muted fst-italic">No question</span>}
      </td>
      <td>
        <Badge bg={TYPE_COLORS[card.card_type] ?? 'secondary'}>{card.card_type}</Badge>
      </td>
      <td className="text-muted small">
        {card.updated_at ? new Date(card.updated_at).toLocaleDateString() : '—'}
      </td>
    </tr>
  );
}

export default CardListRow;
