import { useEffect, useState } from 'react';
import Mascot from './Mascot.jsx';

const DIFFICULTY_LABELS = [
  '',
  'Piece of cake',
  'Warm-up',
  'Getting real',
  'Tricky',
  'Challenging',
  'Hard',
  'Tough nut',
  'Brain bender',
  'Nasty',
  'Impossible'
];

export default function LevelSelect({ gameId, unlocked, onPlay }) {
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    fetch(`/api/levels?game=${encodeURIComponent(gameId)}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
  }, [gameId]);

  return (
    <div className="screen">
      <header className="hero">
        <Mascot expression="idle" caption="Layla awaits…" />
        <h1 className="title">
          LA<span className="accent">Y</span>LA
        </h1>
        <p className="tagline">
          Ask questions. Crack the secret word. Ten levels, easy to brutal.
        </p>
      </header>
      <div className="level-grid">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((id) => {
          const locked = id > unlocked;
          const level = meta?.levels?.find((l) => l.id === id);
          return (
            <button
              key={id}
              className={`level-card ${locked ? 'locked' : ''}`}
              onClick={() => !locked && onPlay(id)}
              disabled={locked}
            >
              <span className="level-num">{locked ? '🔒' : id}</span>
              <span className="level-title">{level?.title || '…'}</span>
              <span className="level-diff">{level ? DIFFICULTY_LABELS[level.difficulty] : ''}</span>
            </button>
          );
        })}
      </div>
      <p className="footer-note">
        {meta
          ? `💡 ${meta.hintsLeft} of ${meta.hintsPerGame} hints left — shared across the whole game. Unlimited questions, but the word and its letters are never revealed. Refresh or leave and it's back to square one.`
          : 'Loading…'}
      </p>
    </div>
  );
}