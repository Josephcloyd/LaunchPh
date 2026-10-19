import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to your GetLaunch PH account." };

export default async function AuthPage({ searchParams }: PageProps<"/auth">) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/dashboard";
  return <main className="site-shell auth-page"><section className="auth-story"><Brand/><div className="auth-quote"><p className="eyebrow">A simpler way to create</p><h1>Bring your next idea to life.</h1><p>Your projects, templates, and published work—all in one calm, secure workspace.</p></div><p className="fine">Core security is included with every account.</p></section><section className="auth-form-wrap"><div style={{width:"min(440px, 100%)"}}><Link className="fine" href="/">← Back to home</Link><div style={{height:20}}/><AuthForm next={next}/></div></section></main>;
}
