import './App.css';
import 'bootstrap/dist/css/bootstrap.css';
import Hdr from './components/Hdr';
import Body from './components/Body';
import LoginModal from './components/LoginModal';
import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminApp from './admin/AdminApp';

const audio = {
  success:        new Audio(import.meta.env.BASE_URL + 'success.mp3'),
  successFanfare: new Audio(import.meta.env.BASE_URL + 'success-fanfare.mp3'),
  error:          new Audio(import.meta.env.BASE_URL + 'error.wav'),
};

function App() {
  const [counter,    setCounter]    = useState<number>(0);
  const [rewardIcon, setRewardIcon] = useState<string | null>(null);

  // Auto-clear reward icon after 3 seconds
  useEffect(() => {
    if (!rewardIcon) return;
    const t = setTimeout(() => setRewardIcon(null), 3000);
    return () => clearTimeout(t);
  }, [rewardIcon]);

  return (
    <div className="App">
      <LoginModal />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={
          <>
            <Hdr audio={audio} counter={counter} rewardIcon={rewardIcon} />
            <Body
              audio={audio}
              counter={counter}
              setCounter={setCounter}
              setRewardIcon={setRewardIcon}
            />
          </>
        } />
      </Routes>
    </div>
  );
}

export default App;
