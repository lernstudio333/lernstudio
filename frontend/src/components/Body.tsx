import { useState } from "react";
import CourseSelector from './CourseSelector'
import LearnSession from './LearnSession'
import CardList from './CardList'
import { useAuth } from '../contexts/AuthContext';

import '../App.css';

function Body(props: {audio:any, setCounter:Function}) {
    const { token } = useAuth();
    const [activeComp, setActiveComp] = useState<MainState>('CourseSelector');
    const [filterFavourites, setFilterFavourites] = useState<Boolean>(false);
    const [learnMethod, setLearnMethod] = useState<LearnMethod>('repeat');
    const [selectedCourse, setSelectedCourse] = useState<string|null>(null);
    const [courses, setCourses] = useState<Doc[]>([]);

    return <>
        {activeComp == "CourseSelector" ?
            <CourseSelector
            audio = {props.audio}
            setActiveComp={setActiveComp}
            selectedCourse={selectedCourse}
            filterFavourites={filterFavourites}
            setFilterFavourites={setFilterFavourites}
            learnMethod={learnMethod}
            setLearnMethod={setLearnMethod}
            setSelectedCourse={setSelectedCourse}
            token={token}
            courses={courses}
            setCourses={setCourses}
           />
        : ""}
        {activeComp == "LearnSession" ?
            <LearnSession
            audio = {props.audio}
            setActiveComp={setActiveComp}
            selectedCourse={selectedCourse}
            filterFavourites={filterFavourites}
            learnMethod={learnMethod}
            setCounter={props.setCounter}
            token={token}
            />
        : ""}
        {activeComp == "List" ?
            <CardList
            setActiveComp={setActiveComp}
            selectedCourse={selectedCourse}
            filterFavourites={filterFavourites}
            token={token}
            />
        : ""}
    </>
}

export default Body;
