import React, { Component, useState, useEffect} from 'react';
import { Container, Dropdown, Button, ButtonGroup } from 'react-bootstrap';
import { AccordionEventKey } from 'react-bootstrap/esm/AccordionContext';
//import useFetchDocs from '../hooks/useFetchDocs'



function CourseSelector(props: any) {

    //const courses = useFetchDocs();
    const [courses, setCourses] = useState<Doc[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [err, setErr] = useState('');


    function handleClick(lm: LearnMethod, fav = false) {
        props.setFilterFavourites(fav)
        props.setLearnMethod(lm)
        props.setActiveComp('LearnSession')
    }

    useEffect(() =>{
        const data = {
            "dataType": "docs",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o"
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
                setCourses(data)
                setIsLoading(false)
            })

    }, [])


    // const handleClick1 = async (what: string) => {
    //     setIsLoading(true);

    //     const docs = {
    //         "dataType": "docs",
    //         "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o",
    //     }
    //     const appID = "AKfycbyj6IiQKsHOrTR_huR-v_VTOMAfhI9lpCOYxOuwTsm17TbpvNz7gSdopiY5U_U9N9XTwg"
    //     const url = "https://script.google.com/macros/s/" + appID + "/exec"

    //     const payload = {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'text/plain;charset=utf-8',
    //         },
    //         redirect: 'follow',
    //         body: JSON.stringify(data)
    //     }

    //     try {
    //         {/* 
    //         // @ts-ignore */}
    //         const response = await fetch(url, payload);

    //         if (!response.ok) {
    //             throw new Error(`Error! status: ${response.status}`);
    //         }

    //         const result = await response.json();

    //         console.log('result is: ', JSON.stringify(result, null, 4));

    //         setData(result);
    //     } catch (err: any) {
    //         setErr(err.message);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    console.log('CourseSelector')
    console.log(props)
    console.log(typeof props.nextStep)

  

    function courseName (cs:Doc|null|undefined):string{
        if(cs){
            return cs.book + ' ' + cs.docTitle
        }
        return ''
    } 
    function courseFromId (id: string):Doc|undefined{
        return courses.find(cs => (cs.shortDocId == id));
    }


    function handleCourseSelect(key:string|null){
        props.setSelectedCourse(key)
    }
    function handleFavouritesSwitch(key:string|null){
        props.setSelectedCourse(key)
    }


    return (<>
        <div className="container text-center">
            <Dropdown className="m-5" onSelect={handleCourseSelect}>
                <Dropdown.Toggle variant={isLoading? 'secondary' : 'success'} id="dropdown-basic">
                    {isLoading ? 
                    <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;&nbsp;Loading courses ...</>: 
                    <span>{props.selectedCourse ?  courseName(courseFromId(props.selectedCourse))
                                                : 'Choose Your Course'}</span> }
                </Dropdown.Toggle>
                <Dropdown.Menu>
                    {courses.map((cs,idx) =>
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
                key={'repeat'}
                onClick={() => handleClick('repeat',true)}>
                Wiederholen*
            </button>
        </div>
        {err && <h2>{err}</h2>}
    </>)
}
export default CourseSelector;