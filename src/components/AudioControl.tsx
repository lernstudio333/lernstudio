import React, { Component } from 'react';
import { useState } from "react";
import InputSlider from 'react-input-slider';
import { BsFillVolumeUpFill } from "react-icons/bs";
import "../App.css"

function AudioControl(props: {audio:any}) {
    const [vol, setVolume] = useState(75);
    const fontStyles = { color: '#568203', fontSize: '20px' };

    function updateVolume(coords: { x : number; y : number }){
        setVolume(coords.x);
        props.audio.success.volume = coords.x/100;
        props.audio.error.volume = coords.x/100;
        props.audio.successFanfare.volume = coords.x/100;
        props.audio.success.play();
    }
      
    return (<>
        <div>
            <InputSlider
                axis="x"
                x={vol}
                onChange={updateVolume}
            />
        </div>
        <BsFillVolumeUpFill style={fontStyles} />

    </>)
}
export default AudioControl;