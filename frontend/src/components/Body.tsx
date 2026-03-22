import { useState } from 'react';
import LandingPage from './LandingPage';
import QuizSession from './quiz/QuizSession';
import ListSession from './quiz/ListSession';
import { useAuth } from '../contexts/AuthContext';
import type { StudyAction } from 'shared/features/programs';
import type { ProgramWithCourses } from 'shared/features/programs';
import '../App.css';

type ActiveView = 'landing' | 'quiz' | 'list';

interface Props {
  audio:         any;
  counter:       number;
  setCounter:    (updater: (c: number) => number) => void;
  setRewardIcon: (icon: string | null) => void;
}

function Body({ audio, counter, setCounter, setRewardIcon }: Props) {
  const { token } = useAuth();   // keep for legacy components if still needed
  void token;

  const [activeView, setActiveView]         = useState<ActiveView>('landing');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [studyAction, setStudyAction]       = useState<StudyAction>('NEW');
  // Remember the active program so we return to the accordion after a session
  const [activeProgram, setActiveProgram]   = useState<ProgramWithCourses | null>(null);

  function handleLessonAction(
    lessonId: string,
    action: StudyAction,
    program: ProgramWithCourses,
  ) {
    setSelectedLessonId(lessonId);
    setStudyAction(action);
    setActiveProgram(program);
    setActiveView(action === 'LIST' ? 'list' : 'quiz');
  }

  function handleSessionClose() {
    setActiveView('landing');
  }

  return (
    <>
      {activeView === 'landing' && (
        <LandingPage
          onLessonAction={handleLessonAction}
          initialProgram={activeProgram}
          initialLessonId={selectedLessonId}
        />
      )}

      {activeView === 'quiz' && selectedLessonId && (
        <QuizSession
          lessonId={selectedLessonId}
          studyAction={studyAction}
          audio={audio}
          counter={counter}
          onClose={handleSessionClose}
          onScoreDelta={(delta) => setCounter(c => c + delta)}
          onReward={(icon) => { setRewardIcon(icon); }}
        />
      )}

      {activeView === 'list' && selectedLessonId && (
        <ListSession
          lessonId={selectedLessonId}
          onClose={handleSessionClose}
        />
      )}
    </>
  );
}

export default Body;
