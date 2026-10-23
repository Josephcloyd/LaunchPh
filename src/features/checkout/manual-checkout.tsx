"use client";

import Link from "next/link";
import { Building2, CheckCircle2, Clock3, Copy, ExternalLink, Gift, Heart, Smartphone, Sparkles, Store, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { checkReferralCode, placeOrder, submitPaymentReference } from "@/app/checkout/actions";
import { BUSINESS_GRACE_DAYS, businessPlans, checkoutProducts, type ProjectProductKey } from "@/lib/checkout-products";
import type { PaymentAccount, PaymentMethod } from "@/lib/payment-accounts";
import { REFERRAL_DISCOUNT_PESOS } from "@/lib/referral";

const productIcons = { "wedding-invitation": Heart, "debut-invitation": Sparkles, "business-site": Store };
const methodIcons = { gcash: Smartphone, maya: Smartphone, bank: Building2 };
const peso = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;
const longDate = (iso: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeZone: "Asia/Manila" }).format(new Date(iso));

export type AwaitingOrder = { reference: string; totalCentavos: number; method: PaymentMethod; customerReference: string };

type Props = {
  productKey: ProjectProductKey;
  project: { id: string; name: string };
  accounts: PaymentAccount[];
  initialReferralCode: string | null;
  liveUrl: string | null;
  paidUntil: string | null;
  awaiting: AwaitingOrder | null;
  /** Whether confirmation and reminder emails are sent (SMTP configured). */
  emailEnabled: boolean;
};

type Stage =
  | { kind: "choose" }
  | { kind: "pay"; orderId: string; reference: string; totalCentavos: number }
  | { kind: "submitted"; order: AwaitingOrder };

export function ManualCheckout({ productKey, project, accounts, initialReferralCode, liveUrl, paidUntil, awaiting, emailEnabled }: Props) {
  const product = checkoutProducts[productKey];
  const ProductIcon = productIcons[productKey];
  const isBusiness = productKey === "business-site";
  const [stage, setStage] = useState<Stage>(awaiting ? { kind: "submitted", order: awaiting } : { kind: "choose" });
  const [planSlug, setPlanSlug] = useState<string>(isBusiness ? businessPlans[0].slug : productKey);
  const [method, setMethod] = useState<PaymentMethod | null>(accounts[0]?.method ?? null);
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [referralInput, setReferralInput] = useState("");
  const [referralMessage, setReferralMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [customerReference, setCustomerReference] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const plan = isBusiness ? businessPlans.find(entry => entry.slug === planSlug) ?? businessPlans[0] : null;
  const price = plan?.price ?? product.price;
  const discount = referralCode ? Math.min(REFERRAL_DISCOUNT_PESOS, price) : 0;
  const account = accounts.find(entry => entry.method === method) ?? null;
  const invitationLive = !isBusiness && liveUrl;

  function applyReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReferralMessage(null);
    startTransition(async () => {
      const result = await checkReferralCode(referralInput);
      setReferralMessage({ ok: result.ok, text: result.message });
      if (result.ok) { setReferralCode(result.code); setReferralInput(""); }
    });
  }

  function order() {
    if (!method) return;
    setMessage(null);
    startTransition(async () => {
      const result = await placeOrder({ projectId: project.id, plan: planSlug, method, referralCode });
      if (!result.ok) { setMessage(result.message); return; }
      setStage({ kind: "pay", orderId: result.orderId, reference: result.reference, totalCentavos: result.totalCentavos });
    });
  }

  function submitReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (stage.kind !== "pay" || !method) return;
    setMessage(null);
    startTransition(async () => {
      const result = await submitPaymentReference({ orderId: stage.orderId, method, reference: customerReference });
      if (!result.ok) { setMessage(result.message); return; }
      setStage({ kind: "submitted", order: { reference: stage.reference, totalCentavos: stage.totalCentavos, method, customerReference: customerReference.trim() } });
    });
  }

  return <div className="container checkout-wrap"><h1>Checkout</h1><p>Pay by GCash, Maya, or bank transfer. We confirm your payment and publish {isBusiness ? "your site" : "your invitation"}.</p><div className="checkout-grid">
    <section className="checkout-card glass">
      {invitationLive ? <div className="checkout-done">
        <CheckCircle2 size={30}/><h2>Your invitation is live</h2>
        <p>It’s already paid for. Changes you save in the editor appear on it right away.</p>
        <a className="btn btn-primary" href={liveUrl} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open your invitation</a>
      </div> : stage.kind === "submitted" ? <div className="checkout-done">
        <Clock3 size={30}/><h2>Payment sent for confirmation</h2>
        <p>We’re checking order <strong>{stage.order.reference}</strong> ({peso(stage.order.totalCentavos / 100)}, {stage.order.method.toUpperCase()} reference {stage.order.customerReference}). {emailEnabled ? "You’ll get an email once it’s confirmed, usually within a day." : "It’s usually confirmed within a day; check your projects to see when it’s live."}</p>
        <Link className="btn btn-secondary" href="/dashboard/projects">Back to my projects</Link>
        <button type="button" className="fine checkout-link" onClick={() => { setStage({ kind: "choose" }); setCustomerReference(""); }}>Made a mistake? Start a new order</button>
      </div> : stage.kind === "pay" && account ? <form className="form-stack" onSubmit={submitReference}>
        <h2>Send your payment</h2>
        <ol className="pay-steps">
          <li>Send exactly <strong>{peso(stage.totalCentavos / 100)}</strong> to the {account.label} account below.</li>
          <li>Write <strong>{stage.reference}</strong> in the message or notes, if your app allows it.</li>
          <li>Enter the reference number from your receipt.</li>
        </ol>
        <div className="account-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- a small static QR code from /public */}
          {account.qrUrl && <img src={account.qrUrl} alt={`${account.label} QR code`} width={160} height={160}/>}
          <dl>
            {account.provider && <div><dt>Bank</dt><dd>{account.provider}</dd></div>}
            <div><dt>Account name</dt><dd>{account.accountName}</dd></div>
            <div><dt>{account.method === "bank" ? "Account number" : "Number"}</dt><dd>{account.accountNumber} <CopyButton value={account.accountNumber}/></dd></div>
            <div><dt>Amount</dt><dd>{peso(stage.totalCentavos / 100)}</dd></div>
            <div><dt>Order reference</dt><dd>{stage.reference} <CopyButton value={stage.reference}/></dd></div>
          </dl>
        </div>
        <div className="field"><label htmlFor="payment-reference">Reference number from your receipt</label><input id="payment-reference" className="input" value={customerReference} onChange={event => setCustomerReference(event.target.value)} maxLength={60} placeholder="e.g. 1234 567 890123" autoComplete="off" required/></div>
        {message && <div className="notice error-notice" role="alert">{message}</div>}
        <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "Sending…" : "I’ve paid — send for confirmation"}</button>
        <button type="button" className="fine checkout-link" onClick={() => setStage({ kind: "choose" })}>Change plan or payment method</button>
      </form> : <div className="form-stack">
        <h2>{isBusiness ? "Choose how long" : "Payment"}</h2>
        {isBusiness && paidUntil && <div className="notice">{new Date(paidUntil) > new Date() ? `Your site is paid until ${longDate(paidUntil)}. Renewing adds time after that date.` : `Your paid period ended on ${longDate(paidUntil)}. Renew to keep the site online; it goes offline ${BUSINESS_GRACE_DAYS} days after that date.`}</div>}
        {isBusiness && <div className="plan-options" role="radiogroup" aria-label="Plan length">{businessPlans.map(entry => <label key={entry.slug} className={`plan-option ${planSlug === entry.slug ? "active" : ""}`}>
          <input type="radio" name="plan" value={entry.slug} checked={planSlug === entry.slug} onChange={() => setPlanSlug(entry.slug)}/>
          <strong>{entry.months} {entry.months === 1 ? "month" : "months"}</strong>
          <span>{peso(entry.price)}</span>
          {entry.note && <em>{entry.note}</em>}
        </label>)}</div>}
        <div className="field"><span className="field-label">Pay with</span>
          {accounts.length === 0 ? <div className="notice">Payments aren’t set up yet. Please check back soon.</div> : <div className="method-options">{accounts.map(entry => {
            const Icon = methodIcons[entry.method];
            return <label key={entry.method} className={`payment-choice ${method === entry.method ? "active" : ""}`}><input type="radio" name="method" value={entry.method} checked={method === entry.method} onChange={() => setMethod(entry.method)}/><Icon size={18}/><strong>{entry.label}</strong></label>;
          })}</div>}
        </div>
        {message && <div className="notice error-notice" role="alert">{message}</div>}
        <button className="btn btn-primary" type="button" onClick={order} disabled={pending || !method}>{pending ? "Creating your order…" : `Continue · ${peso(price - discount)}`}</button>
        <Link className="fine" href={product.returnHref}>{product.returnLabel}</Link>
      </div>}
    </section>
    <aside className="checkout-card glass"><h2>Order summary</h2>
      <div className="order-product"><span className="order-icon"><ProductIcon size={21}/></span><div><h3>{product.name}</h3><p>{project.name}</p></div><strong>{peso(price)}</strong></div>
      <p className="fine">{product.details}</p>
      <div className="summary-line"><span>{plan ? `${product.lineItem}, ${plan.months} ${plan.months === 1 ? "month" : "months"}` : product.lineItem}</span><span>{peso(price)}</span></div>
      {referralCode && <div className="summary-line referral-line"><span><Gift size={13}/> Referral discount · {referralCode}{stage.kind === "choose" && <button type="button" className="referral-remove" aria-label="Remove referral code" onClick={() => { setReferralCode(null); setReferralMessage(null); }}><X size={12}/></button>}</span><span>−{peso(discount)}</span></div>}
      <div className="summary-line total"><span>Total</span><span>{peso(stage.kind === "pay" ? stage.totalCentavos / 100 : price - discount)}</span></div>
      {isBusiness && <p className="fine summary-note">Prepaid, no automatic charges. We’ll remind you before it ends.</p>}
      {stage.kind === "choose" && !invitationLive && !referralCode && <form className="referral-form" onSubmit={applyReferral}>
        <label htmlFor="referral-code">Have a referral code?</label>
        <div><input id="referral-code" className="input" value={referralInput} onChange={event => setReferralInput(event.target.value.toUpperCase())} maxLength={8} placeholder="AB12CD34" autoComplete="off" spellCheck={false}/><button className="btn btn-secondary btn-small" type="submit" disabled={pending || referralInput.trim().length === 0}>Apply</button></div>
        <span className="fine">New customers get {peso(REFERRAL_DISCOUNT_PESOS)} off with a friend’s code.</span>
      </form>}
      {referralMessage && <p className={`referral-message ${referralMessage.ok ? "success" : "error"}`} role="status">{referralMessage.text}</p>}
    </aside>
  </div></div>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" className="copy-button" aria-label={`Copy ${value}`} onClick={() => { void navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? <CheckCircle2 size={13}/> : <Copy size={13}/>}</button>;
}
