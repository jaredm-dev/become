interface Props {
  pct: number;
  small?: boolean;
}

function stageFor(pct: number): number {
  if (pct >= 95) return 5;
  if (pct >= 80) return 4;
  if (pct >= 60) return 3;
  if (pct >= 40) return 2;
  if (pct >= 20) return 1;
  return 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cracks through the letters — jagged paths.
const CRACKS_BY_STAGE: string[][] = [
  [],
  ['M 80 70 L 100 60 L 118 78'],
  [
    'M 50 55 L 75 75 L 95 60 L 120 80',
    'M 285 85 L 305 65 L 330 88 L 350 72',
  ],
  [
    'M 40 50 L 70 75 L 92 55 L 118 80 L 145 60',
    'M 200 38 L 225 62 L 250 42 L 275 70',
    'M 290 85 L 315 65 L 340 90 L 365 72',
  ],
  [
    'M 28 45 L 60 70 L 85 50 L 115 80 L 145 55 L 170 75',
    'M 175 90 L 200 70 L 230 95 L 260 75 L 285 100',
    'M 200 35 L 230 60 L 260 38 L 295 65 L 325 42',
    'M 295 85 L 325 62 L 350 88 L 380 68',
    'M 100 28 L 120 55 L 108 80',
  ],
  [
    'M 22 42 L 55 70 L 80 45 L 115 80 L 145 55 L 175 78 L 200 60',
    'M 158 88 L 185 68 L 215 95 L 245 72 L 275 100 L 300 78',
    'M 195 28 L 225 60 L 260 32 L 295 65 L 330 38',
    'M 285 85 L 320 60 L 350 90 L 380 68',
    'M 90 22 L 115 55 L 100 85',
    'M 245 100 L 270 78 L 290 105',
    'M 25 85 L 55 108 L 80 85',
  ],
];

interface Shard { x: number; y: number; size: number; rot: number; gradId: string }

function shardsForStage(stage: number, isFinal: boolean): Shard[] {
  if (stage === 0) return [];
  const rng = mulberry32(stage * 1000 + 7);
  const counts = [0, 4, 8, 14, 20, 28][stage];
  const shards: Shard[] = [];
  for (let i = 0; i < counts; i++) {
    const angle = rng() * Math.PI * 2;
    const baseDist = 65 + rng() * 100;
    shards.push({
      x: 200 + Math.cos(angle) * baseDist,
      y: 65 + Math.sin(angle) * baseDist * 0.55,
      size: 2 + rng() * (stage >= 4 ? 7 : 4.5),
      rot: rng() * 360,
      gradId: isFinal ? 'shardFinal' : 'shardGold',
    });
  }
  return shards;
}

function particlesForStage(stage: number, seed: number) {
  if (stage === 0) return [];
  const rng = mulberry32(seed);
  const count = [0, 14, 28, 48, 70, 96][stage];
  const items = [];
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 60 + rng() * (45 + stage * 14);
    items.push({
      x: 200 + Math.cos(angle) * dist,
      y: 65 + Math.sin(angle) * dist * 0.6,
      r: 0.3 + rng() * 1.5,
      o: 0.35 + rng() * 0.5,
    });
  }
  return items;
}

function energyLines(stage: number) {
  const lines = [];
  const count = stage === 5 ? 16 : stage === 4 ? 8 : 0;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const inner = 75;
    const outer = stage === 5 ? 200 : 130;
    lines.push({
      x1: 200 + Math.cos(angle) * inner,
      y1: 65 + Math.sin(angle) * inner * 0.55,
      x2: 200 + Math.cos(angle) * outer,
      y2: 65 + Math.sin(angle) * outer * 0.55,
      opacity: stage === 5 ? 0.55 : 0.3,
    });
  }
  return lines;
}

function shardPolygon(s: Shard): string {
  const a = s.size;
  return `${-a},${-a * 0.55} ${a * 1.15},${-a * 0.35} ${a * 0.25},${a * 0.95}`;
}

export default function Title({ pct, small }: Props) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const stage = stageFor(clamped);
  const isFinal = stage === 5;

  const cracks = CRACKS_BY_STAGE[stage];
  const shards = shardsForStage(stage, isFinal);
  const particles = particlesForStage(stage, stage * 100 + 31);
  const lines = energyLines(stage);

  const titleRot = stage >= 4 ? -0.5 : 0;

  // The text "BECOME" is shared across many layers — keep config in one place.
  const textProps = {
    x: 200,
    y: 92,
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Arial Black", Impact, sans-serif',
    fontSize: 92,
    fontWeight: 900,
    textAnchor: 'middle' as const,
    letterSpacing: -2.5,
  };

  return (
    <svg
      viewBox="0 0 400 145"
      className={`title-svg ${small ? 'small' : ''}`}
      aria-label={`BECOME — ${clamped}% there`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Letter face gradient — top-lit highlight to deep shadow */}
        <linearGradient id="letterGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset="0.18" stopColor="#fde047" />
          <stop offset="0.55" stopColor="#eab308" />
          <stop offset="0.85" stopColor="#a16207" />
          <stop offset="1" stopColor="#713f12" />
        </linearGradient>
        <linearGradient id="letterFinal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset="0.25" stopColor="#67e8f9" />
          <stop offset="0.55" stopColor="#22d3ee" />
          <stop offset="0.85" stopColor="#0891b2" />
          <stop offset="1" stopColor="#164e63" />
        </linearGradient>
        {/* Top-edge highlight (catches light) */}
        <linearGradient id="topShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Shard fill gradients */}
        <linearGradient id="shardGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id="shardFinal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
        {/* Cracked-open inner glow (energy showing through) */}
        <linearGradient id="crackCore" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="0.5" stopColor="#fef3c7" />
          <stop offset="1" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="crackCoreFinal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#ecfeff" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
        {/* Vignette plate behind everything */}
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#1a1f2e" stopOpacity="0.6" />
          <stop offset="0.7" stopColor="#0a0a0a" stopOpacity="0.3" />
          <stop offset="1" stopColor="#0a0a0a" stopOpacity="0" />
        </radialGradient>
        {/* Bloom for letters at heavy stages */}
        <filter id="bloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isFinal ? 5 : stage >= 3 ? 2.5 : 0} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Clip the top half of letters for highlight overlay */}
        <clipPath id="topHalfClip">
          <rect x="0" y="0" width="400" height="78" />
        </clipPath>
      </defs>

      {/* Vignette plate */}
      <rect width="400" height="145" fill="url(#vignette)" />

      {/* Outer glow halo at later stages */}
      {stage >= 3 && (
        <text
          {...textProps}
          fill={isFinal ? '#22d3ee' : '#facc15'}
          opacity={isFinal ? 0.5 : 0.32}
          filter="url(#bloom)"
          transform={`rotate(${titleRot} 200 70)`}
        >
          BECOME
        </text>
      )}

      {/* Energy lines (radial beams) — show at stage 4+ */}
      {lines.length > 0 && (
        <g>
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={isFinal ? '#22d3ee' : '#facc15'}
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity={l.opacity}
            />
          ))}
        </g>
      )}

      {/* Drop shadow behind text — gives it lift */}
      <text
        {...textProps}
        y={textProps.y + 4}
        fill="#000"
        opacity="0.55"
        transform={`rotate(${titleRot} 200 70)`}
      >
        BECOME
      </text>

      {/* Outline (dark stroke) — separates letters from background */}
      <text
        {...textProps}
        fill="none"
        stroke="#1a1208"
        strokeWidth="2.5"
        strokeLinejoin="round"
        transform={`rotate(${titleRot} 200 70)`}
      >
        BECOME
      </text>

      {/* Main letter face — gradient fill */}
      <text
        {...textProps}
        fill={isFinal ? 'url(#letterFinal)' : 'url(#letterGold)'}
        transform={`rotate(${titleRot} 200 70)`}
      >
        BECOME
      </text>

      {/* Top-edge highlight — only on upper half */}
      <g clipPath="url(#topHalfClip)" transform={`rotate(${titleRot} 200 70)`}>
        <text
          {...textProps}
          fill="url(#topShine)"
          opacity="0.85"
        >
          BECOME
        </text>
      </g>

      {/* Cracks — multi-layer for depth (shadow + glow core + bright highlight) */}
      {cracks.length > 0 && (
        <g>
          {/* Shadow under the crack */}
          {cracks.map((d, i) => (
            <path
              key={`shadow-${i}`}
              d={d}
              stroke="#000"
              strokeWidth={3 + stage * 0.3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
          ))}
          {/* Inner glow — energy leaking out of the crack */}
          {cracks.map((d, i) => (
            <path
              key={`glow-${i}`}
              d={d}
              stroke={isFinal ? 'url(#crackCoreFinal)' : 'url(#crackCore)'}
              strokeWidth={1.2 + stage * 0.15}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
              filter="url(#bloom)"
            />
          ))}
          {/* Bright bright center highlight */}
          {cracks.map((d, i) => (
            <path
              key={`hl-${i}`}
              d={d}
              stroke="#fff"
              strokeWidth="0.6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
              transform="translate(0.3 -0.3)"
            />
          ))}
        </g>
      )}

      {/* Floating shards — gradient-filled, with dark outline */}
      {shards.length > 0 && (
        <g>
          {shards.map((s, i) => (
            <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
              {/* Shadow underneath the shard */}
              <polygon
                points={shardPolygon(s)}
                fill="#000"
                opacity="0.5"
                transform="translate(0.8 1.2)"
              />
              <polygon
                points={shardPolygon(s)}
                fill={`url(#${s.gradId})`}
                opacity="0.92"
                stroke="#1a1208"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </g>
          ))}
        </g>
      )}

      {/* Dust particles */}
      {particles.length > 0 && (
        <g>
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={isFinal ? '#67e8f9' : '#fde047'}
              opacity={p.o}
            />
          ))}
        </g>
      )}
    </svg>
  );
}
