"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SceneQuality } from "@/components/hero-scene";
import { type EffectsTier, lowerTier, rememberTier, startingTier } from "@/lib/device-performance";
import { INTRO_SPLASH_CLASS, INTRO_SPLASH_DURATION_MS } from "@/lib/intro-splash";

// three.js only downloads on devices that will actually render the scene.
const HeroScene = dynamic(() => import("@/components/hero-scene"), { ssr: false });

/** Matches the .hero-backdrop opacity transition, so the scene fades out before it unmounts. */
const FADE_MS = 1800;

/**
 * Animated WebGL backdrop for the home hero. It starts at the quality the device can likely
 * handle, steps down (full → light → off) if the frame rate drops, and remembers that for the
 * device's next visit. With the 3D off, the CSS gradient behind it shows instead.
 */
export function HeroBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const tierRef = useRef<EffectsTier>("off");
  const [tier, setTier] = useState<EffectsTier>("off");
  const [onScreen, setOnScreen] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [ready, setReady] = useState(false);

  const applyTier = useCallback((next: EffectsTier) => {
    tierRef.current = next;
    setTier(next);
  }, []);

  useEffect(() => {
    // Creating a WebGL context (even the capability probe) and setting up three.js block the
    // main thread for a few hundred ms, so both wait out the intro splash.
    const splashing = document.documentElement.classList.contains(INTRO_SPLASH_CLASS);
    const timer = setTimeout(() => applyTier(startingTier()), splashing ? INTRO_SPLASH_DURATION_MS : 0);

    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    if (rootRef.current) observer.observe(rootRef.current);
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearTimeout(timer); observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [applyTier]);

  // The scene reports it's struggling: use the lighter version, or fade the 3D out entirely.
  const slowDown = useCallback(() => {
    const next = lowerTier(tierRef.current);
    rememberTier(next);
    if (next === "off") {
      setReady(false);
      setTimeout(() => applyTier("off"), FADE_MS);
    } else {
      applyTier(next);
    }
  }, [applyTier]);

  return (
    <div ref={rootRef} className={`hero-backdrop ${ready && tier !== "off" ? "is-ready" : ""}`} aria-hidden="true" data-effects={tier}>
      {tier !== "off" && <HeroScene quality={tier as SceneQuality} active={onScreen && tabVisible} onReady={() => setReady(true)} onSlow={slowDown} />}
    </div>
  );
}
