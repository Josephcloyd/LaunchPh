# GetLaunch PH

GetLaunch PH is a Philippine-focused workspace for wedding invitations, portfolios, small-business websites, and guided job-application support. This repository contains the responsive Next.js foundation, customer and administrator dashboards, template marketplace, wedding editor and RSVP portal, service-intake flows, development checkout, Supabase schema, and template import library. The self-service resume builder is maintained separately at `resume.launchph.ph`.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without external credentials the app runs in clearly marked development mode: sign-in, publishing, export, import, and checkout interactions remain explorable but do not claim to create external records or charges.

## Configure Supabase

1. Create a Supabase project.
2. Apply the files in `supabase/migrations/` in filename order with the Supabase CLI or SQL editor. Existing projects that already ran the initial schema should next run `202610080002_workspace_sessions.sql`.
3. Copy the project URL and publishable/anon key into `.env.local`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it through a `NEXT_PUBLIC_` variable.
5. Configure private Storage buckets for project files, wedding photos, and template sources. Enforce ownership with storage policies that mirror the project RLS rules.

The included schema uses UUIDs, foreign keys, indexes, ownership policies, admin checks, safe guest-token hashes, payment idempotency keys, and private file paths. Public invitations should resolve guest tokens on the server and must never expose raw guest identifiers.

## Add a template sample

1. Put the source in the matching `template-library/<product>/samples/` folder.
2. Put supplied images and fonts in `assets/`, and an approved thumbnail in `previews/`.
3. Open `/admin`, choose **Import template**, and select PDF, DOCX, PNG, JPG, HTML, CSS, or ZIP.
4. Review extracted metadata and keep the template in Draft or Mapping status.
5. Define editable fields and layout regions in a versioned manifest, validate the preview, then publish.

Images and PDFs are references, not automatically editable layouts. HTML must be sanitized and previewed in a script-disabled sandbox. Uploaded source files should be validated by MIME signature, size-limited, malware scanned, and stored privately.

## Pricing and payments

Prices are stored in `pricing_plans` and editable by administrators. The included checkout shows the initial ₱799 wedding product and optional ₱200 Enhanced Security Package. Core security remains included for every customer.

Connect a Philippine-capable payment provider behind a server-only adapter. Create orders as pending, verify signed webhooks, use the stored idempotency key, then grant the project entitlement only after a verified paid event. Never use the browser success state as proof of payment and never store card credentials.

## Production deployment on Vercel

1. Push the repository to your Git provider and import it in Vercel.
2. Add the variables from `.env.example` in project settings.
3. Set `NEXT_PUBLIC_APP_URL` to the canonical production origin.
4. Configure Supabase authentication redirect URLs and payment webhooks for that origin.
5. Run `npm run build` before release, then test sign-in, RLS isolation, uploads, payment retries, refunds, PDF pagination, private invitation indexing, and webhook idempotency in staging.

## Important routes

- `/` — public landing page and pricing
- `/templates` — searchable template marketplace
- `/auth` — Supabase-aware sign-in and registration
- `/dashboard` — customer projects and account overview
- `/admin` — revenue, customers, and template import
- `/studio/wedding` — live wedding and debut invitation editor (₱799 wedding, ₱999 debut)
- `/studio/business` — one-page business website editor (₱499/month)
- `/site/[slug]` — published business website (indexable)
- `/r/[code]` — referral share link; remembers the code for checkout (₱50 off a new customer's first purchase)
- `/job-application-bundle` — guided career-application service intake
- `/studio/resume` — legacy redirect to the separate resume-builder subdomain
- `/checkout` — order summary and optional security add-on

## Security and reliability checklist

- Keep core protection free: HTTPS, authentication, authorization, RLS, safe processing, and abuse controls.
- Validate and escape every input on the server, even when it was validated in the browser.
- Restrict file types, sizes, upload frequency, and storage paths; quarantine unscanned content.
- Rate-limit public RSVP, contact, and upload endpoints. Add CAPTCHA only where abuse warrants it.
- Record administrator mutations in `audit_logs` and important access activity in `security_events`.
- Back up PostgreSQL and Storage, document recovery targets, and regularly restore into staging.
- Keep wedding guest data and customer-supplied application materials private with short-lived signed URLs.

## Current implementation boundary

The customer workspace uses authenticated Supabase sessions, server-verified identity, RLS-filtered project data, persistent preferences, and database-backed support records. Project management supports create, rename, duplicate, publish/unpublish, and delete operations. Production payment capture, email delivery, file scanning, QR generation, custom domains, and shared-site publishing still require their provider credentials and server-side adapters before launch. The interface labels unavailable integrations honestly until they are connected.
