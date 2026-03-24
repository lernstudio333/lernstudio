import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import { parseFlags } from 'shared';

const FLAGS: { value: string; label: string; description: string }[] = [
  {
    value:       'NO_BACKWARD',
    label:       'No backward quizzing',
    description: 'Skip modes that swap question and answer (e.g. "what is the term for …?").',
  },
  {
    value:       'NO_TYPING',
    label:       'No typed answer',
    description: 'Skip typed-answer mode for this card.',
  },
];

function CardModesTab() {
  const editBuffer      = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  if (!editBuffer) return null;

  const activeFlags = new Set(parseFlags(editBuffer.flags ?? ''));

  function toggle(flag: string) {
    const next = new Set(activeFlags);
    next.has(flag) ? next.delete(flag) : next.add(flag);
    updateEditBuffer({ flags: [...next].join(',') });
  }

  return (
    <div>
      {FLAGS.map(f => (
        <Form.Check
          key={f.value}
          type="checkbox"
          id={`flag-${f.value}`}
          label={
            <span>
              <strong>{f.label}</strong>
              <span className="text-muted ms-2 small">{f.description}</span>
            </span>
          }
          checked={activeFlags.has(f.value)}
          onChange={() => toggle(f.value)}
          className="mb-3"
        />
      ))}
    </div>
  );
}

export default CardModesTab;
