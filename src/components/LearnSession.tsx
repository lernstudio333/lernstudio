import React, { Component } from 'react';
import '../App.css';
import Question from './Question'
import QuestionAuto from './QuestionAuto'
//import useFetchSessionData from '../hooks/useFetchSessionData'
import { useState, useEffect } from "react";
import { randomSample } from "../hooks/util"
import config from "../shared/config"



function LearnSession(props: any) {


    const [session, setSession] = useState<Session>();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [rounds, setRounds] = useState(1);
    const [sessionFinished, setSessionFinished] = useState(false);
    const [sendingHome, setSendingHome] = useState(false);


    useEffect(() => {
        if (sessionFinished) {
            props.audio.successFanfare.play();
            sendHome(questions)
        }
    }, [sessionFinished]) //

    useEffect(() => {
        console.log("in useEffect")
        console.log(props.selectedCourse)
        console.log(props.learnMethod)
        console.log(props.filterFavourites)
        const data = {
            "dataType": "nextCards",
            "token": props.token,
            "cardSelector": props.selectedCourse,
            "method": props.learnMethod,
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







    function updateQuestion(qu: Question, answerLevel: AnswerLevel, isFavourite:boolean): Question {
        console.log("in update qu")
        console.log(qu)

        const oldScore = 'learning' in qu && qu.learning && qu.learning.score ? qu.learning.score : 0;
        const oldErrorScore = 'learning' in qu && qu.learning && qu.learning.errs ? qu.learning.errs : 0;
        let newScore = oldScore;
        let newErrorScore = oldErrorScore;
        if (answerLevel == "WRONG") { newScore -= 1 }
        if (answerLevel == "CORRECT") { newScore += 1; newErrorScore +=1 }
        newScore = Math.max(0, newScore)
        let learning = { 
            score: newScore, 
            errs: newErrorScore, 
            lastEdited: (new Date()).toString(),
            fav: isFavourite
        }
        

        const answeredInThisSession = (qu.answeredInThisSession || 0) + 1;

        let doneInThisSession = (qu.doneInThisSession || false)
        if (newScore >= 2 && answerLevel == "CORRECT") { doneInThisSession = true }
        if (answeredInThisSession >= 5) { doneInThisSession = true }
    
        return {
            ...qu,
            answeredInThisSession: answeredInThisSession,
            doneInThisSession: doneInThisSession,
            learning: learning
        }
    }


    type Where = "NEAR" | "MIDDLE" | "END"

    function moveWhere(qu: Question, answerLevel: AnswerLevel): Where {
        const score = 'learning' in qu && qu.learning ? qu.learning.score : 0;
        if (answerLevel != "CORRECT") { return "NEAR" }
        if (answerLevel == "CORRECT" && score <= 2) { return "NEAR" }
        if (answerLevel == "CORRECT" && score > 4) { return "END" }
        return "MIDDLE"
    }

    function moveQuestion(where: Where, questions: Question[], currentQuestion: Question) {

        if (where == "END" || currentQuestion.doneInThisSession){
            return [...questions.slice(1), currentQuestion]
        }
        //const randomDistance = 4
        const randomDistance = (where == "NEAR" ?
            1 + getRandomInt(2) :
            3 + getRandomInt(3))            // MIDDLE

        // insertionPoint is ideally randomDistance, but must be before first 'done' question
        let insertionPoint = 1
        while (insertionPoint < randomDistance &&
            insertionPoint < questions.length) {
            if (questions[insertionPoint + 1] &&
                questions[insertionPoint + 1].doneInThisSession) {
                break
            }
            insertionPoint++;
        }
        console.log("insert at " + insertionPoint)
        return [
            ...questions.slice(1, insertionPoint),
            currentQuestion,
            ...questions.slice(insertionPoint),
        ]
    }

    // return random integer <= max
    // e.g. getRandomInt(4) returns a random number from (1,2,3,4)
    function getRandomInt(max: number) {
        return Math.floor(Math.random() * (max)) + 1;
    }

    function updateQuestions(questions: Question[], answerLevel: AnswerLevel, isFavourite:boolean) {
        const updatedQuestion = updateQuestion(questions[0], answerLevel, isFavourite)
        const where = moveWhere(updatedQuestion, answerLevel)
        return moveQuestion(where, questions, updatedQuestion)
    }


    function nextRound(answerLevel: AnswerLevel, isFavourite: boolean) {
        if (questions) {
            console.log("in next Round")
            console.log(questions)
            if(answerLevel == "CORRECT"){
                props.setCounter((ct: number) => ct +=5)
            }
            if(answerLevel == "ALMOST"){
                props.setCounter((ct: number) => ct +=1)
            }
            setQuestions(qs => updateQuestions(qs, answerLevel, isFavourite))
            setRounds(r => r += 1);

            console.log('Q0Q1')
            console.log(questions)
            console.log(questions[0])
            console.log(questions[1])
            
            if (rounds > config().MAXROUNDS || questions[1].doneInThisSession) {
                setSessionFinished(true)
                console.log(questions)
            }
        }
    }

    function sendHome(qus: Question[]) {

        const learnedQuestions = qus.filter(qu => ('answeredInThisSession' in qu))
            .map(qu => ({ cardId: qu.cardId, learning: qu.learning }))
        console.log('learnedQuestions')
        console.log(learnedQuestions)
        const data = {
            "dataType": "learnings",
            "token": "adfjkl6h3489pdfghsrrlzh58eotzhwels8ps5o",
            "learnings": learnedQuestions
        }
        console.log("X!X")
        console.log(data)
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
        setSendingHome(sh => true)
        {/* 
        // @ts-ignore */}
        fetch(url, payload)
            .then((response) => {
                setSendingHome(sh => false)
                console.log(response)
                if (response.status == 200) {
                    console.log("Sending data home was successful")
                } else {
                    console.error("Error sending data home!")
                }
            })


    }

    function randomAnswers(answers: Answer[], corAnswer: Answer) {
        // randomAnswers(session.answers, questions[0].answer)}
        console.log("step1")
        console.log(corAnswer)
        const maxAnswers = Math.min(answers.length, 4)
        let selectionAnswers = randomSample(answers, maxAnswers-1)
        selectionAnswers.splice(getRandomInt(maxAnswers), 0, corAnswer);  //insert correct answer at random position
        console.log(selectionAnswers)
        return selectionAnswers
    }

    function clickedClose() {
        props.setActiveComp("CourseSelector")
    }


    function clickedNext() {
        props.setActiveComp("CourseSelector")
    }

    function questionType(qu: Question): string {
        let score = 0;
        if (qu && ('learning' in qu) && 'score' in (qu.learning ?? {})) {
            score = qu.learning?.score ?? 0
        }
        console.log(score)
        if (score > 3) {
            console.log('auto')
            return 'AutoJudge'
        }
        console.log('AnswerOptions')
        return 'AnswerOptions'
    }

    return <>
        <div style={{textAlign: 'right', margin: '0.7em'}}>
            <button type="button" className="btn-close" aria-label="Close" onClick={clickedNext}></button>
        </div>
        {!sessionFinished ?
            session ? 
                questions.length > 0 ? 
                    questionType(questions[0]) == "AnswerOptions" ?
                        <> 
                            <Question
                                question={questions[0]}
                                answerOptions={questions[0] ? randomAnswers(session.answers, questions[0].answer) : []}
                                key={'answeroptions' + rounds}
                                audio={props.audio}
                                carryOn={nextRound} />
                        </>
                        :
                        <>
                            <QuestionAuto
                                question={questions[0]}
                                key={'auto' + rounds}
                                audio={props.audio}
                                carryOn={nextRound} />
                        </>
                    : <h2>Nothing to learn!</h2>
                : <p><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    &nbsp;&nbsp;Loading ...</p>
            :
            <div>
                <p></p>
                <h2>Session erfolgreich abgeschlossen</h2>
                <p></p>
                <p><img src={process.env.PUBLIC_URL + "/youdidit.gif"} /></p>
                {sendingHome ? <h2>Sending data home </h2> :
                    <button className="btn m-2 btn-outline-primary"
                        key="next123"
                        onClick={clickedNext}>Weiter</button>
                }
            </div>
        }
    </>
}
export default LearnSession;