import { LogoMark } from "@/components/brand";

export default function Loading() {
  return <main className="site-shell" style={{display:"grid", placeItems:"center"}}><div className="glass" style={{padding:28, borderRadius:22, textAlign:"center"}}><LogoMark className="loading-brand-mark"/><p>Preparing your workspace…</p></div></main>;
}
