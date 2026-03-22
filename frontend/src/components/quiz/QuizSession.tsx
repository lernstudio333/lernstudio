import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { FetchStudyCardsResponse, StudyCard } from 'shared/features/study';
import { isCardQuizzable } from 'shared/features/study';
import type { StudyAction } from 'shared/features/programs';

import type { SessionCard, AnswerOutcome } from './sessionTypes';
import {
  toSessionCard, applyAnswer,
  moveWhere, moveCard, isSessionDone,
  toBasicCard, selectQuizzingRuleForCard, applyRule, buildMcOptions,
  COUNTER_DELTA, checkReward,
} from './sessionUtils';

import QuizCard               from './QuizCard';
import QuizModeDisplayAnswer  from './QuizModeDisplayAnswer';
import QuizModeMultipleChoice from './QuizModeMultipleChoice';
import QuizModeSelfAssessment from './QuizModeSelfAssessment';
import QuizModeTypedAnswer    from './QuizModeTypedAnswer';
import QuizModeArrangeOrder   from './QuizModeArrangeOrder';
import SessionComplete        from './SessionComplete';

// ── Props ────────────────────────────────────────────────────

interface Props {
  lessonId:    string;
  studyAction: StudyAction;
  audio:       any;
  counter:     number;             // current global session counter (for reward check start point)
  onClose:     () => void;         // back to ProgramView
  onScoreDelta: (delta: number) => void;   // increment global counter
  onReward:    (icon: string) => void;     // show reward in header
}

// ── Component ────────────────────────────────────────────────

export default function QuizSession({
  lessonId, studyAction, audio, counter, onClose, onScoreDelta, onReward,
}: Props) {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [queue,    setQueue]    = useState<SessionCard[]>([]);
  const [distractors, setDistractors] = useState<StudyCard[]>([]);
  const [rounds,   setRounds]   = useState(0);
  const [feedback, setFeedback] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
  const [sessionFinished, setSessionFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track the initial card count for session-end logic
  const initialCountRef = useRef(0);

  // Track current counter value locally for reward checks (avoids stale closure)
  const counterRef = useRef(counter);
  counterRef.current = counter;

  // ── Fetch cards on mount ────────────────────────────────────

  useEffect(() => {
    supabase.functions
      .invoke<FetchStudyCardsResponse>('fetch-study-cards', {
        body: { lessonId, quizMode: studyAction },
      })
      .then(({ data, error: fnError }) => {
        if (fnError || !data) {
          setError(fnError?.message ?? 'Failed to load cards');
          setLoading(false);
          return;
        }
        const sessionCards = data.studyCards.filter(isCardQuizzable).map(toSessionCard);
        initialCountRef.current = sessionCards.length;
        setQueue(sessionCards);
        setDistractors(data.distractorCards.filter(isCardQuizzable));
        setLoading(false);
      });
  }, []);

  // ── Session end: play fanfare + save ───────────────────────

  useEffect(() => {
    if (!sessionFinished) return;
    try { audio?.successFanfare?.play(); } catch { /* ignore */ }
    saveProgress();
  }, [sessionFinished]);

  async function saveProgress() {
    const answered = queue.filter(c => c.answeredInThisSession > 0);
    if (answered.length === 0) { return; }

    setIsSaving(true);
    try {
      await supabase.functions.invoke('batch-update-learnings', {
        body: {
          updates: answered.map(c => ({
            cardId:       c.id,
            score:        c.score,
            errorsByType: c.errorsByType,
            lastVisited:  c.lastVisited,
            favoriteDate: c.isFavorite ? (c.favoriteDate ?? new Date().toISOString()) : null,
          })),
        },
      });
    } catch (e) {
      console.error('Failed to save learnings:', e);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Answer handler ─────────────────────────────────────────

  function handleAnswer(outcome: AnswerOutcome, errorTypeKey: string | null) {
    const current = queue[0];
    const updated = applyAnswer(current, outcome, errorTypeKey);

    // Update session counter + check reward
    const delta      = COUNTER_DELTA[outcome];
    const oldCounter = counterRef.current;
    const newCounter = oldCounter + delta;
    if (delta > 0) {
      onScoreDelta(delta);
      const reward = checkReward(oldCounter, newCounter);
      if (reward) onReward(reward.icon);
    }

    // Feedback border flash
    setFeedback(outcome === 'CORRECT' ? 'correct' : outcome === 'WRONG' ? 'wrong' : 'neutral');
    setTimeout(() => setFeedback('neutral'), 600);

    // Move card in queue
    const where    = moveWhere(updated, outcome);
    const newQueue = moveCard(where, queue, updated);
    const newRounds = rounds + 1;

    setQueue(newQueue);
    setRounds(newRounds);

    if (isSessionDone(newQueue, newRounds, initialCountRef.current)) {
      setSessionFinished(true);
    }
  }

  // ── Favourite toggle ───────────────────────────────────────

  function toggleFavorite() {
    setQueue(q => {
      const copy = [...q];
      copy[0] = { ...copy[0], isFavorite: !copy[0].isFavorite };
      return copy;
    });
  }

  // ── Quiz pipeline (must run unconditionally — Rules of Hooks) ─
  //
  // card may be undefined while loading/empty; the memos guard against that
  // with fallbacks that are never rendered (early returns below consume them).

  const card             = queue[0];
  const mcCandidateCount = [...distractors, ...queue.slice(1)].filter(d => d.cardType === card?.cardType).length;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const basicCard   = useMemo(
    () => card ? toBasicCard(card) : { cardType: '', question: '', answer: '' } as ReturnType<typeof toBasicCard>,
    [card?.id, rounds],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rule        = useMemo(
    () => card ? selectQuizzingRuleForCard(card, r => String(r.mode) !== 'MULTIPLE_CHOICE' || mcCandidateCount >= 2) : null,
    [card?.id, rounds],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const displayCard = useMemo(
    () => rule ? applyRule(rule, basicCard) : basicCard,
    [card?.id, rounds],
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mcOptions   = useMemo(
    () => card && rule ? buildMcOptions(displayCard.answer, [...distractors, ...queue.slice(1)], card.id, card.cardType, rule) : [],
    [card?.id, rounds],
  );

  // ── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <span className="spinner-border" role="status" />
        <p className="mt-3 text-muted">Loading cards…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-outline-secondary" onClick={onClose}>← Back</button>
      </div>
    );
  }

  if (sessionFinished) {
    return <SessionComplete isSaving={isSaving} onContinue={onClose} />;
  }

  if (queue.length === 0 || !card || !rule) {
    return (
      <div className="container py-5 text-center">
        <h4>Nothing to study right now.</h4>
        <button className="btn btn-outline-secondary mt-3" onClick={onClose}>← Back</button>
      </div>
    );
  }

  const doneCount  = queue.filter(c => c.doneInThisSession).length;
  const totalCount = initialCountRef.current;
  const mode       = rule.mode;

  return (
    <div>
      {/* Close button */}
      <div className="d-flex justify-content-end px-3 pt-2">
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      </div>

      <QuizCard
        question={displayCard.question}
        score={card.score}
        isFavorite={card.isFavorite}
        onFavoriteToggle={toggleFavorite}
        feedback={feedback}
        progress={{ done: doneCount, total: totalCount }}
      >
        {String(mode) === 'DISPLAY_ANSWER' && (
          <QuizModeDisplayAnswer
            key={`display-${card.id}-${rounds}`}
            displayCard={displayCard}
            onNext={() => handleAnswer('CORRECT', null)}
          />
        )}

        {String(mode) === 'MULTIPLE_CHOICE' && (
          <QuizModeMultipleChoice
            key={`mc-${card.id}-${rounds}`}
            options={mcOptions}
            correctAnswer={displayCard.answer}
            audio={audio}
            onAnswer={(correct) =>
              handleAnswer(correct ? 'CORRECT' : 'WRONG', correct ? null : 'MC_WRONG')
            }
          />
        )}

        {String(mode) === 'SELF_ASSESSMENT' && (
          <QuizModeSelfAssessment
            key={`sa-${card.id}-${rounds}`}
            displayCard={displayCard}
            audio={audio}
            onAnswer={(outcome) =>
              handleAnswer(
                outcome,
                outcome === 'CORRECT' ? null
                  : outcome === 'ALMOST' ? 'SELF_ASSESS_ALMOST'
                  : 'SELF_ASSESS_WRONG',
              )
            }
          />
        )}

        {String(mode) === 'TYPED_ANSWER' && (
          <QuizModeTypedAnswer
            key={`typed-${card.id}-${rounds}`}
            displayCard={displayCard}
            audio={audio}
            onAnswer={handleAnswer}
          />
        )}

        {String(mode) === 'ARRANGE_ORDER' && (
          <QuizModeArrangeOrder
            key={`arrange-${card.id}-${rounds}`}
            displayCard={displayCard}
            audio={audio}
            onAnswer={handleAnswer}
          />
        )}
      </QuizCard>
    </div>
  );
}
