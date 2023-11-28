import React, { Component } from 'react';
import Table from 'react-bootstrap/Table';
import '../App.css';
import Question from './Question'
import QuestionAuto from './QuestionAuto'
//import useFetchSessionData from '../hooks/useFetchSessionData'
import { useState, useEffect } from "react";
import { randomSample } from "../hooks/util"
import config from "../shared/config"



function CardList(props: any) {


    const [session, setSession] = useState<Session>();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [rounds, setRounds] = useState(1);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [sendingHome, setSendingHome] = useState(false);


    useEffect(() => {
        console.log("in CardList")
        console.log(props.selectedCourse)
        console.log(props.learnMethod)
        console.log(props.filterFavourites)
        const data = {
            "dataType": "nextCards",
            "token": props.token,
            "cardSelector": props.selectedCourse,
            "method": 'list', // 
            "favouritesOnly": props.filterFavourites
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
                console.log(data);
                setSession(data);
                setQuestions(data.questions);
            })

    }, [])

    function howLongAgo (datestring:string) : string {
        if (datestring == ""){
            return "-"
        }
        const learnDate = new Date(datestring);
        const now = new Date();
        const diffMin = Math.round((now.valueOf() - learnDate.valueOf()) / (1000 * 60 ))

        if (diffMin <= 60) {return  diffMin + "m"}
        if (diffMin <= 60*24) {return  Math.round(diffMin/60) + "h"}
        return  Math.round(diffMin/60/24) + "d"
    }

    function clickedClose() {
        props.setActiveComp("CourseSelector")
    }


    return <>
        <div className="d-flex justify-content-end m-1 mt-2">
            <button type="button" className="btn-close" aria-label="Close" onClick={clickedClose}></button>
        </div>
        <>
        {session ?
            questions.length > 0 ?
                <Table striped borderless hover responsive size="sm">
                    <thead>
                        <tr>
                            <th>Frage</th>
                            <th>Score</th>
                            <th>Fehler</th>
                            <th>Wann</th>
                            <th>Fav</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map(q =>
                            <tr>
                                <td style={{textAlign:"left", paddingLeft:"1em"}}>{q.question}</td>
                                <td>{q.learning?.score || '-'}</td>
                                <td>{q.learning?.errs || '-'}</td>
                                <td>{howLongAgo(q.learning?.lastEdited || null)}</td>
                                <td>{(q.learning?.fav || false)? '⭐️': ''}</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                :
                <h2>Nothing to learn!</h2>
            : <p><span className="spinner-border-sm" role="status" aria-hidden="true"></span>
                &nbsp;&nbsp;Loading ...</p>
        }
        </>
    </>
}
export default CardList;