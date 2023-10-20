import React, { Component } from 'react';
import { Form } from 'react-bootstrap';
import '../App.css';
import { useState } from "react";


function QuestionAuto(props: { question: Question, audio: any, carryOn: Function }) {
    const [idxButtonClicked, setIdxButtonClicked] = useState(-1);
    const [answerLevel, setAnswerLevel] = useState('WRONG');
    const [buttonsDisabled, SetButtonsDisabled] = useState(false);
    const [hideAnswer, setHideAnswer] = useState(true)
    const [isFavourite, setIsFavourite] = useState(props.question?.learning?.fav || false);


    function buttonText(answer: Answer) {
        if (answer) {
            if (answer.length == 1) {
                return answer[0]
            }
            if (answer.length > 1) {
                return <ul>{answer.map(el =>
                    <li>{el}</li>
                )}</ul>
            }
        }
        return ""
    }

    function delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const answerButtons = [
        {
            label: "Nicht gewusst",
            handle: () => props.carryOn("WRONG", isFavourite),
            key: "bt_wrong",
            color: "btn-outline-danger"
        },
        {
            label: "Fast ;-)",
            handle: () => props.carryOn("ALMOST", isFavourite),
            key: "bt_almost",
            color: "btn-outline-primary"
        },
        {
            label: "Easy!",
            handle: () => {props.audio.success.play();props.carryOn("CORRECT", isFavourite)},
            key: "bt_correct",
            color: "btn-outline-success"
        }
    ]


    function onIsFavouritChange(e: React.ChangeEvent<HTMLInputElement>) {
        console.log(e.target.checked);
        setIsFavourite(e.target.checked);
    };
    

    return <>
         <Form>
            <Form.Check
                type="switch"
                id="fav-switch-qu"
                label="Favorit" 
                onChange={onIsFavouritChange}
                />
        </Form>  
        <p>{props.question?.options?.type=="SYN"? "Nenne ein Synonym für" : 
            props.question?.options?.type=="GAP"? "Vervollständig se" :
            "Was bedeutet"}</p>
        <h2>
            {props.question ? props.question.question : ""}
            {props.question.options.type=="SYN" ? <span className="tag">Synonym</span>:<></>}
        </h2>
        <p></p>
        <>{hideAnswer ?
            <div className="container text-center">
                <button className={"btn m-3 btn-outline-primary"}
                    type="button"
                    key="bt_show"
                    onClick={() => setHideAnswer(false)}
                >
                    Lösung anzeigen
                </button>
            </div> :
            <>
                <div className="row justify-content-md-center">
                    <div className="col">
                        <button className={"btn m-5 btn-outline-primary"}
                            type="button"
                            key={'bt' + props.question.cardId}
                        >
                            {buttonText(props.question.answer)}
                        </button>
                    </div>
                </div>
                <div className="row justify-content-md-center">
                    <div className="col">
                        {answerButtons.map(ab =>
                            <button className={"btn mx-1 mx-md-3" + ab.color}
                                type="button"
                                key={ab.key}
                                onClick={ab.handle}
                            >
                                {ab.label}
                            </button>
                        )}
                    </div>
                </div>
            </>
        }
        </>
    </>
}
export default QuestionAuto;