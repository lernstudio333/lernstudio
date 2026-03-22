import { Button } from 'react-bootstrap';
import type { BasicCard } from 'shared/enums';
import CardAnswer from './CardAnswer';

interface Props {
  displayCard: BasicCard;
  onNext:      () => void;
}

/** Shows the answer immediately. User clicks "Got it" to proceed. */
export default function QuizModeDisplayAnswer({ displayCard, onNext }: Props) {
  const tipLines = displayCard.tip?.split('\n').filter(Boolean) ?? [];

  return (
    <div>
      {/* Answer card */}
      <div className="mb-3 p-3 bg-light rounded border w-100">
        <CardAnswer answer={displayCard.answer} />
      </div>

      {/* Tip card — separate, lighter tertiary style */}
      {tipLines.length > 0 && (
        <div className="mb-3 p-3 bg-body-tertiary rounded border w-100 text-muted small fst-italic">
          {tipLines.map((line, i) => <p key={i} className="mb-0">{line}</p>)}
        </div>
      )}

      <Button variant="primary" onClick={onNext}>Got it</Button>
    </div>
  );
}
