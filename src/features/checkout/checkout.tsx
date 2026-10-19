"use client";

import Link from "next/link";
import { BriefcaseBusiness, CreditCard, Gift, Heart, LockKeyhole, Sparkles, Store, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { checkReferralCode } from "@/app/checkout/actions";
import { checkoutProducts, type CheckoutProductKey } from "@/lib/checkout-products";
import { REFERRAL_DISCOUNT_PESOS } from "@/lib/referral";

const productIcons = { "wedding-invitation": Heart, "debut-invitation": Sparkles, "business-site": Store, "job-application-bundle": BriefcaseBusiness };
const peso = (amount: number) => `₱${amount.toLocaleString("en-PH")}`;

export function Checkout({ productKey, initialReferralCode }: { productKey: CheckoutProductKey; initialReferralCode: string | null }) {
  const product = checkoutProducts[productKey];
  const ProductIcon = productIcons[productKey];
  const monthly = product.interval === "month";
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [referralInput, setReferralInput] = useState("");
  const [referralMessage, setReferralMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, startChecking] = useTransition();
  const discount = referralCode ? Math.min(REFERRAL_DISCOUNT_PESOS, product.price) : 0;
  const total = product.price - discount;

  function applyReferral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReferralMessage(null);
    startChecking(async () => {
      const result = await checkReferralCode(referralInput);
      setReferralMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setReferralCode(result.code);
        setReferralInput("");
      }
    });
  }

  return <div className="container checkout-wrap"><h1>Secure checkout</h1><p>Complete your purchase in Philippine pesos.</p><div className="checkout-grid">
    <section className="checkout-card glass"><h2>Payment details</h2><div className="form-stack">
      <div className="name-grid">
        <div className="field"><label htmlFor="first-name">First name</label><input id="first-name" name="firstName" className="input" autoComplete="given-name" placeholder="Juan"/></div>
        <div className="field"><label htmlFor="middle-name">Middle name <span className="fine">(optional)</span></label><input id="middle-name" name="middleName" className="input" autoComplete="additional-name" placeholder="Santos"/></div>
        <div className="field"><label htmlFor="last-name">Last name</label><input id="last-name" name="lastName" className="input" autoComplete="family-name" placeholder="Dela Cruz"/></div>
      </div>
      <div className="field"><label htmlFor="email-checkout">Email address</label><input id="email-checkout" name="email" className="input" type="email" autoComplete="email" placeholder="you@example.com"/></div>
      <div className="field"><label>Payment method</label><label className="payment-choice"><input type="radio" name="payment" defaultChecked disabled/><CreditCard size={18}/><span><strong style={{display:"block", fontSize:13}}>Cards, GCash, Maya, and bank transfer</strong><span className="fine">Available after the payment provider is connected</span></span></label></div>
      <div className="notice"><LockKeyhole size={14} style={{display:"inline", marginRight:7}}/>{product.pendingMessage}</div>
      <button className="btn btn-primary" type="button" disabled>Payments coming soon</button>
      <Link className="fine" href={product.returnHref}>{product.returnLabel}</Link>
    </div></section>
    <aside className="checkout-card glass"><h2>Order summary</h2>
      <div className="order-product"><span className="order-icon"><ProductIcon size={21}/></span><div><h3>{product.name}</h3><p>{product.description}</p></div><strong>{peso(product.price)}{monthly && <small className="price-interval">/mo</small>}</strong></div>
      <p className="fine">{product.details}</p>
      <div className="summary-line"><span>{product.lineItem}</span><span>{peso(product.price)}</span></div>
      {referralCode && <div className="summary-line referral-line"><span><Gift size={13}/> Referral discount{monthly && " (first month)"} · {referralCode}<button type="button" className="referral-remove" aria-label="Remove referral code" onClick={() => { setReferralCode(null); setReferralMessage(null); }}><X size={12}/></button></span><span>−{peso(discount)}</span></div>}
      <div className="summary-line"><span>Fees</span><span>Included</span></div>
      <div className="summary-line total"><span>{monthly ? "Due today" : "Total"}</span><span>{peso(total)}</span></div>
      {monthly && <p className="fine summary-note">Then {peso(product.price)} per month. Cancel any time.</p>}
      {!referralCode && <form className="referral-form" onSubmit={applyReferral}>
        <label htmlFor="referral-code">Have a referral code?</label>
        <div><input id="referral-code" className="input" value={referralInput} onChange={event => setReferralInput(event.target.value.toUpperCase())} maxLength={8} placeholder="AB12CD34" autoComplete="off" spellCheck={false}/><button className="btn btn-secondary btn-small" type="submit" disabled={checking || referralInput.trim().length === 0}>{checking ? "Checking…" : "Apply"}</button></div>
        <span className="fine">New customers get {peso(REFERRAL_DISCOUNT_PESOS)} off with a friend’s code.</span>
      </form>}
      {referralMessage && <p className={`referral-message ${referralMessage.ok ? "success" : "error"}`} role="status">{referralMessage.text}</p>}
    </aside>
  </div></div>;
}
