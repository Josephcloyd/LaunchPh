"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { refundOrder, updateRequestStatus } from "@/app/admin/actions";
import type { MutationResult } from "@/types/workspace";

function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<MutationResult | null>(null);
  const run = (action: () => Promise<MutationResult>) => startTransition(async () => {
    const outcome = await action();
    setResult(outcome);
    if (outcome.ok) router.refresh();
  });
  return { pending, result, run };
}

export function RequestStatusSelect({ kind, id, status, options }: { kind: string; id: string; status: string; options: string[] }) {
  const { pending, result, run } = useAdminAction();
  return <span className="adm-status-control">
    <select className="select adm-status-select" aria-label="Request status" value={status} disabled={pending} onChange={event => run(() => updateRequestStatus(kind, id, event.target.value))}>
      {options.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
    {result && !result.ok && <span className="adm-inline-error" role="alert">{result.message}</span>}
  </span>;
}

export function RefundButton({ id, reference, total }: { id: string; reference: string; total: string }) {
  const { pending, result, run } = useAdminAction();
  return <span className="adm-status-control">
    <button className="btn btn-secondary btn-small" disabled={pending} onClick={() => {
      if (!window.confirm(`Refund ${reference} (${total})? Send the money back by GCash or Maya first. A refunded invitation is unpublished.`)) return;
      const note = window.prompt("Reason for the refund (the customer sees this):", "Refund requested within 7 days.");
      if (note) run(() => refundOrder(id, note));
    }}><RotateCcw size={13}/> {pending ? "Refunding…" : "Refund"}</button>
    {result && <span className={result.ok ? "adm-inline-ok" : "adm-inline-error"} role="status">{result.message}</span>}
  </span>;
}
