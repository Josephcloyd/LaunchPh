"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { INTRO_SPLASH_CLASS, INTRO_SPLASH_DURATION_MS } from "@/lib/intro-splash";

// three.js only downloads on devices that will actually render the scene.
const HeroScene = dynamic(() => import("@/components/hero-scene"), { ssr: false });

function canRender3D() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  if ((navigator.hardwareConcurrency ?? 8) < 4) return false;
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

/** Animated WebGL backdrop for the home hero. Falls back to the CSS gradient on weaker devices. */
export function HeroBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Creating a WebGL context (even the capability probe) and setting up three.js block the
    // main thread for a few hundred ms, so both wait out the intro splash.
    const splashing = document.documentElement.classList.contains(INTRO_SPLASH_CLASS);
    const timer = setTimeout(() => { if (canRender3D()) setEnabled(true); }, splashing ? INTRO_SPLASH_DURATION_MS : 0);

    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    if (rootRef.current) observer.observe(rootRef.current);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, []);

  return (
    <div ref={rootRef} className={`hero-backdrop ${ready ? "is-ready" : ""}`} aria-hidden="true">
      {enabled && <HeroScene active={onScreen} onReady={() => setReady(true)} />}
    </div>
  );
}
