import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Hdr from './components/Hdr'
import Body from './components/Body'
import LoginModal from './components/LoginModal'
import { useState } from 'react';

function App() {

  const audio = {
    success: new Audio(import.meta.env.BASE_URL + "success.mp3"),
    successFanfare: new Audio(import.meta.env.BASE_URL + "success-fanfare.mp3"),
    error: new Audio(import.meta.env.BASE_URL + "error.wav")
  }

  const [counter, setCounter] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [firstName, setFirstName] = useState<string | null>(null)
  const [lastName, setLastName] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)

  function handleSignOut() {
    setIsLoggedIn(false)
    setUserName(null)
    setToken(null)
    setFirstName(null)
    setLastName(null)
    setRole(null)
    setCounter(0)
  }

  return (
    <div className="App">
      <LoginModal
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        setUserName={setUserName}
        setToken={setToken}
        setFirstName={setFirstName}
        setLastName={setLastName}
        setRole={setRole}
      />
      <Hdr
        audio={audio}
        counter={counter}
        isLoggedIn={isLoggedIn}
        userName={userName}
        firstName={firstName}
        lastName={lastName}
        role={role}
        onSignOut={handleSignOut}
      />
      <Body audio={audio} setCounter={setCounter} token={token} />
    </div>
  )
}

export default App;
