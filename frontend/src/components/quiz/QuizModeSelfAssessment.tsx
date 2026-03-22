import { useState } from 'react';
import { Button } from 'react-bootstrap';
import type { BasicCard } from 'shared/enums';
import CardAnswer from './CardAnswer';
import type { AnswerOutcome } from './sessionTypes';

interface Props {
  displayCard: BasicCard;
  audio:       any;
  onAnswer:    (outcome: AnswerOutcome) => void;
}

export default function QuizModeSelfAssessment({ displayCard, audio, onAnswer }: Props) {
  const [revealed, setRevealed] = useState(false);

  const tipLines = displayCard.tip?.split('\n').filter(Boolean) ?? [];

  function handleOutcome(outcome: AnswerOutcome) {
    if (outcome === 'CORRECT') {
      try { audio?.success?.play(); } catch { /* ignore */ }
    }
    onAnswer(outcome);
  }

  return (
    <div>
      {!revealed ? (
        <Button variant="outline-secondary" onClick={() => setRevealed(true)}>
          Show Answer
        </Button>
      ) : (
        <>
          {/* Answer card */}
          <div className="mb-3 p-3 bg-light rounded border w-100">
            <CardAnswer answer={displayCard.answer} />
          </div>

          {/* Tip card */}
          {tipLines.length > 0 && (
            <div className="mb-3 p-3 bg-body-tertiary rounded border w-100 text-muted small fst-italic">
              {tipLines.map((line, i) => <p key={i} className="mb-0">{line}</p>)}
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            <Button variant="outline-danger"  onClick={() => handleOutcome('WRONG')}>
              I don't know
            </Button>
            <Button variant="outline-warning" onClick={() => handleOutcome('ALMOST')}>
              Almost knew it
            </Button>
            <Button variant="outline-success" onClick={() => handleOutcome('CORRECT')}>
              Easy
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
