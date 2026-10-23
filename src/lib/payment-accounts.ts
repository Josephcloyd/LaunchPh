import "server-only";

export type PaymentMethod = "gcash" | "maya" | "bank";

export type PaymentAccount = {
  method: PaymentMethod;
  label: string;
  /** Bank name, for bank transfers. */
  provider: string | null;
  accountName: string;
  accountNumber: string;
  /** Optional QR code image in /public, e.g. "/payments/gcash-qr.png" (the CSP allows same-site images only). */
  qrUrl: string | null;
};

const env = (name: string) => process.env[name]?.trim() || null;

// The accounts customers pay into, from environment variables so personal numbers stay out of
// the repository. A method appears at checkout only when its name and number are both set.
export function configuredPaymentAccounts(): PaymentAccount[] {
  const accounts: (PaymentAccount | null)[] = [
    account("gcash", "GCash", null, env("PAYMENT_GCASH_NAME"), env("PAYMENT_GCASH_NUMBER"), env("PAYMENT_GCASH_QR_URL")),
    account("maya", "Maya", null, env("PAYMENT_MAYA_NAME"), env("PAYMENT_MAYA_NUMBER"), env("PAYMENT_MAYA_QR_URL")),
    account("bank", "Bank transfer (InstaPay)", env("PAYMENT_BANK_NAME"), env("PAYMENT_BANK_ACCOUNT_NAME"), env("PAYMENT_BANK_ACCOUNT_NUMBER"), env("PAYMENT_BANK_QR_URL")),
  ];
  return accounts.filter((entry): entry is PaymentAccount => entry !== null);
}

function account(method: PaymentMethod, label: string, provider: string | null, accountName: string | null, accountNumber: string | null, qrUrl: string | null): PaymentAccount | null {
  if (!accountName || !accountNumber) return null;
  return { method, label, provider, accountName, accountNumber, qrUrl: qrUrl && /^\/[\w./-]+$/.test(qrUrl) && !qrUrl.includes("..") ? qrUrl : null };
}
