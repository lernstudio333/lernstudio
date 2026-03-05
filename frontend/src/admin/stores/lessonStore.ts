import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { supabase } from '../../lib/supabase';
import type { AdminCard, CardAnswer, CardMode } from '../types/admin.types';

type SortField = 'position' | 'question' | 'card_type' | 'created_at';
type SortDir = 'asc' | 'desc';

interface LessonState {
  lessonId: string | null;
  cards: AdminCard[];
  isLoadingCards: boolean;
  sortField: SortField;
  sortDir: SortDir;
  selectedCardIds: Set<string>;
  isDirty: boolean;
  editBuffer: Partial<AdminCard> | null;

  loadLesson: (id: string) => Promise<void>;
  setSort: (field: SortField, dir: SortDir) => void;
  updateEditBuffer: (partial: Partial<AdminCard>) => void;
  initEditBuffer: (card: AdminCard) => void;
  saveCard: () => Promise<void>;
  reorderCards: (activeId: string, overId: string) => Promise<void>;
  batchMove: (cardIds: string[], targetLessonId: string) => Promise<void>;
  toggleSelectCard: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  addNewCard: () => Promise<string | null>;
  deleteCards: (ids: string[]) => Promise<void>;
}

export const getSortedCards = (state: Pick<LessonState, 'cards' | 'sortField' | 'sortDir'>): AdminCard[] => {
  const { cards, sortField, sortDir } = state;
  return [...cards].sort((a, b) => {
    let av: string | number = a[sortField] ?? '';
    let bv: string | number = b[sortField] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
};

export const useLessonStore = create<LessonState>((set, get) => ({
  lessonId: null,
  cards: [],
  isLoadingCards: false,
  sortField: 'position',
  sortDir: 'asc',
  selectedCardIds: new Set(),
  isDirty: false,
  editBuffer: null,

  async loadLesson(id) {
    if (get().lessonId === id) return;
    set({ isLoadingCards: true, cards: [], lessonId: id, editBuffer: null, isDirty: false, selectedCardIds: new Set() });

    const { data, error } = await supabase
      .from('cards')
      .select('*, answers:card_answers(*), modes:card_modes(*)')
      .eq('lesson_id', id)
      .order('position');

    if (error) {
      console.error('loadLesson error', error);
      set({ isLoadingCards: false });
      return;
    }

    set({ cards: (data ?? []) as AdminCard[], isLoadingCards: false });
  },

  setSort(field, dir) {
    set({ sortField: field, sortDir: dir });
  },

  initEditBuffer(card) {
    set({ editBuffer: { ...card, answers: [...card.answers], modes: [...card.modes] }, isDirty: false });
  },

  updateEditBuffer(partial) {
    set(s => ({ editBuffer: { ...s.editBuffer, ...partial }, isDirty: true }));
  },

  async saveCard() {
    const { editBuffer, cards } = get();
    if (!editBuffer?.id) return;

    const { id, answers, modes, ...cardFields } = editBuffer as AdminCard;

    // Upsert the card row
    const { error: cardError } = await supabase
      .from('cards')
      .upsert({ id, ...cardFields, updated_at: new Date().toISOString() });
    if (cardError) { console.error('saveCard upsert error', cardError); return; }

    // Replace answers: delete then insert
    await supabase.from('card_answers').delete().eq('card_id', id);
    if (answers && answers.length > 0) {
      const rows: Omit<CardAnswer, 'id'>[] = answers.map((a, i) => ({
        card_id: id,
        answer_text: a.answer_text,
        is_correct: a.is_correct,
        position: a.position ?? i,
        media_id: a.media_id ?? null,
      }));
      await supabase.from('card_answers').insert(rows);
    }

    // Replace modes: delete then insert
    await supabase.from('card_modes').delete().eq('card_id', id);
    if (modes && modes.length > 0) {
      const modeRows: Omit<CardMode, 'id'>[] = modes.map(m => ({
        card_id: id,
        mode: m.mode,
        value: m.value ?? 1,
        min_score: m.min_score ?? 0,
      }));
      await supabase.from('card_modes').insert(modeRows);
    }

    // Re-fetch the saved card to get fresh data
    const { data: fresh } = await supabase
      .from('cards')
      .select('*, answers:card_answers(*), modes:card_modes(*)')
      .eq('id', id)
      .single();

    if (fresh) {
      set(s => ({
        cards: s.cards.map(c => c.id === id ? fresh as AdminCard : c),
        isDirty: false,
        editBuffer: null,
      }));
    }
  },

  async reorderCards(activeId, overId) {
    const sorted = getSortedCards(get());
    const oldIndex = sorted.findIndex(c => c.id === activeId);
    const newIndex = sorted.findIndex(c => c.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sorted, oldIndex, newIndex);
    const updated = reordered.map((c, i) => ({ ...c, position: i }));

    // Optimistic update
    set(s => ({
      cards: s.cards.map(c => {
        const u = updated.find(u => u.id === c.id);
        return u ? { ...c, position: u.position } : c;
      }),
    }));

    // Batch upsert positions
    const upserts = updated.map(c => ({ id: c.id, position: c.position, lesson_id: c.lesson_id }));
    await supabase.from('cards').upsert(upserts);
  },

  async batchMove(cardIds, targetLessonId) {
    const { cards } = get();
    // Get current max position in target
    const { data: targetCards } = await supabase
      .from('cards')
      .select('position')
      .eq('lesson_id', targetLessonId)
      .order('position', { ascending: false })
      .limit(1);
    const startPos = (targetCards?.[0]?.position ?? -1) + 1;

    const updates = cardIds.map((id, i) => ({ id, lesson_id: targetLessonId, position: startPos + i }));

    // Optimistic update — remove from current list
    set(s => ({ cards: s.cards.filter(c => !cardIds.includes(c.id)) }));

    await supabase.from('cards').upsert(updates);
  },

  toggleSelectCard(id) {
    set(s => {
      const next = new Set(s.selectedCardIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedCardIds: next };
    });
  },

  toggleSelectAll() {
    const { cards, selectedCardIds } = get();
    if (selectedCardIds.size === cards.length) {
      set({ selectedCardIds: new Set() });
    } else {
      set({ selectedCardIds: new Set(cards.map(c => c.id)) });
    }
  },

  clearSelection() {
    set({ selectedCardIds: new Set() });
  },

  async addNewCard() {
    const { lessonId, cards } = get();
    if (!lessonId) return null;
    const maxPos = cards.reduce((m, c) => Math.max(m, c.position), -1);
    const { data, error } = await supabase
      .from('cards')
      .insert({
        lesson_id: lessonId,
        question: '',
        card_type: 'SC',
        position: maxPos + 1,
      })
      .select('*, answers:card_answers(*), modes:card_modes(*)')
      .single();
    if (error || !data) { console.error('addNewCard error', error); return null; }
    set(s => ({ cards: [...s.cards, data as AdminCard] }));
    return data.id;
  },

  async deleteCards(ids) {
    await supabase.from('cards').delete().in('id', ids);
    set(s => ({
      cards: s.cards.filter(c => !ids.includes(c.id)),
      selectedCardIds: new Set([...s.selectedCardIds].filter(id => !ids.includes(id))),
    }));
  },
}));
