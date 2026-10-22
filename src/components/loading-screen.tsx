import { LOGO_HEX_PATH, LOGO_NODES } from "@/components/brand";

// The logo assembles itself: the hexagon traces and fills, the launch pad rises, the
// trunk and branches draw outward, and the nodes pop in. It then idles with an orbiting
// ring, a signal running up the branches, and a sheen. Timings live in globals.css.
// The trunk is drawn bottom-up and the branches from the trunk outwards.
const LOGO_LINES = [
  { className: "lm-trunk", d: "M24 38.2V15.8" },
  { className: "lm-left", d: "M24 32.8h-9.5v-9.1" },
  { className: "lm-right", d: "M24 29.7h9.8v-7" },
];

export function LoadingScreen({ message = "Preparing your workspace" }: { message?: string }) {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-stage">
        <div className="loading-emblem" aria-hidden="true">
          <span className="lm-halo"/>
          <span className="lm-orbit"><span className="lm-orbit-arc"/></span>
          <svg viewBox="0 0 48 48">
            <defs>
              <clipPath id="lm-hex-clip"><path d={LOGO_HEX_PATH}/></clipPath>
              <linearGradient id="lm-sheen-gradient" x1="0" y1="0" x2="1" y2="0.35">
                <stop offset="0" stopColor="#fff" stopOpacity="0"/>
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.7"/>
                <stop offset="1" stopColor="#fff" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path className="lm-hex-fill" d={LOGO_HEX_PATH} fill="currentColor"/>
            <path className="lm-hex-line" d={LOGO_HEX_PATH} pathLength={1}/>
            <g className="lm-ink">
              {LOGO_LINES.map(line => <path key={line.className} className={`lm-line ${line.className}`} d={line.d} pathLength={1}/>)}
              {LOGO_LINES.map(line => <path key={`${line.className}-pulse`} className={`lm-pulse ${line.className}`} d={line.d} pathLength={1}/>)}
              {LOGO_NODES.map((node, index) => <circle key={node.cx} className={`lm-node lm-node-${index + 1}`} {...node} r="4.5"/>)}
              <rect className="lm-base" x="19.4" y="35.8" width="9.2" height="6.3" rx="1.9"/>
            </g>
            <g clipPath="url(#lm-hex-clip)"><rect className="lm-sheen" x="0" y="0" width="14" height="48" fill="url(#lm-sheen-gradient)"/></g>
          </svg>
        </div>
        <p className="loading-wordmark" aria-hidden="true">
          {[..."GetLaunch"].map((letter, index) => <span key={index} className="lm-letter" style={{ "--i": index } as React.CSSProperties}>{letter}</span>)}
          <span className="lm-letter lm-letter-accent" style={{ "--i": 10 } as React.CSSProperties}>PH</span>
        </p>
        <p className="loading-caption">{message}</p>
      </div>
    </main>
  );
}
