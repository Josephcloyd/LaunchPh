"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Mail } from "lucide-react";
import { useState } from "react";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { safeNextPath } from "@/lib/safe-redirect";
import { authService } from "@/services/auth";

export function AuthForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // Each Turnstile token works once: hand out the current one and ask the widget for a new one.
  function takeCaptchaToken() {
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      setSuccess(false); setMessage("Please wait a moment for the security check to finish.");
      return null;
    }
    setCaptchaToken(null);
    setCaptchaReset(count => count + 1);
    return { token: captchaToken ?? undefined };
  }

  async function submit(form: HTMLFormElement) {
    if (mode === "register" && !new FormData(form).get("acceptPolicies")) {
      setSuccess(false); setMessage("Please tick the box to agree to the Terms of Service and Privacy Policy.");
      return;
    }
    const captcha = takeCaptchaToken();
    if (!captcha) return;
    setBusy(true); setMessage(""); setSuccess(false);
    const data = new FormData(form);
    try {
      if (mode === "signin") {
        await authService.signIn(String(data.get("email")), String(data.get("password")), captcha.token);
        router.replace(safeNextPath(next));
        router.refresh();
      } else {
        const result = await authService.signUp(String(data.get("email")), String(data.get("password")), String(data.get("firstName")), String(data.get("middleName")), String(data.get("lastName")), captcha.token);
        if (result.needsEmailVerification) { setSuccess(true); setMessage("Check your email to verify your account, then sign in."); }
        else { router.replace("/dashboard"); router.refresh(); }
      }
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "We couldn’t complete that request."); }
    finally { setBusy(false); }
  }

  async function sendMagicLink() {
    if (!email) { setMessage("Enter your email address first."); return; }
    const captcha = takeCaptchaToken();
    if (!captcha) return;
    setBusy(true); setMessage("");
    try { await authService.sendMagicLink(email, captcha.token); setSuccess(true); setMessage("A secure sign-in link is on its way."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Magic link could not be sent."); }
    finally { setBusy(false); }
  }

  async function resetPassword() {
    if (!email) { setMessage("Enter your email address first."); return; }
    const captcha = takeCaptchaToken();
    if (!captcha) return;
    setBusy(true); setMessage("");
    try { await authService.sendPasswordReset(email, captcha.token); setSuccess(true); setMessage("Check your email for a password reset link."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Reset email could not be sent."); }
    finally { setBusy(false); }
  }

  return <div className="auth-card glass"><h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2><p>{mode === "signin" ? "Sign in to open your workspace." : "Start creating with GetLaunch PH for free."}</p><div className="auth-tabs"><button className={`auth-tab ${mode === "signin" ? "active" : ""}`} onClick={() => { setMode("signin"); setMessage(""); }}>Sign in</button><button className={`auth-tab ${mode === "register" ? "active" : ""}`} onClick={() => { setMode("register"); setMessage(""); }}>Register</button></div><form className="form-stack" onSubmit={event => { event.preventDefault(); void submit(event.currentTarget); }}>{mode === "register" && <div className="name-grid auth-name-grid"><div className="field"><label htmlFor="first-name">First name</label><input className="input" id="first-name" name="firstName" autoComplete="given-name" maxLength={60} placeholder="Juan" required/></div><div className="field"><label htmlFor="middle-name">Middle name</label><input className="input" id="middle-name" name="middleName" autoComplete="additional-name" maxLength={60} placeholder="Optional"/></div><div className="field"><label htmlFor="last-name">Last name</label><input className="input" id="last-name" name="lastName" autoComplete="family-name" maxLength={60} placeholder="Dela Cruz" required/></div></div>}<div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required/></div><div className="field"><div className="label-row"><label htmlFor="password">Password</label>{mode === "signin" && <button type="button" className="fine" onClick={() => void resetPassword()}>Forgot password?</button>}</div><div style={{position:"relative"}}><input className="input" id="password" name="password" type={visible ? "text" : "password"} placeholder="At least 8 characters" minLength={8} required/><button type="button" className="icon-button" style={{position:"absolute", right:3, top:3, width:40, height:40, border:0}} onClick={() => setVisible(!visible)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></div>{mode === "register" && <label className="consent-check"><input type="checkbox" name="acceptPolicies" required/><span>I agree to the <Link href="/terms" target="_blank">Terms of Service</Link> and <Link href="/privacy" target="_blank">Privacy Policy</Link>.</span></label>}<TurnstileWidget onToken={setCaptchaToken} resetSignal={captchaReset} quiet/>{message && <div className={`notice ${success ? "auth-success" : ""}`} role="status">{success && <CheckCircle2 size={15}/>} {message}</div>}<button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create free account"} {!busy && <ArrowRight size={16}/>}</button></form><div className="divider">or</div><button className="btn btn-secondary" style={{width:"100%"}} disabled={busy} onClick={() => void sendMagicLink()}><Mail size={16}/> Email me a magic link</button>{mode === "signin" && <p className="fine" style={{margin:"14px 0 0", textAlign:"center"}}>By signing in, you agree to our <Link href="/terms">Terms of Service</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>}</div>;
}
