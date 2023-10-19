import React, { Component } from 'react';
import AudioControl from './AudioControl'


function Hdr(props: {audio:any, counter: number}) {
    return <>
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Lern-Studio</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <AudioControl audio={props.audio}/>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                    </ul>
                </div>
                <span className="counter">{props.counter}</span>
                
            </div>
        </nav>
    </>
}

export default Hdr;