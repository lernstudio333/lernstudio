import { Form } from 'react-bootstrap';
import { useLessonStore } from '../../../stores/lessonStore';
import type { CardModeType, CardMode } from '../../../types/admin.types';

const ALL_MODES: { value: CardModeType; label: string }[] = [
  { value: 'SHOW',             label: 'Show' },
  { value: 'MULTIPLECARDS',    label: 'Multiple Cards' },
  { value: 'MULTIPLEANSWERS',  label: 'Multiple Answers' },
  { value: 'SORTPARTS',        label: 'Sort Parts' },
  { value: 'SELFASSES',        label: 'Self Assess' },
  { value: 'TYPE',             label: 'Type Answer' },
  { value: 'ALIKES',           label: 'Alikes' },
  { value: 'MULTIPLECARDS_BW', label: 'Multiple Cards (BW)' },
  { value: 'SORTPARTS_BW',     label: 'Sort Parts (BW)' },
  { value: 'SELFASSES_BW',     label: 'Self Assess (BW)' },
  { value: 'TYPE_BW',          label: 'Type Answer (BW)' },
];

function CardModesTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const updateEditBuffer = useLessonStore(s => s.updateEditBuffer);

  if (!editBuffer) return null;

  const activeModes = new Set((editBuffer.modes ?? []).map(m => m.mode));

  function toggle(modeValue: CardModeType) {
    const currentModes = editBuffer?.modes ?? [];
    if (activeModes.has(modeValue)) {
      updateEditBuffer({ modes: currentModes.filter(m => m.mode !== modeValue) });
    } else {
      const newMode: Omit<CardMode, 'id'> = {
        card_id: editBuffer?.id ?? '',
        mode: modeValue,
        value: 1,
        min_score: 0,
      };
      updateEditBuffer({ modes: [...currentModes, newMode as CardMode] });
    }
  }

  return (
    <div>
      {ALL_MODES.map(m => (
        <Form.Check
          key={m.value}
          type="checkbox"
          id={`mode-${m.value}`}
          label={m.label}
          checked={activeModes.has(m.value)}
          onChange={() => toggle(m.value)}
          className="mb-2"
        />
      ))}
    </div>
  );
}

export default CardModesTab;
