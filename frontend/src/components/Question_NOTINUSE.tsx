import React, { Component } from 'react';
import { Form, Button } from 'react-bootstrap';

import '../App.css';
import { useState } from "react";


function Question(props: { question: Question, answerOptions: Answer[], audio: any, carryOn: Function }) {
    const [idxButtonClicked, setIdxButtonClicked] = useState(-1);
    const [answerLevel, setAnswerLevel] = useState('WRONG');
    const level = difficultyLevel(props.question);
    const [isFavourite, setIsFavourite] = useState(props.question?.learning?.fav || false);


    function difficultyLevel(qu: Question) {
        let score = 0;
        if (qu && ('learning' in qu) && 'score' in (qu.learning ?? {})) {
            score = qu.learning?.score ?? 0
        }
        return Math.max(0, score - 1);   // score 0 and 1 => lv=0; score 2 => lv=1
    }


    function handleClick(idx: number) {
        async function goBack(answerLevel: AnswerLevel) {
            await delay(2000);
            props.carryOn(answerLevel, isFavourite)
        }

        // only accept first button click
        setIdxButtonClicked(oldIdx => { if (oldIdx < 0) { return idx }; return oldIdx });

        const isAC = isAnswerCorrect(idx);
        const answerLevel = isAC ? "CORRECT" : "WRONG"
        if (isAC) {
            props.audio.success.play()
        } else {
            props.audio.error.play()
        }
        setAnswerLevel(x => answerLevel)
        console.log('in Question')
        console.log(answerLevel)
        goBack(answerLevel);
    };

    function isAnswerCorrect(idxButtonClicked: number) {
        console.log(JSON.stringify(props.question))
        return (JSON.stringify(props.answerOptions[idxButtonClicked]) === JSON.stringify(props.question.answer))

    }


    function anonymizeString(str: string, level = 0) {
        // turns a string like "Klimatische Faktoren:Frühjahr, Herbst, Vollmond, Föhn"
        // into a semi randomized string like "K****ti***e F*****e*:Fr**ja**, H****t, Vo****nd, Fö*n"
        // randomizing each word separately
        // you can add a level, typically 0,1,2; 
        // level 0 returns original string
        // level 1 being the most easily readable variant.

        const nonalphanumeric = /[^a-zA-Z0-9ÂÀÅÃâàåãÄäÇçÉÊÈËéêèëÓÔÒÕØóôòõÖöŠšßÚÛÙúûùÜüÝŸýÿŽž]/
        const breakpoint = /([^a-zA-Z0-9ÂÀÅÃâàåãÄäÇçÉÊÈËéêèëÓÔÒÕØóôòõÖöŠšßÚÛÙúûùÜüÝŸýÿŽž])/

        function isBreakpoint(s: string) {
            return s.length == 1 && s.match(nonalphanumeric)
        }

        function anonymizeWord(s: string, level = 1) {
            let res = ''
            let nextSwitch = 0;
            let maskChar = true;
            for (var i = 0; i < s.length; i++) {
                if (i == nextSwitch) {
                    maskChar = !maskChar;
                    const extraChars = maskChar ? Math.floor(Math.random() * (2 + (level - 1) * 3)) : Math.floor(Math.random() * (level == 1 ? 3 : 2))
                    nextSwitch = i + 2 + extraChars
                }
                res += maskChar ? '∗' : s[i];
            }
            return res;
        }

        if (level == 0) { return str }

        return str.split(breakpoint)
            .map(el => (isBreakpoint(el) ? el : anonymizeWord(el, level)))
            .join('')
    }


    function btnColCls(idxButtonClicked: number, idx: number) {
        if (idxButtonClicked >= 0) {  // answer clicked
            if (answerLevel == "CORRECT") {
                if (idxButtonClicked == idx && isAnswerCorrect(idx)) {
                    return "btn-success";
                }
            } else {  // answered incorrectly
                if (isAnswerCorrect(idx)) {
                    return "btn-success";
                }
                if (idxButtonClicked == idx && !isAnswerCorrect(idx)) {
                    return "btn-danger";
                }
            }
        }
        return "btn-outline-primary";
    }

    function buttonText(answer: Answer) {
        if (answer) {
            const answerDisplay = (level == 0 || idxButtonClicked >= 0) ? // level=0 or answered
                answer :
                answer.map(a => anonymizeString(a, level));

            if (answer.length == 1) {
                return answerDisplay[0]
            }
            if (answer.length > 1) {
                return <ul>{answerDisplay.map(el =>
                    <li>{el}</li>
                )}</ul>
            }
        }
        return ""
    }

    function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function onIsFavouritChange(e: React.ChangeEvent<HTMLInputElement>) {
        console.log(e.target.checked);
        setIsFavourite(e.target.checked);
    };


    return <>
        <Form className="d-flex justify-content-end me-lg-5 me-2">
            <span className="score l-auto p-1 me-2">{(props.question.learning?.score || 0) + '❀'}</span>
            <Form.Check
                type="switch"
                id="fav-switch-qu"
                label="Favorit"
                onChange={onIsFavouritChange}
            />
        </Form>
        <p>{props.question?.options?.type=="SYN"? "Nenne ein Synonym für" : 
            props.question?.options?.type=="GAP"? "Vervollständige" :
            "Was bedeutet"}</p>
        <h2>
            {props.question ? props.question.question : ""}
            {props.question.options.type == "SYN" ? <span className="tag">Synonym</span> : <></>}
        </h2>
        <p></p>
        <div className="container">
            <div className="row row-cols-1 row-cols-md-2">
                {props.answerOptions.map((a, idx) =>
                    <div className="col d-grid gap-2" key={idx} >
                        <button className={"btn m-2 " + btnColCls(idxButtonClicked, idx)}
                            type="button"
                            key={'bt' + idx}
                            onClick={() => handleClick(idx)}
                        >
                            {buttonText(a)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    </>
}
export default Question;