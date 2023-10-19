import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Hdr from './components/Hdr'
import Body from './components/Body'
import React, {useState} from 'react';

// npm install bootstrap
// npm install react-bootstrap --save
// npm install react-input-slider --save
// npm install react-icons --save

function App() {

  const audio = {
    success: new Audio(process.env.PUBLIC_URL +  "/success.mp3"),
    successFanfare: new Audio(process.env.PUBLIC_URL +  "/success-fanfare.mp3"),
    error: new Audio(process.env.PUBLIC_URL + "/error.wav")
  }
  
  const start = () => {
    audio.error.play()
  }

  const [counter, setCounter] = useState<number>(0);



  return (
    <>
      <div className="App">
        <Hdr audio={audio} counter={counter}/>
        <Body audio={audio} setCounter={setCounter}/>

      </div>
    </>

  )
}

export default App;
