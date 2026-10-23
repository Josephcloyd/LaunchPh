"use client";

import { useRouter } from "next/navigation";
import { Check, Inbox, X } from "lucide-react";
import { useState, useTransition } from "react";
import { confirmPayment, rejectPayment } from "@/app/admin/actions";
import type { PendingPayment } from "@/features/admin/admin-data";
import type { MutationResult } from "@/types/workspace";

const peso = (centavos: number) => `₱${(centavos / 100).toLocaleString("en-PH")}`;
const methodLabels: Record<string, string> = { gcash: "GCash", maya: "Maya", bank: "Bank transfer" };
const when = (iso: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(iso));

export function PaymentReview({ payments }: { payments: PendingPayment[] }) {
  const router = useRouter();
  const [result, setResult] = useState<MutationResult | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<MutationResult>) {
    setResult(null);
    setBusyId(id);
    startTransition(async () => {
      const outcome = await action();
      setResult(outcome);
      setBusyId(null);
      if (outcome.ok) router.refresh();
    });
  }

  return <section className="panel glass adm-row" id="payments" aria-labelledby="payments-title">
    <div className="panel-head"><h2 id="payments-title">Payments to confirm</h2><span className="fine">Check each one arrived in your account first</span></div>
    {result && <div className={`workspace-message ${result.ok ? "success" : "error"}`} role="status">{result.message}</div>}
    {payments.length === 0 ? <div className="adm-empty"><Inbox size={22}/><p>No payments waiting. When a customer sends their GCash, Maya, or bank reference, it appears here.</p></div> :
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Order</th><th>Customer</th><th>Method and reference</th><th>Sent</th><th className="num">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}>
        <td><strong>{payment.reference}</strong><br/><span className="fine">{payment.item}{payment.projectName && ` · ${payment.projectName}`}</span></td>
        <td>{payment.customer}</td>
        <td>{methodLabels[payment.method] ?? payment.method}<br/><code className="payment-ref">{payment.customerReference}</code></td>
        <td>{when(payment.submittedAt)}</td>
        <td className="num"><strong>{peso(payment.totalCentavos)}</strong></td>
        <td><div className="adm-review-actions">
          <button className="btn btn-primary btn-small" disabled={busyId !== null} onClick={() => { if (window.confirm(`Confirm ${payment.reference}? Only do this after you’ve seen ${peso(payment.totalCentavos)} arrive with reference ${payment.customerReference}.`)) run(payment.id, () => confirmPayment(payment.id)); }}><Check size={14}/> {busyId === payment.id ? "Working…" : "Confirm"}</button>
          <button className="btn btn-secondary btn-small" disabled={busyId !== null} onClick={() => { const note = window.prompt(`Why can’t ${payment.reference} be confirmed? The customer will see this.`, "We couldn’t find this payment in our account."); if (note) run(payment.id, () => rejectPayment(payment.id, note)); }}><X size={14}/> Reject</button>
        </div></td>
      </tr>)}</tbody></table></div>}
  </section>;
}
