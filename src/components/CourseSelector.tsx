import React, { Component, useState, useEffect } from 'react';
import { Container, Dropdown, Button, ButtonGroup } from 'react-bootstrap';
import { AccordionEventKey } from 'react-bootstrap/esm/AccordionContext';
import { isAsteriskToken } from 'typescript';
//import useFetchDocs from '../hooks/useFetchDocs'



function CourseSelector(props: {
    audio: any,
    setActiveComp: Function,
    selectedCourse: string | null,
    filterFavourites: Boolean,
    setFilterFavourites: Function,
    learnMethod: LearnMethod,
    setLearnMethod: Function,
    setSelectedCourse: Function,
    token: string | null,
    courses: Doc[],
    setCourses: Function,
}) {

    const [isLoading, setIsLoading] = useState(false);
    const [err, setErr] = useState('');

    console.log('IN COURSESELECTOR')
    console.log(props.token)

    function handleClick(lm: LearnMethod, fav = false) {
        props.setFilterFavourites(fav)
        props.setLearnMethod(lm)
        props.setActiveComp('LearnSession')
    }

    useEffect(() => {
        console.log('IN USEEFFECT')
        console.log(props.token)
        if (props.token && (props.courses.length == 0)) {
            setIsLoading(false)
            console.log('IN USEEFFECT FETCHING')
            const data = {
                "dataType": "docs",
                "token": props.token
            }
            const appID = "AKfycbyj6IiQKsHOrTR_huR-v_VTOMAfhI9lpCOYxOuwTsm17TbpvNz7gSdopiY5U_U9N9XTwg"
            const url = "https://script.google.com/macros/s/" + appID + "/exec"

            const payload = {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                redirect: 'follow',
                body: JSON.stringify(data)
            }
            {/* 
            // @ts-ignore */}
            fetch(url, payload)
                .then((response) => response.json())
                .then(data => {
                    console.log(data)
                    props.setCourses(data)
                    setIsLoading(false)
                })
                .catch(error => {
                    setIsLoading(false)
                    console.log(error)
                    setErr(error.message);
                });
        }
    }, [props.token])

    console.log('CourseSelector')



    function courseName(cs: Doc | null | undefined): string {
        if (cs) {
            return cs.book + ' ' + cs.docTitle
        }
        return ''
    }
    function courseFromId(id: string): Doc | undefined {
        return props.courses.find(cs => (cs.shortDocId == id));
    }


    function handleCourseSelect(key: string | null) {
        props.setSelectedCourse(key)
    }
    function handleFavouritesSwitch(key: string | null) {
        props.setSelectedCourse(key)
    }


    return (<>
        <div className="container text-center">
            <Dropdown className="m-5" onSelect={handleCourseSelect}>
                <Dropdown.Toggle variant={isLoading ? 'secondary' : 'success'} id="dropdown-basic">
                    {isLoading ?
                        <>
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true">
                            </span>
                            &nbsp;&nbsp;Loading courses ...
                        </> :
                        <span>{props.selectedCourse ? courseName(courseFromId(props.selectedCourse))
                            : 'Choose Your Course'}</span>}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {props.courses.map(cs =>
                        <Dropdown.Item eventKey={cs.shortDocId} key={cs.shortDocId}>
                            {courseName(cs)}
                        </Dropdown.Item>)}
                </Dropdown.Menu>
            </Dropdown>

            <button className="btn btn-primary m-2" type="button"
                key={'new'}
                onClick={() => handleClick('learnNew')}>
                Neues Lernen
            </button>
            <button className="btn btn-primary m-2" type="button"
                key={'repeat'}
                onClick={() => handleClick('repeat')}>
                Wiederholen
            </button>
            <button className="btn btn-primary m-2" type="button"
                key={'repeatX'}
                onClick={() => handleClick('repeat', true)}>
                Wiederholen*
            </button>
        </div>
        {err && <h2>{err}</h2>}
    </>)
}
export default CourseSelector;