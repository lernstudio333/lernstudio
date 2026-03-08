import { Table, Spinner } from 'react-bootstrap';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import CardListRow from './CardListRow';
import CardListToolbar from './CardListToolbar';

interface Props {
  lessonId: string;
  cardId: string | undefined;
}

function CardListPanel({ lessonId, cardId }: Props) {
  const cards = useLessonStore(s => s.cards);
  const isLoadingCards = useLessonStore(s => s.isLoadingCards);
  const sortField = useLessonStore(s => s.sortField);
  const sortDir = useLessonStore(s => s.sortDir);
  const reorderCards = useLessonStore(s => s.reorderCards);

  const sorted = getSortedCards({ cards, sortField, sortDir });
  const isDraggable = sortField === 'position';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderCards(String(active.id), String(over.id));
    }
  }

  if (isLoadingCards) {
    return <div className="p-3"><Spinner animation="border" size="sm" /> Loading cards…</div>;
  }

  const compact = !!cardId;

  const table = (
    <Table hover size="sm" className="mb-0 text-start" style={{ tableLayout: 'fixed' }}>
      <colgroup>
        <col style={{ width: '30px' }} />
        <col style={{ width: '32px' }} />
        <col />
        <col style={{ width: '70px' }} />
        {!compact && <col style={{ width: '180px' }} />}
        {!compact && <col style={{ width: '120px' }} />}
        <col style={{ width: '80px' }} />
      </colgroup>
      <thead>
        <tr>
          <th></th>
          <th></th>
          <th>Question</th>
          <th>Type</th>
          {!compact && <th>Answers</th>}
          {!compact && <th>Modes</th>}
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(card => (
          <CardListRow
            key={card.id}
            card={card}
            lessonId={lessonId}
            cardId={cardId}
            isDraggable={isDraggable}
            compact={compact}
          />
        ))}
        {sorted.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center text-muted py-4">No cards yet</td>
          </tr>
        )}
      </tbody>
    </Table>
  );

  return (
    <div>
      <CardListToolbar lessonId={lessonId} />
      {isDraggable ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {table}
          </SortableContext>
        </DndContext>
      ) : (
        table
      )}
    </div>
  );
}

export default CardListPanel;
