import { useEffect, useRef, useState } from 'react';
import Mascot from './Mascot.jsx';

const EVASIVE_ATTEMPT = /\b(word|letter|letters|spell|reveal|secret|answer|riddle|tell|solution|what is it)\b/i;

export default function Game({ levelId, gameId, onLevelWon, onExit }) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [guess, setGuess] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [gaveUpWord, setGaveUpWord] = useState(null);
  const [mood, setMood] = useState('idle');
  const bottomRef = useRef(null);

  const api = (path, body) =>
    fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-layla-game': gameId },
      body: JSON.stringify(body)
    }).then((r) => r.json());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await api('/api/start', { levelId });
      if (cancelled || data.error) return;
      setSession(data);
      setMood('idle');
      setMessages([
        {
          role: 'gm',
          text: `I've picked a secret word — but I only ever whisper about it. Ask me anything; I have ${data.hintsLeft} hint${data.hintsLeft === 1 ? '' : 's'} for the whole game. Crack it, detective.`
        }
      ]);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const ask = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || busy || !session) return;
    const evasive = EVASIVE_ATTEMPT.test(q);
    setQuestion('');
    setMessages((m) => [...m, { role: 'player', text: q }]);
    setMood(evasive ? 'evasive' : 'thinking');
    setBusy(true);
    try {
      const data = await api('/api/ask', { sessionId: session.sessionId, question: q });
      if (data.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: 'gm', text: data.answer }]);
      setMood(evasive ? 'evasive' : 'idle');
    } catch (err) {
      setMessages((m) => [...m, { role: 'gm', text: `⚠️ ${err.message}` }]);
      setMood('idle');
    }
    setBusy(false);
  };

  const getHint = async () => {
    if (!session || session.hintsLeft <= 0 || busy) return;
    setMood('happy');
    setBusy(true);
    try {
      const data = await api('/api/hint', { sessionId: session.sessionId });
      if (data.error) throw new Error(data.error);
      setSession((s) => ({ ...s, hintsLeft: data.hintsLeft }));
      setMessages((m) => [...m, { role: 'gm', text: `💡 Hint: ${data.hint}` }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'gm', text: `⚠️ ${err.message}` }]);
    }
    setBusy(false);
  };

  const submitGuess = async (e) => {
    e.preventDefault();
    const g = guess.trim().toLowerCase();
    if (!g || busy || !session) return;
    setGuess('');
    setMessages((m) => [...m, { role: 'guess', text: g }]);
    setBusy(true);
    try {
      const data = await api('/api/guess', { sessionId: session.sessionId, word: g });
      if (data.error) throw new Error(data.error);
      if (data.correct) {
        onLevelWon(levelId);
        setMood('win');
        setResult({ status: 'won', score: data.score, word: data.word });
        setMessages((m) => [...m, { role: 'gm', text: `🎉 Correct! The word was "${data.word}"!` }]);
      } else {
        setMood('amused');
        setMessages((m) => [...m, { role: 'gm', text: '❌ Not it. Layla chuckles and stays silent.' }]);
      }
    } catch (err) {
      setMessages((m) => [...m, { role: 'gm', text: `⚠️ ${err.message}` }]);
    }
    setBusy(false);
  };

  const giveUp = async () => {
    if (!session || busy) return;
    setMood('idle');
    try {
      const data = await api('/api/giveup', { sessionId: session.sessionId });
      if (data.error) throw new Error(data.error);
      setGaveUpWord(data.word);
    } catch (err) {
      setMessages((m) => [...m, { role: 'gm', text: `⚠️ ${err.message}` }]);
    }
  };

  if (!session) {
    return (
      <div className="screen center">
        <Mascot expression="idle" />
        <div className="loading">Choosing a secret word…</div>
      </div>
    );
  }

  return (
    <div className="screen game-screen">
      <header className="game-header">
        <div className="game-meta">
          <span className="level-badge">Level {session.level}</span>
          <span className="hints">💡 × {session.hintsLeft} (whole game)</span>
        </div>
        <div className="game-actions">
          <button className="btn-ghost" onClick={giveUp}>
            😵 Give up
          </button>
          <button className="btn-ghost" onClick={onExit}>
            ← Levels
          </button>
        </div>
      </header>

      <Mascot expression={mood} />

      <div className="chat">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === 'guess' ? <strong>Guess:</strong> : ''} {m.text}
          </div>
        ))}
        {busy && <div className="msg gm typing">…</div>}
        <div ref={bottomRef} />
      </div>

      <div className="controls">
        <form onSubmit={ask} className="ask-form">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Layla anything…"
            disabled={busy || result || gaveUpWord}
            maxLength={200}
          />
          <button type="submit" className="btn" disabled={busy || result || gaveUpWord}>
            Ask
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={getHint}
            disabled={busy || result || gaveUpWord || session.hintsLeft <= 0}
          >
            💡 Hint ({session.hintsLeft})
          </button>
        </form>
        <form onSubmit={submitGuess} className="guess-form">
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Guess the secret word…"
            disabled={busy || result || gaveUpWord}
            maxLength={30}
          />
          <button type="submit" className="btn btn-primary" disabled={busy || result || gaveUpWord}>
            Guess
          </button>
        </form>
      </div>

      {result && (
        <div className="overlay">
          <div className="modal">
            {result.status === 'won' ? (
              <>
                <h2>{levelId === 10 ? '🏆 Game complete!' : '🎉 Level cracked!'}</h2>
                <p>
                  Score: <strong>{result.score}</strong>
                </p>
                <p className="modal-sub">
                  The word was <strong>{result.word}</strong>
                  {levelId === 10 ? '. Hint stash refreshed for your next run!' : '.'}
                </p>
                <div className="modal-actions">
                  {levelId < 10 && (
                    <button className="btn btn-primary" onClick={onExit}>
                      Next level →
                    </button>
                  )}
                  <button className="btn-ghost" onClick={onExit}>
                    Back to levels
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {gaveUpWord && (
        <div className="overlay">
          <div className="modal">
            <h2>🤫 Between us…</h2>
            <p>
              The word was <strong>{gaveUpWord}</strong>. Layla won this round — and the level stays
              locked until you crack it.
            </p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onExit}>
                Back to levels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}