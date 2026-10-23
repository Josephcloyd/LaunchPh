import type { Metadata } from "next";
import { LegalContact, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", description: "How GetLaunch PH collects, uses, and protects your personal data under the Data Privacy Act of 2012." };

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" current="/privacy" summary="What personal data GetLaunch PH collects, why, who we share it with, and the rights you have under the Data Privacy Act of 2012 (Republic Act No. 10173).">
    <p>GetLaunch PH is responsible for the personal data in your account, orders, and messages to us. When you add your guests’ details to an invitation, we handle that information on your behalf to provide your invitation.</p>

    <h2>1. What we collect</h2>
    <ul>
      <li><strong>Your account:</strong> your first, middle, and last name, your email address, and your password. Passwords are stored securely by our sign-in provider in a form no one can read, including us.</li>
      <li><strong>What you create:</strong> invitation details (names, event date, venue, map link, story, souvenir message, and photo album link), business website details (business name, contact details, address, hours, and social media links), your guest list (guest names and party sizes), and your guests’ RSVP responses (whether they’re coming, how many, and any meal notes).</li>
      <li><strong>Orders and payments:</strong> what you bought, the amount, the order reference, your payment method, and the reference number from your GCash or Maya receipt. You pay in your own GCash or Maya app, so we never receive your PIN, password, or card details.</li>
      <li><strong>Inquiries and support:</strong> what you send through our forms. For custom websites, that’s your name, email, phone number, business name, budget, preferred meeting time, and message. For the Job Application Bundle, it’s your name, email, phone number, target role, experience level, the services you want, job posting and LinkedIn links, and message. We also keep the support requests you send from your dashboard.</li>
      <li><strong>Technical data:</strong> a scrambled (hashed) version of your IP address, used briefly to stop repeated or automated submissions; information our bot check processes to tell people from bots; and a history of account activity shown in your dashboard.</li>
    </ul>

    <h2>2. Why we use it</h2>
    <ul>
      <li>To provide what you signed up for or bought: your account, editor, invitations, websites, and RSVP links.</li>
      <li>To check payments, keep order records, and meet tax and accounting rules.</li>
      <li>To answer your inquiries and support requests, and to remind you before a business website plan ends.</li>
      <li>To keep GetLaunch PH secure and prevent fraud, spam, and abuse.</li>
    </ul>
    <p>We don’t sell your personal data, show ads, or use advertising or analytics trackers.</p>

    <h2>3. What’s public</h2>
    <p>Drafts are private to your account. When you publish an invitation, anyone with its link can view it; we ask search engines not to list invitations. A published business website is public. Each guest’s RSVP link is private: it shows the invitation with only that guest’s name and response.</p>

    <h2>4. Who we share it with</h2>
    <p>We use trusted service providers to run GetLaunch PH. They handle data only to provide their service to us:</p>
    <ul>
      <li><strong>Supabase</strong>, for our database and sign-in;</li>
      <li>our <strong>website hosting provider</strong>;</li>
      <li><strong>Cloudflare</strong>, for the bot check on our forms and sign-in;</li>
      <li><strong>Google</strong>, whose maps load on business websites that show a map;</li>
      <li><strong>GCash and Maya</strong>, when you pay us through them (their own privacy policies apply to your use of their apps); and</li>
      <li>an <strong>email provider</strong>, when we send you emails about your account or orders.</li>
    </ul>
    <p>Some of these providers may store data outside the Philippines. We choose providers that protect data with appropriate safeguards. We may also disclose information when the law requires it.</p>

    <h2>5. Cookies and browser storage</h2>
    <ul>
      <li><strong>Sign-in cookies</strong> keep you signed in. The site doesn’t work without them.</li>
      <li><strong>Referral cookie</strong> (“launchph_ref”), when you open a friend’s referral link, remembers their code for 30 days so your discount is applied at checkout.</li>
      <li><strong>Session storage</strong> remembers that you’ve seen the opening animation, until you close the tab.</li>
    </ul>
    <p>We don’t use advertising or analytics cookies.</p>

    <h2>6. How long we keep it</h2>
    <ul>
      <li><strong>Account and content:</strong> while your account is open. If you ask us to delete your account, we delete your account and content within 30 days, and your published pages go offline.</li>
      <li><strong>Order and payment records:</strong> as long as Philippine tax and accounting rules require, even after your account is deleted. We keep only what’s needed for those records.</li>
      <li><strong>Inquiries:</strong> up to 12 months after our last contact with you.</li>
      <li><strong>Scrambled IP records</strong> used to limit repeated submissions: deleted automatically within a few days.</li>
    </ul>
    <p>Copies in backups may remain for a short time before they are overwritten.</p>

    <h2>7. How we protect it</h2>
    <p>All connections use HTTPS. Access controls ensure each customer can see only their own data, and only authorized administrators can review orders and requests. Forms and sign-in are protected against bots and repeated attempts. No system is perfectly secure, but if a breach affects your personal data, we will notify you and the National Privacy Commission as the law requires.</p>

    <h2>8. Your rights</h2>
    <p>Under the Data Privacy Act, you have the right to:</p>
    <ul>
      <li>be informed about how your personal data is used;</li>
      <li>access the personal data we hold about you;</li>
      <li>correct inaccurate data;</li>
      <li>object to processing, and have your data blocked or erased;</li>
      <li>receive a copy of your data in a format you can reuse;</li>
      <li>be compensated for damages caused by misuse of your data; and</li>
      <li>file a complaint with the National Privacy Commission (privacy.gov.ph).</li>
    </ul>
    <p>You can update most account details yourself in your dashboard settings. For anything else, contact us using the details below. We may ask you to confirm your identity before acting on a request.</p>

    <h2>9. Children and your guests</h2>
    <p>You must be 18 or older to create an account, or use GetLaunch PH with a parent or guardian. Guest lists may include minors. Only add guests’ details that you have permission to share. We use your guests’ details only to run your invitation, and a guest can ask you or us to remove their details.</p>

    <h2>10. Changes to this policy</h2>
    <p>We’ll post any changes on this page with a new “last updated” date. For significant changes, we’ll also tell you in your dashboard.</p>

    <h2>11. Contact us</h2>
    <p>For questions about your personal data or to exercise your rights:</p>
    <LegalContact/>
  </LegalPage>;
}
