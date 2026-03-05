import { useState } from 'react';
import { Button, Dropdown, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useLessonStore, getSortedCards } from '../../stores/lessonStore';
import type { AdminCard } from '../../types/admin.types';

type SortField = 'position' | 'question' | 'card_type' | 'created_at';

interface Props {
  lessonId: string;
}

function CardListToolbar({ lessonId }: Props) {
  const navigate = useNavigate();
  const sortField = useLessonStore(s => s.sortField);
  const sortDir = useLessonStore(s => s.sortDir);
  const setSort = useLessonStore(s => s.setSort);
  const selectedCardIds = useLessonStore(s => s.selectedCardIds);
  const cards = useLessonStore(s => s.cards);
  const toggleSelectAll = useLessonStore(s => s.toggleSelectAll);
  const addNewCard = useLessonStore(s => s.addNewCard);
  const deleteCards = useLessonStore(s => s.deleteCards);
  const batchMove = useLessonStore(s => s.batchMove);

  const sortedCards = getSortedCards({ cards, sortField, sortDir });
  const allSelected = selectedCardIds.size === cards.length && cards.length > 0;

  function handleSortClick(field: SortField) {
    if (sortField === field) {
      setSort(field, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field, 'asc');
    }
  }

  async function handleAddCard() {
    const newId = await addNewCard();
    if (newId) navigate(`/admin/lessons/${lessonId}/cards/${newId}`);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${selectedCardIds.size} card(s)?`)) return;
    await deleteCards([...selectedCardIds]);
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div>
      {selectedCardIds.size > 0 && (
        <div className="d-flex align-items-center gap-2 mb-2 p-2 bg-light rounded">
          <span className="small fw-semibold">{selectedCardIds.size} selected</span>
          <Button size="sm" variant="outline-danger" onClick={handleDelete}>Delete</Button>
        </div>
      )}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Form.Check
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            label=""
            title="Select all"
          />
          <div className="d-flex gap-1">
            {(['position', 'question', 'card_type', 'created_at'] as SortField[]).map(f => (
              <Button
                key={f}
                size="sm"
                variant={sortField === f ? 'secondary' : 'outline-secondary'}
                onClick={() => handleSortClick(f)}
                className="py-0 px-2 text-capitalize"
              >
                {f === 'card_type' ? 'Type' : f === 'created_at' ? 'Date' : f.charAt(0).toUpperCase() + f.slice(1)}
                {sortIcon(f)}
              </Button>
            ))}
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={handleAddCard}>+ New Card</Button>
      </div>
    </div>
  );
}

export default CardListToolbar;
