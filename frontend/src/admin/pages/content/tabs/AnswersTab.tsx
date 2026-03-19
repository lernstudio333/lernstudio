import { CardTypes } from 'shared';
import { useLessonStore } from '../../../stores/lessonStore';
import SCAnswerEditor from '../answers/SCAnswerEditor';
import MCAnswerEditor from '../answers/MCAnswerEditor';
import ImgMCAnswerEditor from '../answers/ImgMCAnswerEditor';

const CT = CardTypes;

function AnswersTab() {
  const editBuffer = useLessonStore(s => s.editBuffer);
  const cardType = editBuffer?.card_type;

  if (!editBuffer) return null;

  if (cardType === CT.SINGLE_CARD.key) return <SCAnswerEditor />;
  if (cardType === CT.MULTI_CARD.key || cardType === CT.SYNONYM.key) return <MCAnswerEditor />;
  if (cardType === CT.IMAGES.key) return <ImgMCAnswerEditor />;
  if (cardType === CT.GAP.key) return <div className="text-muted fst-italic">GAP editor coming soon</div>;

  return null;
}

export default AnswersTab;
