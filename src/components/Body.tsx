import React, { Component, Dispatch, SetStateAction } from 'react';
import { useState } from "react";
import CourseSelector from './CourseSelector'
import LearnSession from './LearnSession'
import '../App.css';



function Body(props: {audio:any, setCounter:Function}) {
    const [activeComp, setActiveComp] = useState<MainState>('CourseSelector');
    const [filterFavourites, setFilterFavourites] = useState<Boolean>(false);
    const [learnMethod, setLearnMethod] = useState<LearnMethod>('repeat');
    const [selectedCourse, setSelectedCourse] = useState<string|null>(null);



    // type Cmp = { [key in string]:any }

    //const components : Cmp = {
    //    LearnSession: LearnSession,
    //    CourseSelector: CourseSelector
    //};
    //const SpecificStory = components[activeComp] ;

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
            />
        : ""}
    </>
}

export default Body;