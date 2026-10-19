"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function ReferralShare({ code, link }: { code: string; link: string }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  function copy(value: string, kind: "code" | "link") {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(kind);
      window.setTimeout(() => setCopied(current => current === kind ? null : current), 2000);
    });
  }

  return <div className="referral-share">
    <div className="referral-code-row"><strong>{code}</strong><button type="button" className="btn btn-secondary btn-small" onClick={() => copy(code, "code")}>{copied === "code" ? <Check size={14}/> : <Copy size={14}/>} {copied === "code" ? "Copied" : "Copy code"}</button></div>
    <div className="referral-link-row"><input className="input" value={link} readOnly aria-label="Your referral link" onFocus={event => event.target.select()}/><button type="button" className="btn btn-primary btn-small" onClick={() => copy(link, "link")}>{copied === "link" ? <Check size={14}/> : <Copy size={14}/>} {copied === "link" ? "Copied" : "Copy link"}</button></div>
  </div>;
}
