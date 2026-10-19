import Link from "next/link";
import { Brand } from "@/components/brand";
import { PasswordForm } from "@/features/dashboard/password-form";

export default function ResetPasswordPage() {
  return <main className="site-shell auth-page"><section className="auth-story"><Brand/><div className="auth-quote"><p className="eyebrow">Account recovery</p><h1>Choose a new password.</h1><p>Use a strong password you don’t reuse elsewhere.</p></div><p className="fine">Your recovery session is handled securely by Supabase.</p></section><section className="auth-form-wrap"><div className="auth-card glass"><h2>Reset password</h2><p>Enter at least eight characters.</p><PasswordForm/><Link className="fine" style={{display:"block", marginTop:18, textAlign:"center"}} href="/auth">Return to sign in</Link></div></section></main>;
}
