import type { ReactNode } from 'react';
import type { BasicCard, MediaRef } from 'shared/enums';

interface Props {
  question:         BasicCard['question'];
  score:            number;
  isFavorite:       boolean;
  onFavoriteToggle: () => void;
  feedback:         'neutral' | 'correct' | 'wrong';
  progress:         { done: number; total: number };
  children:         ReactNode;
}

const BORDER: Record<string, string> = {
  neutral: 'border-secondary-subtle',
  correct: 'border-success',
  wrong:   'border-danger',
};

function isMediaRef(v: unknown): v is MediaRef {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'url' in v;
}

function renderQuestion(question: BasicCard['question']): ReactNode {
  if (isMediaRef(question)) {
    return <img src={question.url} alt="" className="img-fluid rounded mb-4" style={{ maxHeight: 260 }} />;
  }
  if (Array.isArray(question)) {
    if (question.length > 0 && isMediaRef(question[0])) {
      return (
        <div className="d-flex flex-wrap gap-2 mb-4">
          {(question as MediaRef[]).map((ref, i) => (
            <img key={i} src={ref.url} alt="" className="img-fluid rounded" style={{ maxHeight: 180 }} />
          ))}
        </div>
      );
    }
    return (
      <ul className="mb-4 ps-3 text-start fs-5">
        {(question as string[]).map((line, i) => <li key={i}>{line}</li>)}
      </ul>
    );
  }
  return <p className="card-text fs-5 mb-4">{question}</p>;
}

export default function QuizCard({
  question, score, isFavorite, onFavoriteToggle, feedback, progress, children,
}: Props) {
  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <div className={`card border-2 ${BORDER[feedback]}`} style={{ transition: 'border-color 0.2s' }}>

        {/* Header: progress · score · favorite */}
        <div className="card-header d-flex justify-content-between align-items-center bg-body-tertiary py-2 small">
          <span className="text-muted">
            {progress.done} / {progress.total}
          </span>
          <span className="text-muted">
            Score <strong>{score}</strong>
          </span>
          <button
            className="btn btn-link p-0 text-decoration-none fs-5 lh-1"
            onClick={onFavoriteToggle}
            title={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        </div>

        {/* Question */}
        <div className="card-body">
          {renderQuestion(question)}
          {children}
        </div>

      </div>
    </div>
  );
}
