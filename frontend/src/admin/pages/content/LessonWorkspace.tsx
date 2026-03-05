import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useLessonStore } from '../../stores/lessonStore';
import WorkspaceBreadcrumb from '../../components/WorkspaceBreadcrumb';
import CardListPanel from './CardListPanel';
import CardEditorPanel from './CardEditorPanel';

function LessonWorkspace() {
  const { lessonId, cardId } = useParams<{ lessonId: string; cardId: string }>();
  const loadLesson = useLessonStore(s => s.loadLesson);
  const storedLessonId = useLessonStore(s => s.lessonId);

  useEffect(() => {
    if (lessonId && lessonId !== storedLessonId) {
      loadLesson(lessonId);
    }
  }, [lessonId]);

  if (!lessonId) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <WorkspaceBreadcrumb lessonId={lessonId} />
      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0 }}>
        <div style={{ width: cardId ? '40%' : '100%', overflowY: 'auto' }}>
          <CardListPanel lessonId={lessonId} cardId={cardId} />
        </div>
        {cardId && (
          <div style={{ width: '60%', overflowY: 'auto' }}>
            <CardEditorPanel lessonId={lessonId} cardId={cardId} />
          </div>
        )}
      </div>
    </div>
  );
}

export default LessonWorkspace;
