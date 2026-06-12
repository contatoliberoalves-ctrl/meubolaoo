// Collectible-card style cartoon mascot of Prof. Líbero Filho.
// viewBox 200x240. Navy blazer, white shirt, checkered tie, glasses, smile.
export default function Mascot({ className = "" }: { className?: string }) {
  // Build a 8x8 checkered tie pattern alternating purple / teal.
  const tieSquares: JSX.Element[] = [];
  const cols = 4;
  const rows = 6;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fill = (r + c) % 2 === 0 ? "#5a4fd6" : "#1fb6c9";
      tieSquares.push(
        <rect
          key={`${r}-${c}`}
          x={c * 4}
          y={r * 4}
          width={4}
          height={4}
          fill={fill}
        />
      );
    }
  }

  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="tieClip">
          {/* tie shape: narrow knot widening downward */}
          <path d="M92 150 L108 150 L116 215 L100 230 L84 215 Z" />
        </clipPath>
      </defs>

      {/* navy blazer / shoulders */}
      <path
        d="M30 240 V190 Q30 150 70 140 L130 140 Q170 150 170 190 V240 Z"
        fill="#15336a"
      />
      {/* blazer lapels */}
      <path d="M85 145 L100 200 L80 200 L70 150 Z" fill="#102a55" />
      <path d="M115 145 L100 200 L120 200 L130 150 Z" fill="#102a55" />
      {/* white shirt triangle */}
      <path d="M88 145 L112 145 L100 175 Z" fill="#f8f9fa" />
      {/* collar */}
      <path d="M88 145 L100 158 L100 150 Z" fill="#e6e9ee" />
      <path d="M112 145 L100 158 L100 150 Z" fill="#e6e9ee" />

      {/* checkered tie */}
      <g clipPath="url(#tieClip)" transform="translate(84,150)">
        {tieSquares}
      </g>
      {/* tie knot outline */}
      <path
        d="M92 150 L108 150 L116 215 L100 230 L84 215 Z"
        fill="none"
        stroke="rgba(0,0,0,.18)"
        strokeWidth="1.5"
      />

      {/* pin on chest */}
      <circle cx="128" cy="170" r="5" fill="var(--gold)" stroke="#b8902f" />

      {/* neck */}
      <rect x="88" y="120" width="24" height="28" rx="8" fill="#c08a5d" />

      {/* head */}
      <ellipse cx="100" cy="88" rx="46" ry="50" fill="#c08a5d" />
      {/* ears */}
      <circle cx="55" cy="92" r="9" fill="#c08a5d" />
      <circle cx="145" cy="92" r="9" fill="#c08a5d" />

      {/* shaved/dark hair */}
      <path
        d="M56 78 Q58 36 100 34 Q142 36 144 78 Q132 60 100 58 Q68 60 56 78 Z"
        fill="#23211f"
      />
      {/* sideburns */}
      <path d="M56 78 Q54 96 60 104 L66 100 Q60 90 60 80 Z" fill="#23211f" />
      <path d="M144 78 Q146 96 140 104 L134 100 Q140 90 140 80 Z" fill="#23211f" />

      {/* eyebrows */}
      <rect x="68" y="78" width="22" height="4" rx="2" fill="#23211f" />
      <rect x="110" y="78" width="22" height="4" rx="2" fill="#23211f" />

      {/* light-frame glasses */}
      <g fill="none" stroke="#2b2b2b" strokeWidth="3">
        <rect x="64" y="84" width="30" height="22" rx="8" />
        <rect x="106" y="84" width="30" height="22" rx="8" />
        <line x1="94" y1="92" x2="106" y2="92" />
        <line x1="64" y1="90" x2="54" y2="88" />
        <line x1="136" y1="90" x2="146" y2="88" />
      </g>
      {/* eyes */}
      <circle cx="79" cy="95" r="4" fill="#1a1a1a" />
      <circle cx="121" cy="95" r="4" fill="#1a1a1a" />

      {/* nose */}
      <path d="M100 100 L95 114 Q100 118 105 114 Z" fill="#a9744a" />

      {/* big smile */}
      <path
        d="M78 118 Q100 138 122 118 Q100 128 78 118 Z"
        fill="#7a3b2e"
      />
      <path
        d="M80 119 Q100 132 120 119"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
