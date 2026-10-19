"use client";

import { useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "saving" | "error";
type SaveResult = { ok: true; savedAt: string } | { ok: false; message: string };

// Debounces editor changes and reports the latest save outcome. Results from
// superseded saves are ignored so a slow response cannot overwrite a newer state.
export function useAutosave<T>(value: T, save: (value: T) => Promise<SaveResult>) {
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveMessage, setSaveMessage] = useState("All changes saved");
  const mounted = useRef(false);
  const changeVersion = useRef(0);
  const saveRef = useRef(save);

  useEffect(() => { saveRef.current = save; }, [save]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const version = ++changeVersion.current;
    setSaveState("saving");
    setSaveMessage("Waiting to save…");
    const timer = window.setTimeout(() => {
      setSaveMessage("Saving…");
      void saveRef.current(value).then(result => {
        if (version !== changeVersion.current) return;
        if (!result.ok) {
          setSaveState("error");
          setSaveMessage(result.message);
          return;
        }
        setSaveState("saved");
        setSaveMessage(`Saved ${new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(result.savedAt))}`);
      }).catch(() => {
        if (version !== changeVersion.current) return;
        setSaveState("error");
        setSaveMessage("Your changes could not be saved.");
      });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [value]);

  return { saveState, saveMessage };
}
