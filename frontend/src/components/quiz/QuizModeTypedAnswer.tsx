import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import type { BasicCard } from 'shared/enums';
import type { AnswerOutcome } from './sessionTypes';

interface Props {
  displayCard: BasicCard;   // answer is always a short string (ensured by allowTypedAnswer filter)
  audio:       any;
  onAnswer:    (outcome: AnswerOutcome, errorType: string | null) => void;
}

/** Levenshtein edit distance (space-optimised). */
function levenshtein(a: string, b: string): number {
  if (a === b)          return 0;
  if (a.length === 0)   return b.length;
  if (b.length === 0)   return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];
    for (let j = 0; j < b.length; j++) {
      curr[j + 1] = a[i] === b[j]
        ? prev[j]
        : 1 + Math.min(prev[j + 1], curr[j], prev[j]);
    }
    prev = curr;
  }
  return prev[b.length];
}

export default function QuizModeTypedAnswer({ displayCard, audio, onAnswer }: Props) {
  const [input,  setInput]  = useState('');
  const [result, setResult] = useState<{ outcome: AnswerOutcome; errorType: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const correctAnswer = (displayCard.answer as string[])[0];
  const tipLines      = displayCard.tip?.split('\n').filter(Boolean) ?? [];

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit() {
    if (result) return;

    const typed   = input.trim().toLowerCase();
    const correct = correctAnswer.trim().toLowerCase();

    if (typed === correct) {
      try { audio?.success?.play(); } catch { /* ignore */ }
      setResult({ outcome: 'CORRECT', errorType: null });
      setTimeout(() => onAnswer('CORRECT', null), 1200);
      return;
    }

    const outcome:   AnswerOutcome = levenshtein(typed, correct) <= 1 ? 'ALMOST' : 'WRONG';
    const errorType: string        = outcome === 'ALMOST' ? 'TYPING_MISSPELLED' : 'TYPING_WRONG';
    if (outcome === 'WRONG') { try { audio?.error?.play(); } catch { /* ignore */ } }

    setResult({ outcome, errorType });
  }

  return (
    <div>
      <Form.Control
        ref={inputRef}
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !result && handleSubmit()}
        placeholder="Type your answer…"
        autoCapitalize="none"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        disabled={!!result}
        className="mb-3"
        style={{ fontSize: '1.1rem' }}
      />

      {!result && (
        <Button variant="primary" onClick={handleSubmit} disabled={input.trim().length === 0}>
          Check
        </Button>
      )}

      {result?.outcome === 'CORRECT' && (
        <p className="text-success fw-semibold">Correct!</p>
      )}

      {result && result.outcome !== 'CORRECT' && (
        <>
          <p className={result.outcome === 'ALMOST' ? 'text-warning mb-2' : 'text-danger mb-2'}>
            {result.outcome === 'ALMOST' ? 'Almost — check the spelling:' : 'Wrong. Correct answer:'}
          </p>
          <div className="mb-3 p-3 bg-light rounded border">
            <strong>{correctAnswer}</strong>
          </div>
          {tipLines.length > 0 && (
            <div className="mb-3 p-3 bg-body-tertiary rounded border text-muted small fst-italic">
              {tipLines.map((line, i) => <p key={i} className="mb-0">{line}</p>)}
            </div>
          )}
          <Button variant="outline-secondary" onClick={() => onAnswer(result.outcome, result.errorType)}>
            Next
          </Button>
        </>
      )}
    </div>
  );
}
