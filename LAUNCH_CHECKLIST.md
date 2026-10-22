# GetLaunch PH launch checklist

Last audited: 2026-10-20, against branch `feature/premium-redesign` (commit `5ea4493`).
This replaces `LAUNCH_READINESS.md`, which predates the debut, business-site, referral, and admin work.

**How to use this file**

- Work through the phases in order. Finish a phase's **exit check** before starting the next one.
- `[x]` means it was verified in the code during the audit. `[ ]` means it still needs doing.
- **Dev** = code or Supabase work. **Owner** = a business decision, account, or document only you can provide.
- 🔴 = launch blocker. Do not take real customers until every 🔴 item is done.

## Launch blockers at a glance

| # | Blocker | Phase |
|---|---|---|
| 1 | Five database tables have no Row Level Security, so anyone with the public key can read or change them, including visitor contact messages | 0 |
| 2 | A signed-in user can publish a paid invitation or business site for free by calling Supabase directly | 0 |
| 3 | The login `next` parameter allows redirects to other websites | 0 |
| 4 | No security headers (CSP, HSTS, frame protection) | 0 |
| 5 | Public forms and RSVP have no rate limiting or bot protection | 0 |
| 6 | No payment provider: checkout cannot charge, so nothing can be sold | 2 |
| 7 | Supabase's built-in email sender is limited to a handful of messages per hour, which breaks sign-up and password reset at launch | 1 |
| 8 | Terms of Service and Privacy Policy don't exist, but the sign-up form says users agree to them | 5 |
| 9 | No automated tests for sign-up, payment, or publishing | 7 |

---

## Phase 0 — Critical security fixes

Goal: close the holes that would let someone read private data or get paid products for free. Do these first; they are small.

### Database access

- [ ] 🔴 **Dev** — Enable Row Level Security on `products`, `pricing_plans`, `add_ons`, `domains`, and `contact_submissions`. They are created in `supabase/migrations/202610080001_initial_schema.sql` but never get `enable row level security`. Add a new migration that enables it, then add:
  - public **read-only** policies for `products`, `pricing_plans`, and `add_ons` (prices shown on the site)
  - owner/admin-only policies for `domains` and `contact_submissions` (`contact_submissions` holds visitors' names, emails, and messages)

  Written in `supabase/migrations/202610220001_phase0_security_lockdown.sql` and tested in a local Postgres. Still needs applying to the Supabase project.
- [ ] 🔴 **Dev** — Block publishing without payment. Today `setProjectPublished` in `src/app/dashboard/actions.ts` refuses to publish weddings and business sites, but the RLS policies `projects owner access` and `published sites owner access` let an owner set `projects.status = 'published'` and `published_sites.is_live = true` directly through the Supabase API. Fix it like this:
  - Remove owners' ability to change those two columns, using column privileges or a trigger.
  - Publish only through a `security definer` function, or a server-side service-role call, that first confirms a paid order (or an active subscription for business sites).

  Written in the same migration: triggers block owners from publishing paid project types, and `publish_project()` checks the new `order_items.project_id` / `subscriptions.project_id` columns for payment. Checkout (Phase 2) must set those columns when it creates an order or subscription.
- [ ] 🔴 **Dev** — Open Supabase Dashboard → Advisors → Security and fix every warning it lists on the production project.
- [ ] 🔴 **Dev** — Two-account isolation test. With accounts A and B, confirm B cannot read or change A's:
  - profiles, projects, revisions, wedding events, and guests
  - RSVPs, orders, support tickets, notifications, and referral codes

  Test both through the app and directly against the Supabase REST API using B's session.
- [x] `roles` has RLS with no policies, so only the `is_admin()` function can read it.
- [x] Public invitation, business-site, and RSVP data is served through `security definer` functions that are `grant`ed only to what they need.

### Application security

- [x] Open redirect after login fixed. `safeNextPath` in `src/lib/safe-redirect.ts` accepts only same-site paths and rejects `//`, `\`, and whitespace tricks. Used by `src/app/auth/page.tsx` and `src/features/auth/auth-form.tsx`.
- [x] Security headers added in `next.config.ts`:
  - `Content-Security-Policy`: allows Supabase (`connect-src`) and the Google Maps embed (`frame-src`). The JSON-LD block is a data block, so it needs no exception.
  - `Strict-Transport-Security` (production only, without `preload`)
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `frame-ancestors 'none'`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
- [ ] **Dev** — Later: `script-src` still allows `'unsafe-inline'`, because Next.js's inline hydration scripts need it without per-request nonces, and nonces would make every page dynamic. Move to a nonce CSP in `src/proxy.ts` if you want stronger XSS protection at that cost.
- [ ] **Dev** — When the domain is final and every subdomain serves HTTPS, add `; preload` to HSTS and submit it at hstspreload.org.
- [ ] 🔴 **Dev** — Rate-limit anonymous submissions:
  - custom-website inquiry
  - job-application inquiry
  - RSVP submission
  - support tickets

  Add Cloudflare Turnstile, or an equivalent, to the two public inquiry forms.
- [ ] 🔴 **Dev** — In Supabase Auth settings, review rate limits for sign-up, magic links, and password resets, and turn on CAPTCHA protection.
- [ ] **Dev** — Turn on leaked-password protection and set a minimum password length in Supabase Auth. The form already asks for 8+ characters.
- [ ] **Dev** — `SUPABASE_SERVICE_ROLE_KEY` is not used anywhere in `src/`. Don't add it to the production host until code needs it, and never in a `NEXT_PUBLIC_` variable.
- [ ] **Dev** — Run `npm audit`. Production dependencies are clean today; 5 high-severity advisories are in dev-only tooling. Update them when fixes are available.
- [x] Every editor and form Server Action validates input with Zod and checks project ownership on the server (`studio/wedding`, `studio/business`, `dashboard`, `support`, `rsvp`, `custom-website`, `job-application-bundle`).
- [x] RSVP links use 32 random bytes, and only their SHA-256 hash is stored.
- [x] `/admin` checks `is_admin()` on the server and returns 404 to non-admins. `/dashboard` and `/admin` require sign-in in `src/proxy.ts`.
- [x] `.env.local` is git-ignored, and no secrets are committed.
- [x] No unsafe HTML rendering (`dangerouslySetInnerHTML` is used only for escaped JSON-LD).

**Exit check:** Supabase Security Advisor shows no errors. Account B can't see or change account A's data, even through the REST API. An unpaid project can't be made public by any route. `/auth?next=//example.com` stays on the site.

---

## Phase 1 — Production database, auth, and email delivery

Goal: a separate, backed-up production environment where sign-up and password reset actually reach people.

- [ ] 🔴 **Dev** — Create a separate Supabase project for production, so it doesn't share data with development.
- [ ] 🔴 **Dev** — Apply all migrations in filename order and confirm each one succeeds:
  1. `202610080001_initial_schema.sql`
  2. `202610080002_workspace_sessions.sql`
  3. `202610090001_repair_user_profiles.sql`
  4. `202610090002_website_inquiries_and_resume_price.sql`
  5. `202610100001_split_person_names.sql`
  6. `202610140001_wedding_drafts_and_publication.sql`
  7. `202610140002_rsvp_portal.sql`
  8. `202610140003_job_application_inquiries.sql`
  9. `202610190001_debut_business_sites_referrals.sql`
  10. `202610190002_debut_digital_souvenirs.sql`
  11. `202610220001_phase0_security_lockdown.sql`
- [ ] 🔴 **Dev + Owner** — Set up custom SMTP in Supabase Auth (e.g. Resend, Postmark, or Amazon SES) with a verified sending domain. Supabase's default sender is limited to a few emails per hour and is meant for testing only.
- [ ] **Dev** — Brand the Supabase auth email templates (confirm sign-up, magic link, reset password) with GetLaunch PH wording.
- [ ] 🔴 **Dev** — Add the production domain to Supabase Auth's Site URL and redirect allowlist, then test sign-up confirmation, magic link, and password reset on the real domain.
- [ ] **Dev** — Turn on daily backups (and point-in-time recovery if the plan allows), then restore one backup into a throwaway project to prove it works.
- [ ] **Owner + Dev** — Agree on how someone becomes an admin. Today it's a manual row in `roles`; write down who can add one and record it in `audit_logs`.
- [ ] **Dev** — Seed `products` and `pricing_plans` with the real prices: ₱799 wedding, ₱999 debut, ₱299/month business site, ₱499 Job Application Bundle.

**Exit check:** On production, a new person can register, confirm their email, sign in, reset their password, and sign out, and the emails arrive within a minute.

---

## Phase 2 — Payments and entitlements

Goal: take real money safely, and unlock exactly what was paid for.

- [ ] 🔴 **Owner** — Choose a Philippine payment provider that supports what checkout promises: cards, GCash, Maya, and bank transfer (e.g. PayMongo, Xendit, Maya Business). Complete its business verification.
- [ ] 🔴 **Owner** — Register the business (DTI/SEC and BIR) as the provider requires, and decide how official receipts or invoices are issued.
- [ ] 🔴 **Dev** — Create orders on the server using prices from the database. Never trust an amount or discount sent by the browser.
- [ ] 🔴 **Dev** — Apply the ₱50 referral discount on the server: call `check_referral_code` again at order time, allow it once per new customer, and record it in `orders.referral_code` / `discount_centavos`.
- [ ] 🔴 **Dev** — Verify webhook signatures with `PAYMENT_WEBHOOK_SECRET`. Process each event once, even if the provider retries it.
- [ ] 🔴 **Dev** — Mark the order paid and unlock publishing only from a verified webhook, never from the browser's success page.
- [ ] 🔴 **Dev** — Business site ₱299/month:
  - recurring billing in `subscriptions`
  - renewal
  - a failed-payment grace period, after which the site is automatically unpublished
  - customer cancellation
- [ ] **Owner + Dev** — Decide how the Job Application Bundle (₱499) is paid. Today `/job-application-bundle` only collects an inquiry; there's no payment step.
- [ ] **Dev** — Handle failed, expired, cancelled, refunded, and partially refunded payments, and show each correctly in `/dashboard/billing` and `/admin`.
- [ ] **Dev** — Test:
  - double-clicking pay
  - retried and delayed webhooks
  - a forged webhook
  - the wrong amount
  - the wrong currency
- [ ] **Owner** — Write the refund policy (Phase 5), then do one live low-value payment and refund together.

**Exit check:** One sandbox payment unlocks exactly one project; a failed or forged payment unlocks nothing; the referral discount can't be used twice.

---

## Phase 3 — Product functionality, end to end

Goal: every product on the pricing page does what the page promises. Test each as a brand-new customer on a phone and a computer.

### Wedding invitation — Evergreen Vows (₱799)

- [ ] **Dev** — Create the project, then edit names, date, venue, and story; confirm it autosaves.
- [ ] **Dev** — Refresh, sign in on another browser, and confirm nothing is lost.
- [ ] **Dev** — Preview on mobile and desktop.
- [ ] **Dev** — Pay → publish → public link `/wedding/[slug]` loads for a logged-out visitor.
- [ ] **Dev** — Update a detail after publishing; the live page changes.
- [ ] **Dev** — Unpublish; the public link stops working immediately.
- [ ] **Dev** — Guests:
  - add a guest and set the party-size limit
  - create a private RSVP link
  - accept and decline as the guest
  - the response shows on the owner's dashboard
  - "New link" invalidates the old one
- [ ] **Dev** — "Duplicate project" copies only the project row today (`duplicateProject` in `src/app/dashboard/actions.ts`). Make it copy the invitation content too, or rename it so it doesn't promise a full copy.

### Debut invitation (₱999)

- [ ] **Dev** — Everything in the wedding list, using the celebrant's name.
- [ ] **Dev** — Digital souvenirs work: a keepsake card for every guest, and the photo-album link opens.
- [ ] **Owner** — Decide whether debut links should keep the `/wedding/` path or get their own `/debut/` path.

### Business website (₱299/month)

- [ ] **Dev** — Edit every field: services, hours, phone, email, address, socials.
- [ ] **Dev** — The Google Map embeds and "Get directions" opens the right place.
- [ ] **Dev** — Facebook, Instagram, and TikTok links accept only real profile URLs.
- [ ] **Dev** — Start the subscription → `/site/[slug]` is live; cancel or fail payment → site goes offline after the grace period.

### Services

- [ ] **Dev + Owner** — Job Application Bundle: the inquiry reaches the admin inbox, and there's a written process for delivering the resume review, cover-letter guidance, LinkedIn feedback, and interview notes.
- [ ] **Dev + Owner** — Custom Website: the consultation request reaches the admin inbox, and someone replies within the promised time.
- [ ] **Dev** — Add admin actions to change an inquiry's or ticket's status (new → contacted → closed). The admin page is read-only today.

### Other features

- [ ] **Dev** — Referral flow:
  - `/r/CODE` saves the code
  - checkout pre-fills it
  - the discount applies once
  - the referrer's code shows in their dashboard
- [ ] **Dev** — Free Builders: every tool marked "live" works; others are clearly "coming soon".
- [ ] **Dev** — Resume studio: `NEXT_PUBLIC_RESUME_BUILDER_URL` points to a working site, or the link is removed.
- [ ] **Dev** — `/dashboard/templates` reads the `templates` table, which is empty. Either add the three real designs there or hide that page.
- [ ] **Dev** — Test `/admin` signed in as an admin against the real database. The redesign was only checked with sample data.

**Exit check:** A brand-new account can buy and receive each product without a developer's help.

---

## Phase 4 — Notifications and support operations

Goal: nothing a customer sends goes unseen.

- [ ] **Dev** — Email the admin when a custom-website inquiry, job-application inquiry, or support ticket arrives. They're only visible in `/admin` today.
- [ ] **Dev** — Email customers:
  - a payment receipt
  - a "your invitation is live" message with the link
  - subscription renewal or failure notices
  - an acknowledgement for inquiries and tickets
- [ ] **Owner** — Set a support response time, an inbox someone checks daily, and a Facebook Messenger reply routine (the site sends people to Facebook to message you).
- [ ] **Dev** — Error monitoring (`SENTRY_DSN` or similar) on the server and in the browser.
- [ ] **Dev** — Uptime checks for:
  - the home page
  - sign-in
  - one public invitation
  - the payment webhook

**Exit check:** A test purchase and a test inquiry each produce the right emails, and a deliberate error shows up in monitoring.

---

## Phase 5 — Legal, privacy, and trust (Philippines)

Goal: meet legal obligations and give customers confidence.

- [ ] 🔴 **Owner** — Terms of Service page.
- [ ] 🔴 **Owner** — Privacy Policy covering the Data Privacy Act of 2012 (RA 10173):
  - what personal data is collected (names, emails, phone numbers, guest lists, RSVPs)
  - why it's collected
  - how long it's kept
  - who processes it (Supabase, payment provider, email provider)
  - how to request deletion
- [ ] 🔴 **Owner** — Refund policy for one-time purchases and the monthly plan.
- [ ] 🔴 **Dev** — Add `/terms`, `/privacy`, and `/refunds` pages. Link them from the footer and from the sign-up text in `src/features/auth/auth-form.tsx`, which already says users agree to them.
- [ ] **Owner** — Check whether NPC registration or a Data Protection Officer is required for your scale. Get a legal review before public launch.
- [ ] **Dev** — Account deletion and data export for customers.
- [ ] **Dev** — Cookie notice if analytics is added (the referral cookie is functional, but mention it in the Privacy Policy).
- [ ] **Owner** — Real contact details on the site: business email, and an address if required.

**Exit check:** Policies are published and linked, and a user can request and complete account deletion.

---

## Phase 6 — Brand, content, and SEO

Goal: the public site is accurate and shares well, especially on Facebook.

- [ ] 🔴 **Owner** — Confirm the production domain. The code assumes `launchph.ph` (sitemap fallback, hero mock-up, template preview URLs, `docs/WEDDING_MVP_SPEC.md`), while the brand is "GetLaunch PH".
- [ ] **Dev** — Set `NEXT_PUBLIC_APP_URL` to the production domain. Sitemap, Open Graph tags, and redirects depend on it.
- [ ] **Dev** — Add an Open Graph share image (`src/app/opengraph-image.tsx`). Today links shared on Facebook show no preview picture.
- [ ] **Owner** — Review all marketing copy, including:
  - problem section
  - FAQs
  - template sample names ("Lea Santos & Miguel Reyes", "Bea Villanueva", "Kape Kalye")
- [ ] **Owner** — Confirm the payment FAQ answer ("cards, GCash, Maya, and bank transfer") matches the provider chosen in Phase 2.
- [ ] **Owner** — Real photos and testimonials when available. Only publish genuine ones.
- [ ] **Dev** — Remove `/auth` from `src/app/sitemap.ts`; login pages shouldn't be indexed.
- [ ] **Owner + Dev** — Verify the site in Google Search Console and submit the sitemap.
- [ ] **Dev** — Private invitations should not appear in Google: add `noindex` on `/wedding/[slug]`, `/rsvp/[token]`, and `/site/[slug]` unless the customer opts in.
- [x] Facebook page linked from the home page, templates page, and footer.
- [x] `robots.txt`, `sitemap.xml`, and Organization/FAQ structured data exist.

**Exit check:** Sharing the home page on Facebook shows the right title, description, and image, and every price and promise matches across home, templates, checkout, and FAQs.

---

## Phase 7 — Quality: tests, accessibility, performance

Goal: prove it works before real customers find the bugs.

- [ ] 🔴 **Dev** — Add a test framework (there's no `test` script in `package.json` yet). Unit-test:
  - price and discount calculation
  - referral rules
  - webhook verification
  - name formatting
  - date handling
- [ ] 🔴 **Dev** — Playwright end-to-end tests:
  - register → create project → edit → pay (sandbox) → publish → guest RSVP
  - sign-out
  - a non-admin opening `/admin`
  - user B opening user A's project ID
- [ ] **Dev** — GitHub Actions: run `npm run lint`, `npx tsc --noEmit`, tests, and `npm run build` on every pull request.
- [ ] **Dev** — Keyboard-only and screen-reader pass on sign-up, the editors, checkout, and RSVP.
- [ ] **Dev** — Device check at 320 px, a mid-range Android phone, iPhone Safari, tablet, and desktop (Chrome, Safari, Firefox, Edge).
- [ ] **Dev** — Lighthouse on mobile for the home and templates pages. Target good Core Web Vitals; the 3D hero is lazy-loaded and skipped on weak devices.
- [ ] **Owner** — Have 3 people who've never seen the site buy and publish an invitation without help, and note where they get stuck.
- [x] Production build, TypeScript, and ESLint all pass.
- [x] Home, templates, and admin pages checked on desktop and mobile with no console errors or sideways scrolling.

**Exit check:** CI is green, the end-to-end purchase test passes on staging, and the three testers finish unaided.

---

## Phase 8 — Deploy and launch

Goal: go live carefully and watch closely.

- [ ] **Dev** — Set production environment variables only in the hosting dashboard:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `PAYMENT_PROVIDER`
  - `PAYMENT_SECRET_KEY`
  - `PAYMENT_WEBHOOK_SECRET`
  - `EMAIL_PROVIDER_API_KEY`
  - `SENTRY_DSN`
- [ ] **Dev** — Deploy a staging copy first, with the payment sandbox and email sandbox, and run Phase 7's tests there.
- [ ] **Owner + Dev** — Point the domain's DNS at the host, confirm HTTPS, and register the production webhook URL with the payment provider.
- [ ] **Dev** — Merge `feature/premium-redesign` into `main` through a pull request, so `main` is the deployed version.
- [ ] **Owner** — Soft launch to friends, family, and your Facebook followers before paid promotion.
- [ ] **Owner + Dev** — First week, daily:
  - sign-up failures
  - save errors
  - checkout conversion
  - webhook errors
  - support messages
  - refunds
- [ ] **Dev** — Know how to roll back to the previous deployment in one click.

**Exit check:** Real customers have paid, received their invitation or site, and money in the provider matches orders in `/admin`.

---

## Suggested order for the next few work sessions

1. Phase 0 security migration: RLS on the five tables, and lock publishing behind payment.
2. Open-redirect fix and security headers.
3. Production Supabase project, custom SMTP, and auth redirect URLs.
4. Choose the payment provider (owner) while the developer builds server-side orders and webhooks.
5. Legal pages (owner drafts, developer adds the routes).
6. End-to-end tests for the wedding purchase, then soft launch with the wedding invitation first. Add debut and business once the wedding path is proven.
