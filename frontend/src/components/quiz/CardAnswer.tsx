import type { BasicCard, MediaRef } from 'shared/enums';

interface Props {
  answer:    BasicCard['answer'];
  feedback?: 'neutral' | 'correct' | 'wrong';
}

function isMediaRef(v: unknown): v is MediaRef {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && 'url' in v;
}

/**
 * Renders answer content: text (single-line or bullet list), single image, or image grid.
 * Feedback tinting applies only to text answers (SA / DA modes).
 */
export default function CardAnswer({ answer, feedback = 'neutral' }: Props) {
  // Single image
  if (isMediaRef(answer)) {
    return (
      <img src={answer.url} alt="" className="img-fluid rounded" style={{ maxHeight: 260 }} />
    );
  }

  // Array of images
  if (Array.isArray(answer) && answer.length > 0 && isMediaRef(answer[0])) {
    return (
      <div className="d-flex flex-wrap gap-2">
        {(answer as MediaRef[]).map((ref, i) => (
          <img key={i} src={ref.url} alt="" className="img-fluid rounded" style={{ maxHeight: 180 }} />
        ))}
      </div>
    );
  }

  const colorClass =
    feedback === 'correct' ? 'text-success fw-semibold' :
    feedback === 'wrong'   ? 'text-danger'               :
    '';

  // String array — single element as plain text, multiple as bullet list
  if (Array.isArray(answer)) {
    const strings = answer as string[];
    return (
      <div className={colorClass}>
        {strings.length === 1
          ? <span>{strings[0]}</span>
          : <ul className="mb-0 ps-3 text-start">
              {strings.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
        }
      </div>
    );
  }

  // Single string, possibly multiline
  const lines = (answer as string).split('\n').filter(Boolean);
  return (
    <div className={colorClass}>
      {lines.length <= 1
        ? <span>{answer as string}</span>
        : <ul className="mb-0 ps-3 text-start">
            {lines.map((line, i) => <li key={i}>{line}</li>)}
          </ul>
      }
    </div>
  );
}
