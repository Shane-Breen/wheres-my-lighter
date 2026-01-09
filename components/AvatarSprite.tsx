import { seedToRng } from "@/lib/avatarSeed";

type Props = {
  seed: string;
  size?: number; // px
  mood?: "wobble" | "calm" | "chaos";
};

export default function AvatarSprite({ seed, size = 64, mood = "calm" }: Props) {
  const rand = seedToRng(seed);

  const palettes = [
    ["#C8A0FF", "#8A5CFF", "#2A143F", "#FFD36E"],
    ["#7EE3FF", "#3B82F6", "#0B1020", "#A7F3D0"],
    ["#FF7AB6", "#F472B6", "#240B1D", "#FFD1A1"],
    ["#A7FF83", "#22C55E", "#081B10", "#D4FFB5"],
    ["#FFD36E", "#F59E0B", "#241A05", "#FFE7B3"],
  ];

  const pal = palettes[Math.floor(rand() * palettes.length)];
  const [c1, c2, bg, spark] = pal;

  const eye = Math.floor(rand() * 6);
  const mouth = Math.floor(rand() * 6);
  const horn = rand() > 0.6;
  const blush = rand() > 0.55;

  const grid = new Array(64).fill(0).map(() => (rand() > 0.72 ? 1 : 0));
  for (const idx of [27, 28, 35, 36, 19, 20, 43, 44]) grid[idx] = 1;

  const wiggle =
    mood === "wobble" ? "wml-wobble" : mood === "chaos" ? "wml-chaos" : "wml-calm";

  const px = size / 10;
  const offset = size * 0.1;

  return (
    <div className={`inline-flex ${wiggle}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Avatar">
        <rect x="0" y="0" width={size} height={size} rx={size * 0.28} fill={bg} opacity="0.55" />
        <rect
          x={size * 0.06}
          y={size * 0.06}
          width={size * 0.88}
          height={size * 0.88}
          rx={size * 0.25}
          fill="black"
          opacity="0.18"
        />

        {grid.map((on, i) => {
          if (!on) return null;
          const gx = i % 8;
          const gy = Math.floor(i / 8);
          const x = offset + gx * px;
          const y = offset + gy * px;
          const fill = rand() > 0.5 ? c1 : c2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={px * 0.95}
              height={px * 0.95}
              rx={px * 0.25}
              fill={fill}
              opacity={0.85}
            />
          );
        })}

        <g opacity="0.92">
          {eye === 0 && (
            <>
              <circle cx={size * 0.40} cy={size * 0.43} r={size * 0.035} fill="#fff" />
              <circle cx={size * 0.60} cy={size * 0.43} r={size * 0.035} fill="#fff" />
            </>
          )}
          {eye === 1 && (
            <>
              <rect x={size * 0.36} y={size * 0.41} width={size * 0.08} height={size * 0.04} rx={size * 0.02} fill="#fff" />
              <rect x={size * 0.56} y={size * 0.41} width={size * 0.08} height={size * 0.04} rx={size * 0.02} fill="#fff" />
            </>
          )}
          {eye === 2 && (
            <>
              <circle cx={size * 0.40} cy={size * 0.43} r={size * 0.030} fill="#fff" />
              <circle cx={size * 0.60} cy={size * 0.43} r={size * 0.030} fill="#fff" />
              <circle cx={size * 0.40} cy={size * 0.43} r={size * 0.015} fill="#111" />
              <circle cx={size * 0.60} cy={size * 0.43} r={size * 0.015} fill="#111" />
            </>
          )}
          {eye === 3 && (
            <>
              <path
                d={`M ${size * 0.34} ${size * 0.43} Q ${size * 0.40} ${size * 0.39} ${size * 0.46} ${size * 0.43}`}
                stroke="#fff"
                strokeWidth={size * 0.03}
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M ${size * 0.54} ${size * 0.43} Q ${size * 0.60} ${size * 0.39} ${size * 0.66} ${size * 0.43}`}
                stroke="#fff"
                strokeWidth={size * 0.03}
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {eye === 4 && (
            <>
              <circle cx={size * 0.40} cy={size * 0.43} r={size * 0.040} fill="#fff" opacity="0.9" />
              <circle cx={size * 0.60} cy={size * 0.43} r={size * 0.040} fill="#fff" opacity="0.9" />
            </>
          )}
          {eye === 5 && (
            <>
              <rect x={size * 0.35} y={size * 0.41} width={size * 0.10} height={size * 0.06} rx={size * 0.03} fill="#fff" opacity="0.9" />
              <rect x={size * 0.55} y={size * 0.41} width={size * 0.10} height={size * 0.06} rx={size * 0.03} fill="#fff" opacity="0.9" />
            </>
          )}
        </g>

        <g opacity="0.9">
          {mouth === 0 && <rect x={size * 0.46} y={size * 0.55} width={size * 0.08} height={size * 0.03} rx={size * 0.015} fill="#fff" opacity="0.8" />}
          {mouth === 1 && <path d={`M ${size * 0.44} ${size * 0.56} Q ${size * 0.50} ${size * 0.60} ${size * 0.56} ${size * 0.56}`} stroke="#fff" strokeWidth={size * 0.03} strokeLinecap="round" fill="none" />}
          {mouth === 2 && <path d={`M ${size * 0.44} ${size * 0.58} Q ${size * 0.50} ${size * 0.54} ${size * 0.56} ${size * 0.58}`} stroke="#fff" strokeWidth={size * 0.03} strokeLinecap="round" fill="none" />}
          {mouth === 3 && <circle cx={size * 0.50} cy={size * 0.57} r={size * 0.02} fill="#fff" opacity="0.8" />}
          {mouth === 4 && <rect x={size * 0.47} y={size * 0.55} width={size * 0.06} height={size * 0.05} rx={size * 0.02} fill="#fff" opacity="0.7" />}
          {mouth === 5 && <path d={`M ${size * 0.42} ${size * 0.56} L ${size * 0.58} ${size * 0.56}`} stroke="#fff" strokeWidth={size * 0.03} strokeLinecap="round" />}
        </g>

        {horn && (
          <path
            d={`M ${size * 0.50} ${size * 0.18} L ${size * 0.42} ${size * 0.30} L ${size * 0.58} ${size * 0.30} Z`}
            fill={spark}
            opacity="0.85"
          />
        )}

        {blush && (
          <>
            <circle cx={size * 0.34} cy={size * 0.53} r={size * 0.03} fill={spark} opacity="0.35" />
            <circle cx={size * 0.66} cy={size * 0.53} r={size * 0.03} fill={spark} opacity="0.35" />
          </>
        )}
      </svg>

      <style>{`
        @keyframes wmlWobble {
          0% { transform: rotate(-1.2deg) translateY(0px); }
          50% { transform: rotate(1.2deg) translateY(-1px); }
          100% { transform: rotate(-1.2deg) translateY(0px); }
        }
        @keyframes wmlChaos {
          0% { transform: rotate(-2deg) translate(0px, 0px); }
          25% { transform: rotate(2deg) translate(0px, -1px); }
          50% { transform: rotate(-1.5deg) translate(1px, 0px); }
          75% { transform: rotate(2.5deg) translate(-1px, 1px); }
          100% { transform: rotate(-2deg) translate(0px, 0px); }
        }
        .wml-calm { transform: translateZ(0); }
        .wml-wobble { animation: wmlWobble 1200ms ease-in-out infinite; transform-origin: 50% 60%; }
        .wml-chaos { animation: wmlChaos 900ms ease-in-out infinite; transform-origin: 50% 60%; }
      `}</style>
    </div>
  );
}
