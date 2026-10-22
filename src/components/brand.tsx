import Link from "next/link";

// Shared with the animated loading mark so both stay identical.
export const LOGO_HEX_PATH = "M24 2.6 43 13.5c1.2.7 2 2 2 3.4v14.2c0 1.4-.8 2.7-2 3.4L24 45.4 5 34.5a4 4 0 0 1-2-3.4V16.9c0-1.4.8-2.7 2-3.4L24 2.6Z";
export const LOGO_NODES = [{ cx: 24, cy: 12.2 }, { cx: 14.5, cy: 20.2 }, { cx: 33.8, cy: 19.2 }];

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span className={`brand-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 48 48" role="img">
        <path d={LOGO_HEX_PATH} fill="currentColor"/>
        <g fill="none" stroke="var(--brand-mark-ink, #334D44)" strokeWidth="3.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 15.8v22.4M14.5 23.7v9.1H24M33.8 22.7v7H24"/>
          {LOGO_NODES.map(node => <circle key={node.cx} {...node} r="4.5" fill="currentColor"/>)}
        </g>
        <rect x="19.4" y="35.8" width="9.2" height="6.3" rx="1.9" fill="var(--brand-mark-ink, #334D44)"/>
      </svg>
    </span>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="brand" aria-label="GetLaunch PH home">
      <LogoMark/>
      <span className="brand-name">GetLaunch <span>PH</span></span>
    </Link>
  );
}
