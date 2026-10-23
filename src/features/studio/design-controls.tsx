"use client";
/* eslint-disable @next/next/no-img-element -- previews of the owner's own uploads */

import { ArrowLeft, ArrowRight, Check, ImagePlus, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { discardPhoto } from "@/app/studio/photo-actions";
import { uploadPhoto } from "@/lib/photo-upload";
import { isSamplePhoto, photoUrl } from "@/lib/site-design";

type UploadContext = { userId: string; projectId: string };

/** Deletes a removed photo from storage unless the draft still uses it elsewhere. */
function release(context: UploadContext, path: string, stillUsed: string[]) {
  if (path && !isSamplePhoto(path) && !stillUsed.includes(path)) void discardPhoto(context.projectId, path);
}

export function PhotoField({ label, help, value, onChange, context, otherPhotos, shape = "wide", maxEdge = 1600 }: {
  label: string; help?: string; value: string; onChange: (path: string) => void; context: UploadContext;
  /** Other photos in the same draft, so a shared photo isn't deleted. */
  otherPhotos: string[]; shape?: "wide" | "square"; maxEdge?: number;
}) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function choose(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError("");
    const result = await uploadPhoto(file, context.userId, maxEdge);
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    release(context, value, otherPhotos);
    onChange(result.path);
  }

  return <div className="field design-photo-field">
    <label htmlFor={inputId}>{label}</label>
    <div className={`design-photo ${shape} ${value ? "has-photo" : ""}`}>
      {value ? <img src={photoUrl(value)} alt=""/> : <button type="button" className="design-photo-empty" onClick={() => input.current?.click()} disabled={busy}>{busy ? <LoaderCircle className="spin" size={20}/> : <ImagePlus size={20}/>}<span>{busy ? "Uploading…" : "Upload a photo"}</span></button>}
      {value && isSamplePhoto(value) && <span className="design-sample-badge">Sample photo</span>}
      {busy && value && <span className="design-photo-busy"><LoaderCircle className="spin" size={20}/></span>}
    </div>
    {value && <div className="design-photo-actions">
      <button type="button" onClick={() => input.current?.click()} disabled={busy}><RefreshCw size={13}/> Replace</button>
      <button type="button" className="danger" onClick={() => { release(context, value, otherPhotos); onChange(""); }} disabled={busy}><Trash2 size={13}/> Remove</button>
    </div>}
    <input ref={input} id={inputId} className="visually-hidden" type="file" accept="image/*" onChange={event => { void choose(event.target.files?.[0]); event.target.value = ""; }}/>
    {error ? <span className="field-error" role="alert">{error}</span> : help && <span className="field-help">{help}</span>}
  </div>;
}

export function GalleryField({ value, onChange, context, otherPhotos, max }: {
  value: string[]; onChange: (paths: string[]) => void; context: UploadContext; otherPhotos: string[]; max: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const hasSamples = value.some(isSamplePhoto);

  async function add(files: FileList | null) {
    const chosen = [...(files ?? [])].slice(0, max - value.length);
    if (!chosen.length) return;
    setError(""); setUploading(chosen.length);
    let paths = value;
    for (const file of chosen) {
      const result = await uploadPhoto(file, context.userId, 1400);
      setUploading(count => count - 1);
      if (!result.ok) { setError(result.message); continue; }
      paths = [...paths, result.path];
      onChange(paths);
    }
  }
  function remove(index: number) {
    const next = value.filter((_, i) => i !== index);
    release(context, value[index], [...next, ...otherPhotos]);
    onChange(next);
  }
  function move(index: number, by: number) {
    const next = [...value];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    onChange(next);
  }

  return <div className="field">
    <span className="design-label">Photo gallery <span className="fine">({value.length}/{max})</span></span>
    <div className="design-gallery">
      {value.map((path, index) => <figure key={`${index}-${path}`}>
        <img src={photoUrl(path)} alt=""/>
        <div className="design-gallery-tools">
          <button type="button" aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, -1)}><ArrowLeft size={12}/></button>
          <button type="button" aria-label="Move later" disabled={index === value.length - 1} onClick={() => move(index, 1)}><ArrowRight size={12}/></button>
          <button type="button" aria-label="Remove photo" className="danger" onClick={() => remove(index)}><Trash2 size={12}/></button>
        </div>
      </figure>)}
      {Array.from({ length: uploading }, (_, index) => <figure key={`uploading-${index}`} className="uploading"><LoaderCircle className="spin" size={18}/></figure>)}
      {value.length + uploading < max && <button type="button" className="design-gallery-add" onClick={() => input.current?.click()}><ImagePlus size={18}/><span>Add photos</span></button>}
    </div>
    <input ref={input} className="visually-hidden" type="file" accept="image/*" multiple aria-label="Add gallery photos" onChange={event => { void add(event.target.files); event.target.value = ""; }}/>
    {error ? <span className="field-error" role="alert">{error}</span> : <span className="field-help">{hasSamples ? "These are sample photos. Remove them and add your own." : "Use the arrows to change the order. Photos are resized automatically."}</span>}
  </div>;
}

export function SwatchPicker<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly { id: T; name: string; swatch: readonly string[] }[]; value: T; onChange: (id: T) => void;
}) {
  return <div className="field">
    <span className="design-label">{label}</span>
    <div className="design-swatches" role="radiogroup" aria-label={label}>
      {options.map(option => <button key={option.id} type="button" role="radio" aria-checked={value === option.id} className={value === option.id ? "active" : ""} onClick={() => onChange(option.id)}>
        <span className="design-swatch" style={{ background: `linear-gradient(135deg, ${option.swatch[0]} 0 50%, ${option.swatch[1]} 50% 100%)` }}><i style={{ background: option.swatch[2] }}/>{value === option.id && <Check size={13}/>}</span>
        <span>{option.name}</span>
      </button>)}
    </div>
  </div>;
}

export function OptionPicker<T extends string>({ label, options, value, onChange, previewClass }: {
  label: string; options: readonly { id: T; name: string; description: string }[]; value: T; onChange: (id: T) => void;
  /** Adds a class per option (e.g. a font) so each card can preview itself. */
  previewClass?: (id: T) => string;
}) {
  return <div className="field">
    <span className="design-label">{label}</span>
    <div className="design-options" role="radiogroup" aria-label={label}>
      {options.map(option => <button key={option.id} type="button" role="radio" aria-checked={value === option.id} className={`${value === option.id ? "active" : ""} ${previewClass?.(option.id) ?? ""}`} onClick={() => onChange(option.id)}>
        <strong>{option.name}</strong><small>{option.description}</small>
      </button>)}
    </div>
  </div>;
}
