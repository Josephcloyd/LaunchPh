# GetLaunch PH SaaS launch roadmap

This checklist is ordered by dependency. Do not move to the next phase until the current phase's exit gate passes. The first paid MVP is the ₱799 Evergreen Vows wedding invitation defined in `docs/WEDDING_MVP_SPEC.md`. The Job Application Bundle is a guided service; its separate self-service resume builder, portfolio automation, business-site automation, custom domains, and template importing are outside this initial paid release.

## Current baseline

- [x] Next.js production build succeeds.
- [x] TypeScript and ESLint checks succeed.
- [x] Supabase URL, anonymous key, and server service-role key are configured locally.
- [x] Authenticated dashboard and database-backed project management exist.
- [x] Profile names are stored as first, optional middle, and last name.
- [ ] Automated tests exist.
- [ ] Editor content persists to the database.
- [ ] Publishing produces a real public site.
- [ ] Checkout charges through a real payment provider.
- [ ] Transactional email and production monitoring are configured.

## Phase 1 — Freeze the paid MVP

Goal: define exactly what the first paying customer can buy and receive.

- [x] Choose the launch product: Evergreen Vows wedding invitation.
- [x] Write the exact included features and ₱799 one-time price.
- [x] Remove non-launch features from checkout promises and label deferred editor features.
- [x] Define the customer journey: landing page → registration → project → editor → payment → delivery.
- [x] Define proposed refund, cancellation, support, and data-retention rules for legal review.

Exit gate: a one-page product specification describes the complete first-customer journey with no undecided steps.

## Phase 2 — Database and identity readiness

Goal: make production data predictable and recoverable.

- [ ] Create separate Supabase development and staging/production projects.
- [ ] Apply every migration in `supabase/migrations/` in filename order, including `202610100001_split_person_names.sql`.
- [ ] Verify registration stores `first_name`, `middle_name`, and `last_name` correctly.
- [ ] Verify login, logout, magic link, password reset, and email verification.
- [ ] Test Row Level Security with two accounts: neither account can read or mutate the other's profiles, projects, revisions, orders, files, tickets, or notifications.
- [ ] Create a controlled process for granting the `admin` role.
- [ ] Back up the database and perform one restore into a disposable project.
- [ ] Confirm `.env.local` and all service-role secrets are excluded from Git.

Exit gate: two-account isolation passes, authentication recovery works, and a database restore has been demonstrated.

## Phase 3 — Protect privileged and public operations

Goal: close authorization and abuse gaps before adding payments.

- [ ] Protect `/admin` on the server and require `roles.role = 'admin'`; never rely on hidden navigation.
- [ ] Recheck authorization inside every admin action and every Server Action.
- [ ] Add rate limits to registration, magic links, password resets, consultation requests, support requests, RSVP, and uploads.
- [ ] Add bot protection to anonymous forms if rate-limit telemetry shows abuse.
- [ ] Add secure response headers: CSP, HSTS in production, frame restrictions, MIME sniffing protection, and a referrer policy.
- [ ] Validate file MIME signatures, sizes, ownership paths, and upload quotas before accepting uploads.
- [ ] Keep uploads private until scanning/moderation succeeds.
- [ ] Record sensitive admin changes in `audit_logs` and security events in `security_events`.

Exit gate: anonymous users cannot access admin data, cross-account requests fail, and repeated public submissions are throttled.

## Phase 4 — Make the product save real work

Goal: ensure users never lose editor changes.

- [ ] Load wedding content using the authenticated project ID.
- [ ] Confirm the project belongs to the signed-in user on the server.
- [ ] Save editor content to versioned `project_revisions` or the relevant product table.
- [ ] Add debounced autosave with clear saving, saved, offline, and failed states.
- [ ] Restore the latest saved revision after refresh, logout/login, and another-device login.
- [ ] Make duplicate project copy its content and settings, not only the project row.
- [ ] Add revision conflict handling so a stale browser cannot silently overwrite newer content.
- [ ] Add image/file uploads only after private Storage policies are tested.

Exit gate: edit a project, refresh the page, sign in on another browser, and see the exact same content without data loss.

## Phase 5 — Deliver the purchased outcome

Goal: make each launch product produce what the customer paid for.

Wedding checks:

- [ ] Publish an immutable project revision rather than only changing the project status.
- [ ] Serve a real public invitation URL from the active published revision.
- [ ] Make unpublish immediately remove public access.
- [ ] Implement guest tokens, RSVP storage, and owner-only guest management if included in MVP.
- [ ] Set correct indexing/privacy rules for public and private invitations.

Exit gate: a fresh account can create, save, and receive the real final artifact without developer intervention.

## Phase 6 — Payments and entitlements

Goal: charge safely and unlock products only after verified payment.

- [ ] Select a Philippine-capable provider and complete its test-account verification.
- [ ] Create pending orders on the server using database prices; never trust totals from the browser.
- [ ] Redirect to or initialize the provider using a server-created payment session.
- [ ] Verify webhook signatures using `PAYMENT_WEBHOOK_SECRET`.
- [ ] Process webhooks idempotently so retries cannot duplicate orders or entitlements.
- [ ] Mark orders paid and grant access only after a verified provider event.
- [ ] Handle failed, expired, cancelled, refunded, and partially refunded payments.
- [ ] Replace the current browser-only checkout success state.
- [ ] Test duplicate clicks, webhook retries, delayed webhooks, wrong amounts, and wrong currencies.
- [ ] Reconcile provider transactions against GetLaunch PH orders.

Exit gate: one provider test payment unlocks exactly one entitlement; failed or forged payments unlock nothing.

## Phase 7 — Email, support, and operations

Goal: make the service operable without watching the database manually.

- [ ] Configure an email provider and verified sending domain.
- [ ] Send payment receipt, purchase confirmation, password/auth messages, consultation acknowledgement, and support acknowledgement.
- [ ] Add retry handling and delivery-status logging for transactional email.
- [ ] Route consultation and support notifications to an actively monitored inbox.
- [ ] Configure error monitoring using `SENTRY_DSN` or an equivalent provider.
- [ ] Add uptime checks for the home page, authentication, public publishing, and payment webhook.
- [ ] Create an incident checklist for payment failure, database outage, email outage, and compromised credentials.
- [ ] Define support response expectations and an escalation contact.

Exit gate: a staged purchase generates the expected emails, errors appear in monitoring, and an operator can trace the order end-to-end.

## Phase 8 — Legal, privacy, accessibility, and trust

Goal: satisfy launch obligations and remove avoidable customer risk.

- [ ] Publish real Terms of Service, Privacy Policy, Refund Policy, and contact details.
- [ ] Document collected personal data, purpose, retention period, processors, and deletion process.
- [ ] Add account/data deletion and export workflows.
- [ ] Obtain legal review appropriate for Philippine customers and the Data Privacy Act.
- [ ] Check keyboard navigation, focus visibility, labels, error messages, contrast, and screen-reader output.
- [ ] Test responsive layouts at 320 px, common mobile sizes, tablet, laptop, and large desktop.
- [ ] Add accessible pending states and prevent double submission on every form.
- [ ] Confirm pricing, currency, inclusions, and limitations are consistent across landing, marketplace, and checkout.

Exit gate: policies are published, a user can request deletion, and the critical purchase flow passes keyboard-only and mobile testing.

## Phase 9 — Automated tests and staging release

Goal: prove the whole system works before production traffic arrives.

- [ ] Add unit tests for validation, name formatting, pricing, entitlement, and webhook logic.
- [ ] Add integration tests for Server Actions and database authorization failures.
- [ ] Add Playwright end-to-end tests for registration, login, project creation, autosave, purchase, delivery, settings, and logout.
- [ ] Run negative tests for unauthenticated access, non-admin admin access, cross-user project IDs, invalid webhooks, and malicious inputs.
- [ ] Run `npm run lint`, `npx tsc --noEmit`, tests, and `npm run build` in CI on every pull request.
- [ ] Deploy staging with production-like Supabase, payment sandbox, email sandbox, and monitoring.
- [ ] Complete a manual browser matrix on current Chrome, Safari, Firefox, Edge, iOS Safari, and Android Chrome.
- [ ] Have at least three people complete the first-customer journey without instructions.

Exit gate: CI is green, all critical end-to-end tests pass in staging, and no launch-blocking issue remains.

## Phase 10 — Production launch and first-week checks

Goal: release gradually and verify real-world behavior.

- [ ] Configure the production domain, HTTPS, Supabase redirect allowlist, webhook URL, and email domain.
- [ ] Confirm production secrets are set only in the deployment platform.
- [ ] Run a low-value real payment and refund with the business owner.
- [ ] Verify the production database backup schedule and monitoring alerts.
- [ ] Launch to a small invited group before public promotion.
- [ ] Review sign-up failures, editor save failures, checkout conversion, webhook errors, support requests, and refunds daily.
- [ ] Keep a rollback procedure and the previous known-good deployment available.
- [ ] Promote publicly only after invited users complete purchases successfully.

Exit gate: real users complete the paid journey, money reconciles, delivery works, and support can resolve issues from logs.

## Required release commands

Run these locally and in CI:

```powershell
npm run lint
npx tsc --noEmit
npm test
npm run build
```

`npm test` is intentionally a launch blocker until a test framework and test suite are added.

## Recommended immediate sprint

Work on these in order:

1. Freeze the launch product and paid feature set.
2. Apply and verify all Supabase migrations.
3. Protect `/admin` and add authorization tests.
4. Persist one editor end-to-end.
5. Implement its real output: published invitation or downloadable PDF.
6. Add provider-backed checkout and verified webhook handling.
7. Add transactional email, monitoring, and Playwright coverage.
8. Complete legal/staging checks, then invite a small beta group.
