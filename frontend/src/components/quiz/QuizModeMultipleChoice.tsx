import { useState } from 'react';
import type { BasicCard } from 'shared/enums';
import CardAnswer from './CardAnswer';

interface Props {
  options:       BasicCard['answer'][];
  correctAnswer: BasicCard['answer'];
  audio:         any;
  onAnswer:      (correct: boolean) => void;
}

const DONT_KNOW = '__dont_know__';

function answersEqual(a: BasicCard['answer'], b: BasicCard['answer']): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function QuizModeMultipleChoice({ options, correctAnswer, audio, onAnswer }: Props) {
  const [selected, setSelected] = useState<BasicCard['answer'] | typeof DONT_KNOW | null>(null);

  function handleSelect(opt: BasicCard['answer']) {
    if (selected !== null) return;
    setSelected(opt);

    const correct = answersEqual(opt, correctAnswer);
    try { correct ? audio?.success?.play() : audio?.error?.play(); } catch { /* ignore */ }

    setTimeout(() => onAnswer(correct), 1200);
  }

  function handleDontKnow() {
    if (selected !== null) return;
    setSelected(DONT_KNOW);
    try { audio?.error?.play(); } catch { /* ignore */ }
    setTimeout(() => onAnswer(false), 1200);
  }

  function variantFor(opt: BasicCard['answer']): string {
    if (selected === null)                    return 'outline-secondary';
    if (answersEqual(opt, correctAnswer))     return 'success';
    if (selected !== DONT_KNOW && answersEqual(opt, selected as BasicCard['answer'])) return 'danger';
    return 'outline-secondary';
  }

  const disabled = selected !== null;

  return (
    <div>
      {/* 2×2 grid on desktop, single column on mobile */}
      <div className="row row-cols-1 row-cols-md-2 g-2">
        {options.map((opt, i) => (
          <div className="col" key={i}>
            <div
              role="button"
              tabIndex={disabled ? -1 : 0}
              className={`btn btn-${variantFor(opt)} text-start w-100 h-100 py-2 px-3`}
              style={{ cursor: disabled ? 'default' : 'pointer' }}
              onClick={() => handleSelect(opt)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(opt)}
            >
              <CardAnswer answer={opt} />
            </div>
          </div>
        ))}
      </div>

      {/* "I don't know" — reveals correct answer, counts as wrong */}
      <div className="mt-3 text-center">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={handleDontKnow}
          disabled={disabled}
        >
          I don't know
        </button>
      </div>
    </div>
  );
}
