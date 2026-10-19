"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";
import { getSupabaseBrowserClient } from "@/services/supabase-browser";

const links = [
  ["Home", "/"],
  ["Templates", "/templates"],
  ["Products", "/#products"],
  ["Free Builders", "/free-builders"],
  ["About", "/#about"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "signed-in" | "signed-out">("loading");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      queueMicrotask(() => setAuthState("signed-out"));
      return;
    }
    void supabase.auth.getSession().then(({ data }) => setAuthState(data.session ? "signed-in" : "signed-out"));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setAuthState(session ? "signed-in" : "signed-out"));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-wrap glass">
        <Brand />
        <nav className="nav-links" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link key={label} href={href}>{label}</Link>)}
        </nav>
        <div className="nav-actions">
          {authState === "loading" ? <span className="auth-actions-loading" aria-label="Checking account session"/> : authState === "signed-in" ? <>
            <SignOutButton onSignedOut={() => setAuthState("signed-out")}/>
            <Link className="btn btn-primary btn-small" href="/dashboard">Dashboard</Link>
          </> : <>
            <Link className="btn btn-secondary btn-small" href="/auth">Sign in</Link>
            <Link className="btn btn-primary btn-small" href="/templates">Start creating</Link>
          </>}
          <button className="menu-button icon-button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-menu glass" aria-label="Mobile navigation">
          {links.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
          {authState === "signed-in" ? <><Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link><SignOutButton className="mobile-signout" onSignedOut={() => { setAuthState("signed-out"); setOpen(false); }}/></> : <Link href="/auth" onClick={() => setOpen(false)}>Sign in</Link>}
        </nav>
      )}
    </header>
  );
}
