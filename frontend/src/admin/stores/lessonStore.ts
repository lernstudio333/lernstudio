import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { CardTypes } from 'shared';
import { supabase } from '../../lib/supabase';
import type { AdminCard, CardAnswer, CardMode } from '../types/admin.types';

type SortField = 'position' | 'question' | 'card_type' | 'created_at';
type SortDir = 'asc' | 'desc';

interface LessonState {
  lessonId: string | null;
  courseId: string | null;
  programId: string | null;
  cards: AdminCard[];
  isLoadingCards: boolean;
  sortField: SortField;
  sortDir: SortDir;
  selectedCardIds: Set<string>;
  isDirty: boolean;
  editBuffer: Partial<AdminCard> | null;

  setLessonContext: (programId: string, courseId: string) => void;
  loadLesson: (id: string) => Promise<void>;
  reloadCards: () => Promise<void>;
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
  purgeMediaFromCards: (mediaId: string) => void;
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
  courseId: null,
  programId: null,
  cards: [],
  isLoadingCards: false,
  sortField: 'position',
  sortDir: 'asc',
  selectedCardIds: new Set(),
  isDirty: false,
  editBuffer: null,

  setLessonContext(programId, courseId) {
    set({ programId, courseId });
  },

  async reloadCards() {
    const { lessonId } = get();
    if (!lessonId) return;
    set({ isLoadingCards: true });
    const { data, error } = await supabase
      .from('cards')
      .select('*, answers:card_answers(*, media:media(path)), modes:card_modes(*)')
      .eq('lesson_id', lessonId)
      .order('position');
    if (error) { console.error('reloadCards error', error); set({ isLoadingCards: false }); return; }
    set({ cards: (data ?? []) as AdminCard[], isLoadingCards: false });
  },

  async loadLesson(id) {
    if (get().lessonId === id) return;
    set({ isLoadingCards: true, cards: [], lessonId: id, editBuffer: null, isDirty: false, selectedCardIds: new Set() });

    const [cardsRes, lessonRes] = await Promise.all([
      supabase
        .from('cards')
        .select('*, answers:card_answers(*, media:media(path)), modes:card_modes(*)')
        .eq('lesson_id', id)
        .order('position'),
      supabase
        .from('lessons')
        .select('course_id, course:courses(program_id)')
        .eq('id', id)
        .single(),
    ]);

    if (cardsRes.error) {
      console.error('loadLesson error', cardsRes.error);
      set({ isLoadingCards: false });
      return;
    }

    const lesson = lessonRes.data;
    const course = lesson ? (Array.isArray(lesson.course) ? lesson.course[0] : lesson.course) : null;
    set({
      cards: (cardsRes.data ?? []) as AdminCard[],
      isLoadingCards: false,
      courseId:  lesson?.course_id ?? get().courseId,
      programId: (course as { program_id: string } | null)?.program_id ?? get().programId,
    });
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
    console.log('[saveCard] upserting card:', { id, ...cardFields });
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .upsert({ id, ...cardFields, updated_at: new Date().toISOString() })
      .select();
    console.log('[saveCard] card upsert result:', { cardData, cardError });
    if (cardError) { console.error('saveCard upsert error', cardError); return; }

    // Replace answers: delete then insert
    const { error: deleteAnswersError } = await supabase.from('card_answers').delete().eq('card_id', id);
    console.log('[saveCard] delete answers result:', { deleteAnswersError });
    if (answers && answers.length > 0) {
      const rows: Omit<CardAnswer, 'id'>[] = answers.map((a, i) => ({
        card_id: id,
        answer_text: a.answer_text,
        position: a.position ?? i,
        media_id: a.media_id ?? null,
      }));
      console.log('[saveCard] inserting answers:', rows);
      const { data: answersData, error: answersError } = await supabase.from('card_answers').insert(rows).select();
      console.log('[saveCard] answers insert result:', { answersData, answersError });
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
      .select('*, answers:card_answers(*, media:media(path)), modes:card_modes(*)')
      .eq('id', id)
      .single();

    if (fresh) {
      set(s => ({
        cards: s.cards.map(c => c.id === id ? fresh as AdminCard : c),
        isDirty: false,
        editBuffer: { ...fresh as AdminCard },
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
        card_type: CardTypes.SINGLE_CARD.key,
        position: maxPos + 1,
      })
      .select('*, answers:card_answers(*, media:media(path)), modes:card_modes(*)')
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

  purgeMediaFromCards(mediaId) {
    set(s => {
      const stripAnswers = (answers: CardAnswer[]) => answers.filter(a => a.media_id !== mediaId);
      const cards = s.cards.map(c => ({ ...c, answers: stripAnswers(c.answers) }));
      const editBuffer = s.editBuffer?.answers
        ? { ...s.editBuffer, answers: stripAnswers(s.editBuffer.answers as CardAnswer[]) }
        : s.editBuffer;
      return { cards, editBuffer };
    });
  },
}));
