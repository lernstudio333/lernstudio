import { useState } from "react";
import LandingPage from './LandingPage';
import LearnSession from './LearnSession';
import CardList from './CardList';
import { useAuth } from '../contexts/AuthContext';
import type { StudyAction } from 'shared/features/programs';
import '../App.css';

function Body(props: { audio: any, setCounter: Function }) {
    const { token } = useAuth();
    const [activeComp, setActiveComp]           = useState<MainState>('CourseSelector');
    const [filterFavourites, setFilterFavourites] = useState<Boolean>(false);
    const [learnMethod, setLearnMethod]          = useState<LearnMethod>('repeat');
    const [selectedCourse, setSelectedCourse]    = useState<string | null>(null);

    // New lesson-based navigation — used by Step 17's quiz engine
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [studyAction, setStudyAction]           = useState<StudyAction>('REPEAT');

    function handleLessonAction(lessonId: string, action: StudyAction) {
        setSelectedLessonId(lessonId);
        setStudyAction(action);
        // TODO Step 17: setActiveComp('LearnSession') once new quiz engine is wired up
        console.log('[Step 17 TODO] lesson action:', action, 'lessonId:', lessonId);
    }

    return <>
        {activeComp === "CourseSelector" &&
            <LandingPage onLessonAction={handleLessonAction} />
        }
        {activeComp === "LearnSession" &&
            <LearnSession
                audio={props.audio}
                setActiveComp={setActiveComp}
                selectedCourse={selectedCourse}
                filterFavourites={filterFavourites}
                learnMethod={learnMethod}
                setCounter={props.setCounter}
                token={token}
            />
        }
        {activeComp === "List" &&
            <CardList
                setActiveComp={setActiveComp}
                selectedCourse={selectedCourse}
                filterFavourites={filterFavourites}
                token={token}
            />
        }
    </>;
}

export default Body;
