import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Hdr from './components/Hdr'
import Body from './components/Body'
import LoginModal from './components/LoginModal'
import React, { useState } from 'react';

// npm install bootstrap
// npm install react-bootstrap --save
// npm install react-input-slider --save
// npm install react-icons --save

function App() {

  const audio = {
    success: new Audio(process.env.PUBLIC_URL + "/success.mp3"),
    successFanfare: new Audio(process.env.PUBLIC_URL + "/success-fanfare.mp3"),
    error: new Audio(process.env.PUBLIC_URL + "/error.wav")
  }

  const start = () => {
    audio.error.play()
  }

  const [counter, setCounter] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  return (
    <>
      <div className="App">
        <LoginModal
          isLoggedIn={isLoggedIn}
          setIsLoggedIn={setIsLoggedIn} 
          setUserName={setUserName} 
          setToken={setToken}
        />
        <Hdr audio={audio} counter={counter} />
        <Body audio={audio} setCounter={setCounter} token={token}/>
      </div>
    </>

  )
}

export default App;
