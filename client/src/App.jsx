import { useState } from 'react';
import LevelSelect from './components/LevelSelect.jsx';
import Game from './components/Game.jsx';

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [levelId, setLevelId] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [gameId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `g-${Date.now()}`
  );

  const play = (id) => {
    setLevelId(id);
    setScreen('game');
  };

  const onLevelWon = (id) => {
    setUnlocked((u) => Math.max(u, id + 1));
  };

  return screen === 'game' ? (
    <Game levelId={levelId} gameId={gameId} onLevelWon={onLevelWon} onExit={() => setScreen('menu')} />
  ) : (
    <LevelSelect gameId={gameId} unlocked={unlocked} onPlay={play} />
  );
}