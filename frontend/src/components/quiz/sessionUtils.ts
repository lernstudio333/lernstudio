import type { StudyCard, StudyCardWithLearning } from 'shared/features/study';
import { MAX_SESSION_ROUNDS } from 'shared/constants';
import type { BasicCard, QuizzingRule, MediaRef } from 'shared/enums';
import { selectQuizzingRule } from 'shared/quiz-engine';
import { randomSample } from '../../hooks/util';
import { DEBUG_QUIZ, resolveImageUrl } from '../../config';
import type { SessionCard, AnswerOutcome } from './sessionTypes';

// ── Session card builder ──────────────────────────────────────

export function toSessionCard(card: StudyCardWithLearning): SessionCard {
  const score = card.learning?.score ?? 0;
  return {
    id:       card.id,
    cardType: card.cardType,
    question: card.question,
    tip:      card.tip,
    answers:  card.answers,
    score,
    initialScore:          score,
    errorsByType:          card.learning?.errorsByType  ?? {},
    lastVisited:           card.learning?.lastVisited   ?? null,
    favoriteDate:          card.learning?.favoriteDate  ?? null,
    isFavorite:            card.learning?.favoriteDate  != null,
    answeredInThisSession: 0,
    doneInThisSession:     false,
  };
}

// ── Score deltas ──────────────────────────────────────────────

/** How much the card's learning score changes per outcome (legacy values). */
export const SCORE_DELTA: Record<AnswerOutcome, number> = {
  CORRECT: +1,
  ALMOST:   0,
  WRONG:   -1,
};

/** How much the session display counter changes per outcome. */
export const COUNTER_DELTA: Record<AnswerOutcome, number> = {
  CORRECT: 5,
  ALMOST:  1,
  WRONG:   0,
};

// ── Apply answer to a session card ────────────────────────────

export function applyAnswer(
  card:         SessionCard,
  outcome:      AnswerOutcome,
  errorTypeKey: string | null,  // e.g. 'MC_WRONG', 'SELF_ASSESS_ALMOST', null for CORRECT
): SessionCard {
  const newScore    = Math.max(0, card.score + SCORE_DELTA[outcome]);
  const newAnswered = card.answeredInThisSession + 1;
  const scoreGain   = newScore - card.initialScore;

  // Card is done when score gained ≥ 2 on a CORRECT answer, or answered ≥ 5 times
  const doneInThisSession =
    card.doneInThisSession ||
    (scoreGain >= 2 && outcome === 'CORRECT') ||
    newAnswered >= 5;

  const errorsByType = { ...card.errorsByType };
  if (errorTypeKey) {
    errorsByType[errorTypeKey] = (errorsByType[errorTypeKey] ?? 0) + 1;
  }

  return {
    ...card,
    score:                 newScore,
    errorsByType,
    lastVisited:           new Date().toISOString(),
    answeredInThisSession: newAnswered,
    doneInThisSession,
  };
}

// ── Queue management ──────────────────────────────────────────

type Where = 'NEAR' | 'MIDDLE' | 'END';

function getRandomInt(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

export function moveWhere(card: SessionCard, outcome: AnswerOutcome): Where {
  if (outcome !== 'CORRECT') return 'NEAR';
  if (card.score <= 2)       return 'NEAR';
  if (card.score > 4)        return 'END';
  return 'MIDDLE';
}

export function moveCard(where: Where, queue: SessionCard[], current: SessionCard): SessionCard[] {
  // Done cards always go to the end
  if (where === 'END' || current.doneInThisSession) {
    return [...queue.slice(1), current];
  }

  const randomDistance = where === 'NEAR'
    ? 1 + getRandomInt(2)
    : 3 + getRandomInt(3);

  // Find insertion point, but don't insert after a done card
  let insertionPoint = 1;
  while (insertionPoint < randomDistance && insertionPoint < queue.length) {
    if (queue[insertionPoint + 1]?.doneInThisSession) break;
    insertionPoint++;
  }

  return [
    ...queue.slice(1, insertionPoint),
    current,
    ...queue.slice(insertionPoint),
  ];
}

// ── Session end check ─────────────────────────────────────────

export function isSessionDone(queue: SessionCard[], rounds: number, initialCount: number): boolean {
  if (rounds > MAX_SESSION_ROUNDS)   return true;
  if (rounds > initialCount * 3)     return true;
  return queue.every(c => c.doneInThisSession);
}

// ── BasicCard helpers ─────────────────────────────────────────

/** Converts a StudyCard / SessionCard into the BasicCard format used by the transformer pipeline. */
export function toBasicCard(card: StudyCard | SessionCard): BasicCard {
  if (card.cardType === 'IMAGES') {
    const images: MediaRef[] = card.answers
      .filter(a => a.imagePath)
      .map(a => ({ url: resolveImageUrl(a.imagePath!) }));
    return {
      cardType: card.cardType,
      question: card.question,
      answer:   images.length === 1 ? images[0] : images,
      tip:      card.tip ?? undefined,
    };
  }

  // Always string[] — transformers (pickSynAnswerFirst, pickSynAnswer, allowArrangeOrder)
  // all require Array.isArray. Collapsing to a plain string causes assertion failures.
  const answer: string[] = card.answers
    .map(a => a.answerText)
    .filter((t): t is string => Boolean(t));

  return {
    cardType: card.cardType,
    question: card.question,
    answer,
    tip: card.tip ?? undefined,
  };
}

/**
 * Thin wrapper: converts a SessionCard → BasicCard, then delegates to the
 * pure selectQuizzingRule in shared/quiz-engine (which can be unit-tested).
 */
export function selectQuizzingRuleForCard(
  card:    SessionCard,
  viable?: (rule: QuizzingRule) => boolean,
): QuizzingRule {
  return selectQuizzingRule(card.cardType, card.score, toBasicCard(card), viable);
}

/** Applies a rule's transformer to a BasicCard (identity if no transformer). */
export function applyRule(rule: QuizzingRule, card: BasicCard): BasicCard {
  return rule.transformer ? rule.transformer(card) : card;
}

/**
 * Builds MC options (1 correct + up to 3 distractors), all as BasicCard['answer'].
 * Applies the same rule transformer to each candidate for display consistency.
 * @param correctAnswer - the correct answer for the current card (post-transform)
 * @param candidates    - distractor pool: edge-function cards + other session cards as fallback
 * @param currentCardId - excluded from pool to prevent self-distraction
 * @param rule          - current quizzing rule (transformer applied to distractors too)
 */
export function buildMcOptions(
  correctAnswer:   BasicCard['answer'],
  candidates:      Array<StudyCard | SessionCard>,
  currentCardId:   string,
  currentCardType: string,
  rule:            QuizzingRule,
): BasicCard['answer'][] {
  const correctKey = JSON.stringify(correctAnswer);
  const seen = new Set<string>([correctKey]);
  const pool: BasicCard['answer'][] = [];

  for (const d of candidates) {
    if (d.id === currentCardId) continue;
    if (d.cardType !== currentCardType) continue;   // only same card type as distractor
    const basic = toBasicCard(d);
    const transformed = rule.transformer ? rule.transformer(basic) : basic;
    const key = JSON.stringify(transformed.answer);
    if (!seen.has(key) && key !== '""' && key !== JSON.stringify('')) {
      seen.add(key);
      pool.push(transformed.answer);
    }
  }

  const count = Math.min(pool.length, 3);
  const picks = count > 0 ? randomSample([...pool], count) : [];

  if (DEBUG_QUIZ && count < 3) {
    console.warn(
      `[QuizDebug] MC distractor shortage: needed 3, got ${count}.`,
      `Total candidates passed: ${candidates.length}.`,
      `Available pool (first 5): [${pool.slice(0, 5).map(p => JSON.stringify(p)).join(' | ')}]`,
    );
  }

  const opts = [...picks];
  opts.splice(Math.floor(Math.random() * (opts.length + 1)), 0, correctAnswer);
  return opts;
}

// ── Reward milestones ─────────────────────────────────────────

export interface RewardEntry { icon: string; audio: string; }

const MILESTONES: { check: (s: number) => boolean; icon: string }[] = [
  { check: s => s === 69,                icon: '💋' },
  { check: s => s === 13,                icon: '🙈' },
  { check: s => s > 0 && s % 100 === 0, icon: '🏆' },
  { check: s => s > 0 && s % 50  === 0, icon: '🪷' },
  { check: s => s > 0 && s % 20  === 0, icon: '🌸' },
  { check: s => s > 0 && s % 10  === 0, icon: '🍀' },
  { check: s => s > 0 && s % 5   === 0, icon: '🌱' },
];

/** Returns the most significant reward earned going from oldScore → newScore. */
export function checkReward(oldScore: number, newScore: number): RewardEntry | null {
  for (let s = newScore; s > oldScore; s--) {
    for (const m of MILESTONES) {
      if (m.check(s)) return { icon: m.icon, audio: 'success.mp3' };
    }
  }
  return null;
}
