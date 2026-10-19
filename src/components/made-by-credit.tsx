import Link from "next/link";

// Shown on every public customer page so each guest or visitor can find us.
export function MadeByCredit({ prefix, className = "published-wedding-credit" }: { prefix?: string; className?: string }) {
  return <p className={className}>{prefix && <>{prefix} · </>}<Link className="made-by-link" href="/">Made by GetLaunch PH</Link></p>;
}
