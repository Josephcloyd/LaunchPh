"use client";

import { Download, Images } from "lucide-react";
import { useState } from "react";

type DebutSouvenirProps = {
  celebrantName: string;
  displayDate: string;
  message: string;
  photoAlbumUrl: string;
  guestName?: string;
};

const CARD = { width: 1080, height: 1350 };
const INK = "#2d463c";
const SOFT = "#6f7e77";

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

// Draws the keepsake as a portrait image (Instagram-story friendly) so guests
// can save it to their phones.
function drawKeepsake(props: DebutSouvenirProps) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f7f5ee";
  ctx.fillRect(0, 0, CARD.width, CARD.height);
  ctx.strokeStyle = "#c9cfc9";
  ctx.lineWidth = 3;
  ctx.strokeRect(48, 48, CARD.width - 96, CARD.height - 96);
  ctx.strokeRect(62, 62, CARD.width - 124, CARD.height - 124);

  ctx.textAlign = "center";
  const center = CARD.width / 2;

  ctx.strokeStyle = "#7f958a";
  ctx.beginPath();
  ctx.arc(center, 230, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#536d61";
  ctx.font = "italic 64px Georgia, serif";
  ctx.fillText(props.celebrantName.charAt(0) || "D", center - 10, 252);
  ctx.font = "600 26px Georgia, serif";
  ctx.fillText("18", center + 34, 214);

  ctx.fillStyle = SOFT;
  ctx.font = "600 28px Arial, sans-serif";
  ctx.fillText("A KEEPSAKE FROM THE DEBUT OF", center, 400);

  ctx.fillStyle = INK;
  ctx.font = "92px Georgia, serif";
  const nameLines = wrapLines(ctx, props.celebrantName || "Celebrant", 900);
  nameLines.forEach((line, index) => ctx.fillText(line, center, 520 + index * 104));
  let y = 520 + nameLines.length * 104;

  ctx.fillStyle = "#50675d";
  ctx.font = "600 32px Arial, sans-serif";
  ctx.fillText(props.displayDate.toUpperCase(), center, y + 10);

  ctx.strokeStyle = "#c9cfc9";
  ctx.beginPath();
  ctx.moveTo(center - 160, y + 80);
  ctx.lineTo(center + 160, y + 80);
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = "italic 50px Georgia, serif";
  y += 170;
  ctx.fillText(props.guestName ? `Thank you, ${props.guestName}` : "Thank you", center, y);

  ctx.fillStyle = SOFT;
  ctx.font = "38px Georgia, serif";
  y += 80;
  for (const line of wrapLines(ctx, props.message, 820).slice(0, 7)) {
    ctx.fillText(line, center, y);
    y += 56;
  }

  ctx.fillStyle = "#93a198";
  ctx.font = "600 22px Arial, sans-serif";
  ctx.fillText("Made by GetLaunch PH", center, CARD.height - 100);
  return canvas;
}

export function DebutSouvenir(props: DebutSouvenirProps & { preview?: boolean }) {
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    const canvas = drawKeepsake(props);
    if (!canvas) { setSaving(false); return; }
    canvas.toBlob(blob => {
      setSaving(false);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = props.celebrantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "debut";
      link.href = url;
      link.download = `${slug}-debut-keepsake.png`;
      link.click();
      // Revoking immediately can cancel the download in some browsers.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
  }

  return <section className="debut-souvenir" aria-labelledby="souvenir-title">
    <p className="souvenir-eyebrow">Digital souvenir</p>
    <h2 id="souvenir-title">A keepsake for you</h2>
    {props.preview && <p className="souvenir-preview-note">Guests see this section from the debut date onward. Guests opening their private RSVP link see their own name on the card.</p>}
    <div className="keepsake-card">
      <div className="monogram">{props.celebrantName.charAt(0) || "D"}<sup>18</sup></div>
      <p className="keepsake-kicker">A keepsake from the debut of</p>
      <h3>{props.celebrantName || "Celebrant"}</h3>
      <p className="keepsake-date">{props.displayDate.toUpperCase()}</p>
      <p className="keepsake-thanks">{props.guestName ? `Thank you, ${props.guestName}` : "Thank you"}</p>
      {props.message && <p className="keepsake-message">{props.message}</p>}
    </div>
    <div className="souvenir-actions">
      <button type="button" className="souvenir-btn primary" onClick={save} disabled={saving}><Download size={16} aria-hidden="true"/>{saving ? "Preparing…" : "Save keepsake"}</button>
      {props.photoAlbumUrl && <a className="souvenir-btn" href={props.photoAlbumUrl} target="_blank" rel="noreferrer"><Images size={16} aria-hidden="true"/> View the photos</a>}
    </div>
  </section>;
}
