import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

// Sends through any SMTP server. To start without a domain, a Gmail account with an app
// password works (SMTP_HOST=smtp.gmail.com, SMTP_PORT=465); move to a provider with a verified
// domain before launch. Until SMTP is configured, emails are skipped and this returns false.
let transporter: Transporter | null | undefined;
function getTransporter() {
  if (transporter !== undefined) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  transporter = SMTP_HOST && SMTP_USER && SMTP_PASS
    ? nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT) || 465, secure: (Number(SMTP_PORT) || 465) === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
    : null;
  return transporter;
}

export type Email = { to: string; subject: string; lines: string[]; action?: { label: string; url: string } };

export async function sendEmail({ to, subject, lines, action }: Email) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn(`[email] SMTP is not configured; skipped "${subject}" to ${to}`);
    return false;
  }
  const text = [...lines, ...(action ? ["", `${action.label}: ${action.url}`] : []), "", "— GetLaunch PH"].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#28312e;max-width:520px">
    ${lines.map(line => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`).join("")}
    ${action ? `<p style="margin:20px 0"><a href="${escapeHtml(action.url)}" style="background:#344c43;color:#f8f7f3;padding:11px 18px;border-radius:999px;text-decoration:none;font-weight:bold">${escapeHtml(action.label)}</a></p>` : ""}
    <p style="margin:24px 0 0;color:#6b7a73">— GetLaunch PH</p></div>`;
  try {
    await mailer.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
    return true;
  } catch (error) {
    console.error(`[email] Failed to send "${subject}" to ${to}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Absolute link into the app, for emails. */
export function appUrl(path: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").toString();
}
