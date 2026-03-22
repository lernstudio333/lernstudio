import { useState } from 'react';
import { Button } from 'react-bootstrap';
import type { BasicCard } from 'shared/enums';
import type { AnswerOutcome } from './sessionTypes';

interface Props {
  displayCard: BasicCard;   // answer is always string[] with ≥2 parts (ensured by allowArrangeOrder filter)
  audio:       any;
  onAnswer:    (outcome: AnswerOutcome, errorType: string | null) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tag styles
const tagBase: React.CSSProperties = {
  display:       'inline-block',
  padding:       '6px 14px',
  borderRadius:  '999px',
  fontSize:      '1rem',
  userSelect:    'none',
  cursor:        'pointer',
  lineHeight:    1.4,
};

export default function QuizModeArrangeOrder({ displayCard, audio, onAnswer }: Props) {
  const correctParts = displayCard.answer as string[];
  const tipLines     = displayCard.tip?.split('\n').filter(Boolean) ?? [];

  // Shuffle on mount only (via useState initialiser)
  const [available, setAvailable] = useState(() => shuffleArray(correctParts));
  const [arranged,  setArranged]  = useState<string[]>([]);
  const [checked,   setChecked]   = useState(false);
  const [outcome,   setOutcome]   = useState<AnswerOutcome | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);

  function pickPart(idx: number) {
    if (checked) return;
    const part = available[idx];
    setAvailable(prev => prev.filter((_, i) => i !== idx));
    setArranged(prev => [...prev, part]);
  }

  function returnPart(idx: number) {
    if (checked) return;
    const part = arranged[idx];
    setArranged(prev => prev.filter((_, i) => i !== idx));
    setAvailable(prev => [...prev, part]);
  }

  function handleCheck() {
    const mismatches = arranged.filter((p, i) => p !== correctParts[i]).length;
    let result:    AnswerOutcome;
    let errType:   string | null;

    if (mismatches === 0) {
      result  = 'CORRECT';
      errType = null;
      try { audio?.success?.play(); } catch { /* ignore */ }
    } else if (mismatches <= 2) {
      result  = 'ALMOST';
      errType = 'ARRANGE_ORDER_ALMOST';
    } else {
      result  = 'WRONG';
      errType = 'ARRANGE_ORDER_WRONG';
      try { audio?.error?.play(); } catch { /* ignore */ }
    }

    setOutcome(result);
    setErrorType(errType);
    setChecked(true);

    if (result === 'CORRECT') {
      setTimeout(() => onAnswer(result, errType), 1200);
    }
  }

  function arrangedTagStyle(part: string, idx: number): React.CSSProperties {
    if (!checked) return { ...tagBase, background: '#0d6efd', color: '#fff' };
    return part === correctParts[idx]
      ? { ...tagBase, background: '#198754', color: '#fff', cursor: 'default' }
      : { ...tagBase, background: '#dc3545', color: '#fff', cursor: 'default' };
  }

  return (
    <div>
      {/* ── Arranged area ── */}
      <div
        className="border rounded p-3 mb-3 d-flex flex-wrap gap-2"
        style={{ minHeight: 56, background: '#f8f9fa' }}
      >
        {arranged.length === 0 ? (
          <span className="text-muted small fst-italic align-self-center">
            Tap parts below to arrange them…
          </span>
        ) : (
          arranged.map((part, i) => (
            <span key={i} style={arrangedTagStyle(part, i)} onClick={() => returnPart(i)}>
              {part}
            </span>
          ))
        )}
      </div>

      {/* ── Available pool ── */}
      {!checked && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {available.map((part, i) => (
            <span
              key={i}
              style={{ ...tagBase, border: '1px solid #adb5bd', color: '#495057', background: '#fff' }}
              onClick={() => pickPart(i)}
            >
              {part}
            </span>
          ))}
        </div>
      )}

      {/* ── Actions ── */}
      {!checked && (
        <Button variant="primary" onClick={handleCheck} disabled={available.length > 0}>
          Check
        </Button>
      )}

      {checked && outcome === 'CORRECT' && (
        <p className="text-success fw-semibold mt-2">Correct!</p>
      )}

      {checked && outcome !== 'CORRECT' && (
        <>
          <p className={outcome === 'ALMOST' ? 'text-warning mb-2' : 'text-danger mb-2'}>
            {outcome === 'ALMOST' ? 'Almost! Correct order:' : 'Wrong. Correct order:'}
          </p>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {correctParts.map((part, i) => (
              <span key={i} style={{ ...tagBase, background: '#198754', color: '#fff', cursor: 'default' }}>
                {part}
              </span>
            ))}
          </div>
          {tipLines.length > 0 && (
            <div className="mb-3 p-3 bg-body-tertiary rounded border text-muted small fst-italic">
              {tipLines.map((line, i) => <p key={i} className="mb-0">{line}</p>)}
            </div>
          )}
          <Button variant="outline-secondary" onClick={() => onAnswer(outcome!, errorType)}>
            Next
          </Button>
        </>
      )}
    </div>
  );
}
