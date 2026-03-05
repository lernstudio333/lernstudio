import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Hdr from './components/Hdr'
import Body from './components/Body'
import LoginModal from './components/LoginModal'
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminApp from './admin/AdminApp';

const audio = {
  success: new Audio(import.meta.env.BASE_URL + "success.mp3"),
  successFanfare: new Audio(import.meta.env.BASE_URL + "success-fanfare.mp3"),
  error: new Audio(import.meta.env.BASE_URL + "error.wav")
};

function App() {
  const [counter, setCounter] = useState<number>(0);

  return (
    <div className="App">
      <LoginModal />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={
          <>
            <Hdr audio={audio} counter={counter} />
            <Body audio={audio} setCounter={setCounter} />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
