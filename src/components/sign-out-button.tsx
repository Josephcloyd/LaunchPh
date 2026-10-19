"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { authService } from "@/services/auth";

type SignOutButtonProps = {
  className?: string;
  compact?: boolean;
  onSignedOut?: () => void;
};

export function SignOutButton({ className = "btn btn-secondary btn-small", compact = false, onSignedOut }: SignOutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await authService.signOut();
      onSignedOut?.();
      router.replace("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={className} onClick={() => void signOut()} disabled={busy} aria-label={compact ? "Sign out" : undefined} title={compact ? "Sign out" : undefined}>
      {compact ? <LogOut size={16}/> : busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
