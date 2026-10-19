"use client";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="workspace-page"><div className="workspace-error"><h1>We couldn’t load your workspace.</h1><p>Your projects are safe. Check your connection and try again.</p><button className="btn btn-primary btn-small" onClick={reset}>Try again</button></div></div>;
}
