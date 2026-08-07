const EXPRESSIONS = {
  idle: { face: '🐱', caption: 'Layla hums a secret tune…' },
  thinking: { face: '🤔', caption: 'Layla is thinking…' },
  evasive: { face: '🥸', caption: 'Layla smirks — nice try, detective.' },
  happy: { face: '😄', caption: 'Layla giggles — a tiny whisper!' },
  amused: { face: '😏', caption: 'Layla chuckles — wrong guess!' },
  win: { face: '🎉', caption: 'Layla cheers — you cracked it!' }
};

export default function Mascot({ expression = 'idle', caption }) {
  const e = EXPRESSIONS[expression] || EXPRESSIONS.idle;
  return (
    <div className="mascot">
      <div className="mascot-face" key={expression}>
        {e.face}
      </div>
      <div className="mascot-name">Layla</div>
      <div className="mascot-caption">{caption || e.caption}</div>
    </div>
  );
}