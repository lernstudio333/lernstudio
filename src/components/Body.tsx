import React, { Component, Dispatch, SetStateAction } from 'react';
import { useState } from "react";
import CourseSelector from './CourseSelector'
import LearnSession from './LearnSession'
import '../App.css';



function Body(props: {audio:any, setCounter:Function, token:string|null}) {
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
            token={props.token}
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
            token={props.token}
            />
        : ""}
    </>
}

export default Body;