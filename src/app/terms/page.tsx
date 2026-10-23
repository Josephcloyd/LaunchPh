import type { Metadata } from "next";
import Link from "next/link";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service", description: "The terms for using GetLaunch PH and buying invitations and business websites." };

export default function TermsPage() {
  return <LegalPage title="Terms of Service" current="/terms" summary="The rules for using GetLaunch PH, in plain language. By creating an account or buying from us, you agree to them.">
    <h2>1. About GetLaunch PH</h2>
    <p>GetLaunch PH (“we”, “us”) provides online tools to create wedding and debut invitations, one-page business websites, and related services. We operate from the Philippines. These terms apply when you visit our website, create an account, or buy anything from us. If you don’t agree with them, please don’t use GetLaunch PH.</p>

    <h2>2. Who can use GetLaunch PH</h2>
    <p>You must be at least 18 years old to create an account or buy. If you are under 18, you may use GetLaunch PH with a parent or guardian who agrees to these terms for you and is responsible for any purchase.</p>

    <h2>3. Your account</h2>
    <ul>
      <li>Give accurate details and keep them up to date.</li>
      <li>Keep your password private. You are responsible for what happens in your account.</li>
      <li>Tell us right away if you think someone else has used your account.</li>
    </ul>

    <h2>4. What we sell</h2>
    <ul>
      <li><strong>Wedding invitation (₱799) and debut invitation (₱999).</strong> A one-time payment for one hosted invitation, including the editor, its web link, and private RSVP links for your guests. It stays online until you unpublish or delete it. If we ever close the service, we’ll give at least 30 days’ notice.</li>
      <li><strong>Business website.</strong> Prepaid for 1, 3, 6, or 12 months (₱299 per month; 12 months is ₱2,990). There are no automatic charges. Your dashboard shows the date your site is paid until, and we remind you before it ends. If you don’t renew, the site stays online for 7 more days and then goes offline. We keep its content so you can renew later, unless you delete it or your account.</li>
      <li><strong>Job Application Bundle and custom websites.</strong> Arranged one to one after you send an inquiry. We agree on the price and what’s included in writing before you pay.</li>
      <li><strong>Free tools.</strong> Free to use as they are, with no guarantee.</li>
    </ul>
    <p>Prices are in Philippine pesos and may change. A price change never affects an order you’ve already paid for.</p>

    <h2>5. Paying</h2>
    <ul>
      <li>You pay by GCash, Maya, or another method shown at checkout, into the account shown there. Only send money to the accounts shown on our checkout page.</li>
      <li>Send the exact amount, then enter the reference number from your receipt. We check that the payment arrived before confirming it, usually within one business day. Your invitation or website is published once we confirm.</li>
      <li>We may decline an order if we can’t find the payment, the amount is different, or the reference number was already used for another order. We’ll tell you why and return any money we received from you.</li>
      <li>Your confirmed payments are listed under Billing in your dashboard.</li>
    </ul>
    <p>Refunds are covered by our <Link href="/refunds">Refund Policy</Link>.</p>

    <h2>6. Referral discounts</h2>
    <p>A new customer who uses another customer’s referral code gets ₱50 off their first purchase. Each new customer can use one code once. Discounts have no cash value. We may change or end the referral program, and we may cancel discounts gained by misuse, such as fake accounts.</p>

    <h2>7. Your content</h2>
    <p>You own what you create on GetLaunch PH: names, text, links, and other details. You allow us to store, display, and publish it as needed to provide the service, including public pages you choose to publish. You confirm you have the right to use everything you add, including permission from the guests whose names you add to your guest list.</p>
    <p>A published invitation can be viewed by anyone who has its link. A published business website is public.</p>

    <h2>8. Content you may not publish</h2>
    <p>Do not use GetLaunch PH to publish or send anything that:</p>
    <ul>
      <li>is illegal, or infringes someone else’s rights, such as copyright or trademarks;</li>
      <li>impersonates a person or business, or misleads people, such as scams or fake offers;</li>
      <li>is hateful, harassing, or sexually explicit, or involves minors in any harmful way;</li>
      <li>shares other people’s personal information without their permission; or</li>
      <li>contains malware or tries to collect passwords or payment details.</li>
    </ul>
    <p>We may remove such content, unpublish the page, or suspend the account. Paid services removed for breaking these rules are not refunded, except where the law requires.</p>

    <h2>9. Fair use and security</h2>
    <p>Do not try to access other people’s accounts or data, disrupt or overload the service, get around its limits, bot checks, or payment steps, or use automated tools to abuse it.</p>

    <h2>10. Availability and changes</h2>
    <p>We work to keep GetLaunch PH running smoothly, but we can’t promise it will always be available or free of errors. We may improve or change features. If a change significantly affects something you’ve paid for, we’ll tell you in advance.</p>

    <h2>11. Our responsibility</h2>
    <p>As far as the law allows, GetLaunch PH is provided as it is. We are not responsible for indirect losses, such as missed guests or lost business. Our total responsibility for any claim is limited to the amount you paid us in the 12 months before the claim. Nothing in these terms limits your rights under the Consumer Act of the Philippines (Republic Act No. 7394) or any other law that can’t be waived.</p>

    <h2>12. Ending your use</h2>
    <p>You can stop using GetLaunch PH at any time and ask us to delete your account; see our <Link href="/privacy">Privacy Policy</Link>. We may suspend or close accounts that break these terms.</p>

    <h2>13. Changes to these terms</h2>
    <p>We’ll post any changes on this page with a new “last updated” date. For significant changes, we’ll also tell you in your dashboard. If you keep using GetLaunch PH after a change, you accept the updated terms.</p>

    <h2>14. Governing law</h2>
    <p>These terms are governed by the laws of the Republic of the Philippines. If there’s a problem, please contact us first so we can try to fix it together. Disputes that can’t be resolved that way will be settled by the proper courts of the Philippines.</p>

    <h2>15. Contact us</h2>
    <LegalContact/>
  </LegalPage>;
}
