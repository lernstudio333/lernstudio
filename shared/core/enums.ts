import { createEnum } from './enumFactory.ts';
import type { EnumEntry } from './enumFactory.ts';
import { MAX_TYPED_ANSWER_LENGTH, MIN_ARRANGE_ORDER_PARTS } from './constants.ts';

// ── Simple Enums ─────────────────────────────────────────────

export const ErrorType = createEnum({
  NONE:                 { order: 0, scoreChange: +1, penalty: 0 },
  MC_WRONG:             { order: 1, scoreChange: -2, penalty: 2 },
  TYPING_MISSPELLED:    { order: 2, scoreChange: -1, penalty: 1 },
  TYPING_WRONG:         { order: 3, scoreChange: -2, penalty: 2 },
  SELF_ASSESS_ALMOST:   { order: 4, scoreChange: -1, penalty: 1 },
  SELF_ASSESS_WRONG:    { order: 5, scoreChange: -2, penalty: 2 },
  ARRANGE_ORDER_ALMOST: { order: 6, scoreChange: -2, penalty: 2 },
  ARRANGE_ORDER_WRONG:  { order: 7, scoreChange: -2, penalty: 2 },
});

export const QuizMode = createEnum({
  DISPLAY_ANSWER:  { order: 0 },
  MULTIPLE_CHOICE: { order: 1 },
  TYPED_ANSWER:    { order: 2 },
  SELF_ASSESSMENT: { order: 3 },
  ARRANGE_ORDER:   { order: 4 },
});

export const SupersedeMode = createEnum({
  REPLACE_LOWER: { order: 0 },
  POOL:          { order: 1 },
});

export const StudyMode = createEnum({
  NEW:    { order: 0 },
  REPEAT: { order: 1 },
});

// ── BasicCard  (stub — full Card interface defined in shared/features/cards) ──

/** Lightweight media reference — full public URL resolved before quizzing. */
export type MediaRef = {
  url: string;
};

/**
 * Minimal card structure consumed by transformers and filters.
 * question mirrors the same possible types as answer so that bijective
 * transformers (e.g. backward) can swap the two without type errors.
 * Singular MediaRef is needed because pickFirstAnswer / pickAnswer reduce
 * MediaRef[] to a single element.
 */
export interface BasicCard {
  cardType: string;
  question: string | string[] | MediaRef | MediaRef[];
  answer:   string | string[] | MediaRef | MediaRef[];
  tip?:     string;
}

// ── Helpers ───────────────────────────────────────────────────

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

/**
 * TODO: implement character-level masking for progressive answer reveal.
 * See legacy `anonymizeString` in frontend/src/components/Question.tsx.
 */
function randomizeString(s: string): string {
  return s;
}

// ── Transformers ──────────────────────────────────────────────

/** Randomizes characters in each string part of the answer (stub). */
export function partRandomize(input: BasicCard): BasicCard {
  const newCard = { ...input };
  if (typeof input.answer === 'string') {
    newCard.answer = randomizeString(input.answer);
  } else if (Array.isArray(input.answer)) {
    newCard.answer = (input.answer as string[]).map(s => randomizeString(s));
  }
  return newCard;
}

/** Swaps question and answer so the card can be studied in reverse. */
export function backward(input: BasicCard): BasicCard {
  return { ...input, question: input.answer, answer: input.question };
}

/** Reduces an array answer to its first element. */
export function pickFirstAnswer(input: BasicCard): BasicCard {
  const newCard = { ...input };
  if (Array.isArray(input.answer)) {
    newCard.answer = (input.answer as (string | MediaRef)[])[0];
  }
  return newCard;
}

/** Reduces an array answer to one randomly selected element. */
export function pickAnswer(input: BasicCard): BasicCard {
  const newCard = { ...input };
  if (Array.isArray(input.answer)) {
    const arr   = input.answer as (string | MediaRef)[];
    const index = Math.floor(Math.random() * arr.length);
    newCard.answer = arr[index];
  }
  return newCard;
}

/**
 * SYNONYM cards only.
 * Always picks the first synonym as the answer.
 * Remaining synonyms become the tip ("not: X, Y, Z").
 */
export function pickSynAnswerFirst(input: BasicCard): BasicCard {
  assert(String(input.cardType) === 'SYNONYM', 'pickSynAnswerFirst: expected SYNONYM card type');
  assert(Array.isArray(input.answer),          'pickSynAnswerFirst: expected array answer');

  const pool         = [...(input.answer as string[])];
  const pickedAnswer = pool.splice(0, 1)[0];

  return { ...input, answer: pickedAnswer, tip: 'not: ' + pool.join(', ') };
}

/**
 * SYNONYM cards only.
 * Randomly picks one item from [question, ...answers] as the new question,
 * then randomly picks one of the remaining items as the answer.
 * The rest become the tip ("not: X, Y, Z").
 */
export function pickSynAnswer(input: BasicCard): BasicCard {
  assert(String(input.cardType) === 'SYNONYM', 'pickSynAnswer: expected SYNONYM card type');
  assert(Array.isArray(input.answer),          'pickSynAnswer: expected array answer');

  const pool = [input.question as string, ...(input.answer as string[])];

  const qIdx           = Math.floor(Math.random() * pool.length);
  const pickedQuestion = pool.splice(qIdx, 1)[0];

  const aIdx           = Math.floor(Math.random() * pool.length);
  const pickedAnswer   = pool.splice(aIdx, 1)[0];

  return { ...input, question: pickedQuestion, answer: pickedAnswer, tip: 'not: ' + pool.join(', ') };
}

// ── Filters ───────────────────────────────────────────────────

/** Allows TYPED_ANSWER mode only when the answer is a single short string (as a 1-element array). */
export function allowTypedAnswer(input: BasicCard): boolean {
  return Array.isArray(input.answer) &&
    input.answer.length === 1 &&
    typeof input.answer[0] === 'string' &&
    (input.answer[0] as string).length <= MAX_TYPED_ANSWER_LENGTH;
}

/** Allows ARRANGE_ORDER mode only when the answer has multiple string parts. */
export function allowArrangeOrder(input: BasicCard): boolean {
  return Array.isArray(input.answer) && input.answer.length >= MIN_ARRANGE_ORDER_PARTS &&
    typeof input.answer[0] === 'string';
}

// ── Quizzing Rule type ────────────────────────────────────────

type AnyEnumEntry = EnumEntry<string, Record<string, unknown>>;

export type QuizzingRule = {
  mode:        AnyEnumEntry;
  label:       string;
  transformer: ((card: BasicCard) => BasicCard) | null;
  filter:      ((card: BasicCard) => boolean)   | null;
  min_score:   number;
  supersede:   AnyEnumEntry;
};

// ── CardTypes ─────────────────────────────────────────────────

export const CardTypes = createEnum({
  SINGLE_CARD: {
    order:          1,
    question_label: 'Was bedeutet',
    export_as:      'Single card',
    quizzing: [
      { mode: QuizMode.DISPLAY_ANSWER,  label: 'Display Answer',               transformer: null,          filter: null,        min_score: 0, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice',              transformer: null,          filter: null,        min_score: 1, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice (Randomized)', transformer: partRandomize, filter: null,        min_score: 3, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.TYPED_ANSWER,    label: 'Typed Answer',                 transformer: null,          filter: allowTypedAnswer, min_score: 5, supersede: SupersedeMode.POOL },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment',              transformer: null,          filter: null,        min_score: 5, supersede: SupersedeMode.POOL },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice (Backward)',   transformer: backward,      filter: null,        min_score: 7, supersede: SupersedeMode.POOL },
    ] as QuizzingRule[],
  },
  MULTI_CARD: {
    order:          2,
    question_label: 'Was bedeutet',
    export_as:      'Multi card',
    quizzing: [
      { mode: QuizMode.DISPLAY_ANSWER,  label: 'Display Answer',  transformer: null,          filter: null,             min_score: 0, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: null,          filter: null,             min_score: 1, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: partRandomize, filter: null,             min_score: 3, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.ARRANGE_ORDER,   label: 'Arrange Order',   transformer: null,          filter: allowArrangeOrder, min_score: 3, supersede: SupersedeMode.POOL },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment', transformer: null,          filter: null,             min_score: 5, supersede: SupersedeMode.POOL },
    ] as QuizzingRule[],
  },
  SYNONYM: {
    order:          3,
    question_label: 'Nenne ein Synonym für ...',
    export_as:      'Synonym',
    quizzing: [
      { mode: QuizMode.DISPLAY_ANSWER,  label: 'Display Answer',  transformer: null,              filter: null, min_score: 0, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: pickSynAnswerFirst, filter: null, min_score: 1, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment', transformer: pickSynAnswerFirst, filter: null, min_score: 5, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment', transformer: pickSynAnswer,      filter: null, min_score: 7, supersede: SupersedeMode.REPLACE_LOWER },
    ] as QuizzingRule[],
  },
  GAP: {
    order:          4,
    question_label: 'Vervollständige',
    export_as:      'Gap card',
    quizzing: [
      { mode: QuizMode.DISPLAY_ANSWER,  label: 'Display Answer',  transformer: null,          filter: null, min_score: 0, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: null,          filter: null, min_score: 1, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: partRandomize, filter: null, min_score: 3, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment', transformer: null,          filter: null, min_score: 5, supersede: SupersedeMode.REPLACE_LOWER },
    ] as QuizzingRule[],
  },
  IMAGES: {
    order:          5,
    question_label: 'Bilder-Quiz',
    export_as:      'Images',
    quizzing: [
      { mode: QuizMode.DISPLAY_ANSWER,  label: 'Display Answer',  transformer: null,                            filter: null, min_score: 0, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: pickFirstAnswer,                 filter: null, min_score: 1, supersede: SupersedeMode.REPLACE_LOWER },
      { mode: QuizMode.SELF_ASSESSMENT, label: 'Self Assessment', transformer: pickAnswer,                      filter: null, min_score: 5, supersede: SupersedeMode.POOL },
      { mode: QuizMode.MULTIPLE_CHOICE, label: 'Multiple Choice', transformer: (c) => backward(pickAnswer(c)), filter: null, min_score: 7, supersede: SupersedeMode.POOL },
    ] as QuizzingRule[],
  },
});

// ── Rewards ───────────────────────────────────────────────────

export const Rewards = createEnum({
  MOD_5:   { order: 5,   icon: '🌱', audio: 'success.mp3' },
  MOD_10:  { order: 10,  icon: '🍀', audio: 'success.mp3' },
  IS_13:   { order: 13,  icon: '🙈', audio: 'success.mp3' },
  MOD_20:  { order: 20,  icon: '🌸', audio: 'success.mp3' },
  MOD_50:  { order: 50,  icon: '🪷', audio: 'success.mp3' },
  IS_69:   { order: 69,  icon: '💋', audio: 'success.mp3' },
  MOD_100: { order: 100, icon: '🏆', audio: 'success.mp3' },
});
