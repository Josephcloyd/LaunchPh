"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="site-shell" style={{display:"grid", placeItems:"center", padding:20}}><div className="glass" style={{padding:32, borderRadius:24, textAlign:"center", maxWidth:440}}><h1>Something needs another try.</h1><p className="muted" style={{margin:"13px 0 22px"}}>Your work is safe. Refresh this part of GetLaunch PH to continue.</p><button className="btn btn-primary" onClick={reset}>Try again</button></div></main>;
}
