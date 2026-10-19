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
    lineItem: "Business website (monthly)",
    price: 299,
    interval: "month",
    details: "Includes your business page with contact details, opening hours, an embedded Google Map, social media links, hosting, HTTPS, and updates any time. Cancel any time.",
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

export function resolveCheckoutProduct(value: string | string[] | undefined): CheckoutProductKey {
  return typeof value === "string" && Object.hasOwn(checkoutProducts, value) ? value as CheckoutProductKey : "wedding-invitation";
}
