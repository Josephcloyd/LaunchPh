import type { Metadata } from "next";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Refund Policy", description: "When and how GetLaunch PH refunds invitations and business website plans." };

export default function RefundsPage() {
  return <LegalPage title="Refund Policy" current="/refunds" summary="When you can get your money back, and how to ask.">
    <div className="legal-summary">
      <p><strong>In short:</strong></p>
      <ul>
        <li>Invitations: full refund within 7 days of payment, for any reason.</li>
        <li>Business website plans: prepaid time isn’t refundable.</li>
        <li>Duplicate, extra, or mistaken payments are always returned.</li>
      </ul>
    </div>

    <h2>1. Wedding and debut invitations</h2>
    <p>You can get a full refund within 7 days of the day we confirm your payment, for any reason. When we refund an invitation, we unpublish it, so its link and RSVP links stop working. Your content stays in your account.</p>
    <p>After 7 days, invitations aren’t refundable, except if we can’t deliver (see section 4).</p>

    <h2>2. Business website plans</h2>
    <p>Business website plans are prepaid, and prepaid months aren’t refundable, including if you stop using the site before the plan ends. Your site stays online until the date it’s paid until, plus 7 more days. There are no automatic charges, so nothing more is taken unless you choose to renew.</p>

    <h2>3. Always refunded</h2>
    <ul>
      <li>Duplicate payments for the same order.</li>
      <li>Payments above the order total (we return the difference).</li>
      <li>Payments for an order we declined, once we find the money arrived.</li>
      <li>Money sent to us by mistake, once we confirm it.</li>
    </ul>

    <h2>4. If we can’t deliver</h2>
    <p>If something you paid for doesn’t work because of a problem on our side that we can’t fix within 7 days, we refund the invitation in full, or the unused time on a business website plan.</p>

    <h2>5. Services arranged one to one</h2>
    <p>For the Job Application Bundle and custom websites, refunds follow the terms we agree with you in writing before you pay.</p>

    <h2>6. How to ask for a refund</h2>
    <p>Contact us with your order reference (it starts with “GL-”) and the GCash or Maya account you paid from:</p>
    <LegalContact/>
    <p>We’ll reply within 3 business days. Approved refunds are sent to the account you paid from within 7 days, for the full amount; we cover any transfer fees.</p>

    <p className="fine">This policy doesn’t limit any rights you have under Philippine consumer protection laws.</p>
  </LegalPage>;
}
