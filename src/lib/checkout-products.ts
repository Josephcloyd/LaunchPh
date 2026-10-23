export const checkoutProducts = {
  "wedding-invitation": {
    name: "Evergreen Vows",
    description: "One hosted wedding invitation",
    lineItem: "Wedding invitation",
    price: 799,
    interval: null,
    details: "Includes the visual editor, one GetLaunch PH invitation link, private guest RSVP links, publishing updates, HTTPS, secure sign-in, and project ownership protection.",
    returnHref: "/dashboard/projects",
    returnLabel: "Return to my projects",
    pendingMessage: "Secure checkout is being connected. No payment has been collected and publishing remains locked.",
  },
  "debut-invitation": {
    name: "Debut Invitation",
    description: "One hosted debut invitation",
    lineItem: "Debut invitation",
    price: 999,
    interval: null,
    details: "Includes the visual editor, one GetLaunch PH invitation link, private guest RSVP links, digital souvenirs (a keepsake card for every guest and a photo album link), publishing updates, HTTPS, secure sign-in, and project ownership protection.",
    returnHref: "/dashboard/projects",
    returnLabel: "Return to my projects",
    pendingMessage: "Secure checkout is being connected. No payment has been collected and publishing remains locked.",
  },
  "business-site": {
    name: "Business Website",
    description: "One-page website for your business",
    lineItem: "Business website",
    price: 499,
    interval: "month",
    details: "Includes your business page with contact details, opening hours, an embedded Google Map, social media links, hosting, HTTPS, and updates any time. Prepaid: choose how many months, and we’ll remind you before it ends.",
    returnHref: "/dashboard/projects",
    returnLabel: "Return to my projects",
    pendingMessage: "Secure checkout is being connected. No payment has been collected and publishing remains locked.",
  },
  "job-application-bundle": {
    name: "Job Application Bundle",
    description: "One guided application-support package",
    lineItem: "Job application support",
    price: 499,
    interval: null,
    details: "Includes a resume review, tailored cover letter guidance, LinkedIn feedback, portfolio positioning, and optional interview-preparation notes.",
    returnHref: "/job-application-bundle",
    returnLabel: "Return to bundle details",
    pendingMessage: "Secure checkout is being connected. No payment has been collected and your service request remains unconfirmed.",
  },
} as const;

export type CheckoutProductKey = keyof typeof checkoutProducts;

// Prices shown at checkout. Orders are always priced by the database (pricing_plans, seeded in
// 202610230003_manual_payments.sql, repriced in 202610230005_business_site_499.sql), so keep these in sync with it.
export const businessPlans = [
  { slug: "business-site-1m", months: 1, price: 499, note: null },
  { slug: "business-site-3m", months: 3, price: 1497, note: null },
  { slug: "business-site-6m", months: 6, price: 2994, note: null },
  { slug: "business-site-12m", months: 12, price: 4990, note: "2 months free" },
] as const;
export type BusinessPlanSlug = (typeof businessPlans)[number]["slug"];

/** Products bought for a specific project, paid by GCash, Maya, or bank transfer. */
export const projectProducts = ["wedding-invitation", "debut-invitation", "business-site"] as const;
export type ProjectProductKey = (typeof projectProducts)[number];
export const isProjectProduct = (key: CheckoutProductKey): key is ProjectProductKey => (projectProducts as readonly string[]).includes(key);

/** Business sites stay online this many days after the paid period ends. */
export const BUSINESS_GRACE_DAYS = 7;

export function resolveCheckoutProduct(value: string | string[] | undefined): CheckoutProductKey {
  return typeof value === "string" && Object.hasOwn(checkoutProducts, value) ? value as CheckoutProductKey : "wedding-invitation";
}
