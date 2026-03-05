import { useLessonStore } from '../../../stores/lessonStore';
import SCAnswerEditor from '../answers/SCAnswerEditor';
import MCAnswerEditor from '../answers/MCAnswerEditor';
import ImgSCAnswerEditor from '../answers/ImgSCAnswerEditor';
import ImgMCAnswerEditor from '../answers/ImgMCAnswerEditor';

function AnswersTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const cardType = editBuffer?.card_type;

  if (!editBuffer) return null;

  if (cardType === 'SC') return <SCAnswerEditor />;
  if (cardType === 'MC' || cardType === 'SYN') return <MCAnswerEditor />;
  if (cardType === 'IMG-SC') return <ImgSCAnswerEditor />;
  if (cardType === 'IMG-MC') return <ImgMCAnswerEditor />;
  if (cardType === 'GAP') return <div className="text-muted fst-italic">GAP editor coming soon</div>;

  return null;
}

export default AnswersTab;
