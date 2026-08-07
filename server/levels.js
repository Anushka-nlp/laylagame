export const HINTS_PER_GAME = 5;

const POOLS = {
  1: ['cat', 'dog', 'sun', 'star', 'key', 'book', 'cake', 'moon', 'fish', 'bird', 'gold', 'map'],
  2: ['apple', 'ocean', 'tiger', 'bread', 'music', 'river', 'cloud', 'stone', 'smile', 'honey', 'mango'],
  3: ['guitar', 'candy', 'dream', 'flame', 'ghost', 'juice', 'lemon', 'magic', 'piano', 'pillow'],
  4: ['garden', 'helmet', 'island', 'jacket', 'kitten', 'marble', 'nectar', 'pencil', 'rocket', 'shadow', 'carrot', 'button'],
  5: ['compass', 'balloon', 'blanket', 'castle', 'diamond', 'eclipse', 'feather', 'harvest', 'mystery', 'rainbow', 'thunder', 'balcony'],
  6: ['lavender', 'horizon', 'journal', 'kitchen', 'miracle', 'pyramid', 'treasure', 'volcano', 'weather', 'whisper', 'zephyr'],
  7: ['paradise', 'sapphire', 'tornado', 'gazelle', 'lullaby', 'mermaid', 'quicksand', 'snowflake', 'twilight'],
  8: ['labyrinth', 'umbrella', 'waterfall', 'chocolate', 'adventure', 'dinosaur', 'elephant', 'kangaroo', 'marmalade', 'nightfall'],
  9: ['lighthouse', 'silhouette', 'tangerine', 'wilderness', 'xylophone', 'strawberry', 'butterfly', 'quarantine', 'magnolia'],
  10: ['serendipity', 'quintessential', 'flabbergast', 'chrysanthemum', 'clandestine', 'mnemonic', 'nebulous', 'enigmatic']
};

export const LEVELS = [
  { id: 1, difficulty: 1, title: 'First Whispers' },
  { id: 2, difficulty: 2, title: 'Deeper Secrets' },
  { id: 3, difficulty: 3, title: 'Fading Echoes' },
  { id: 4, difficulty: 4, title: 'Hidden Trails' },
  { id: 5, difficulty: 5, title: 'Velvet Shadows' },
  { id: 6, difficulty: 6, title: 'Murky Depths' },
  { id: 7, difficulty: 7, title: 'Silken Riddles' },
  { id: 8, difficulty: 8, title: 'Twisted Paths' },
  { id: 9, difficulty: 9, title: 'Pitch Black' },
  { id: 10, difficulty: 10, title: 'The Final Word' }
];

export function getLevel(id) {
  return LEVELS.find((l) => l.id === id) || null;
}

export function randomWordForLevel(levelId, exclude) {
  const pool = POOLS[levelId] || POOLS[1];
  const options = exclude ? pool.filter((w) => w !== exclude) : pool;
  return options[Math.floor(Math.random() * options.length)];
}