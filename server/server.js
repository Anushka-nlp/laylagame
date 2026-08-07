import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { LEVELS, HINTS_PER_GAME, getLevel, randomWordForLevel } from './levels.js';
import { askGameMaster, getHint } from './llm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sessions = new Map();
const games = new Map();
const lastWordByLevel = {};

function getGame(req) {
  const id = String(req.body?.gameId || req.query?.game || req.headers['x-layla-game'] || 'default');
  if (!games.has(id)) {
    games.set(id, { hintsLeft: HINTS_PER_GAME });
  }
  if (games.size > 2000) {
    games.delete(games.keys().next().value);
  }
  return games.get(id);
}

function createSession(level) {
  const word = randomWordForLevel(level.id, lastWordByLevel[level.id]);
  lastWordByLevel[level.id] = word;
  const session = {
    id: randomUUID(),
    levelId: level.id,
    difficulty: level.difficulty,
    word,
    hintsUsed: 0,
    status: 'active'
  };
  sessions.set(session.id, session);
  if (sessions.size > 500) {
    sessions.delete(sessions.keys().next().value);
  }
  return session;
}

function getSession(req, res) {
  const session = sessions.get(String(req.body?.sessionId ?? req.params?.sessionId ?? ''));
  if (!session) {
    res.status(404).json({ error: 'Session not found. Restart the level.' });
    return null;
  }
  return session;
}

app.get('/api/levels', (req, res) => {
  const game = getGame(req);
  res.json({
    levels: LEVELS.map(({ id, difficulty, title }) => ({ id, difficulty, title })),
    hintsLeft: game.hintsLeft,
    hintsPerGame: HINTS_PER_GAME
  });
});

app.post('/api/start', (req, res) => {
  const level = getLevel(Number(req.body?.levelId));
  if (!level) return res.status(400).json({ error: 'Unknown level' });
  const session = createSession(level);
  const game = getGame(req);
  res.json({
    sessionId: session.id,
    level: session.levelId,
    hintsLeft: game.hintsLeft,
    status: 'active'
  });
});

app.post('/api/ask', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  if (session.status !== 'active') return res.status(400).json({ error: 'Level over. Start a new one.' });
  const question = String(req.body?.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Empty question' });
  try {
    const answer = await askGameMaster({ word: session.word, question, difficulty: session.difficulty });
    res.json({ answer });
  } catch (err) {
    console.error('ask error:', err.message);
    res.status(502).json({ error: 'Could not reach the game master. Check GROQ_API_KEY.' });
  }
});

app.post('/api/hint', async (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  if (session.status !== 'active') return res.status(400).json({ error: 'Level over. Start a new one.' });
  const game = getGame(req);
  if (game.hintsLeft <= 0) {
    return res.status(400).json({ error: 'No hints left for the whole game.' });
  }
  game.hintsLeft -= 1;
  session.hintsUsed += 1;
  try {
    const hint = await getHint({ word: session.word, hintIndex: session.hintsUsed - 1, difficulty: session.difficulty });
    res.json({ hint, hintsLeft: game.hintsLeft });
  } catch (err) {
    game.hintsLeft += 1;
    session.hintsUsed -= 1;
    console.error('hint error:', err.message);
    res.status(502).json({ error: 'Could not reach the game master. Check GROQ_API_KEY.' });
  }
});

app.post('/api/guess', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  if (session.status !== 'active') return res.status(400).json({ error: 'Level over. Start a new one.' });
  const guess = String(req.body?.word || '').trim().toLowerCase();
  if (!guess) return res.status(400).json({ error: 'Empty guess' });

  if (guess === session.word) {
    session.status = 'won';
    const score = Math.max(5, 100 - session.hintsUsed * 25);
    if (session.levelId === LEVELS.length) {
      getGame(req).hintsLeft = HINTS_PER_GAME;
    }
    return res.json({ correct: true, solved: true, score, word: session.word });
  }

  res.json({ correct: false, solved: false });
});

app.post('/api/giveup', (req, res) => {
  const session = getSession(req, res);
  if (!session) return;
  if (session.status !== 'active') return res.status(400).json({ error: 'Level over.' });
  session.status = 'given';
  res.json({ word: session.word });
});

app.listen(PORT, () => {
  console.log(`Layla server running on http://localhost:${PORT}`);
});