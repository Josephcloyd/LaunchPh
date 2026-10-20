"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Re-runs the admin page's server queries without a full reload. */
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="btn btn-primary btn-small" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
    <RefreshCcw size={15} className={pending ? "spin" : ""}/> {pending ? "Refreshing…" : "Refresh"}
  </button>;
}
