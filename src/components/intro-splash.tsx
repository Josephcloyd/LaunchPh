"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { LoadingStage } from "@/components/loading-screen";
import { INTRO_SPLASH_CLASS } from "@/lib/intro-splash";

// Hidden unless the head script in the root layout added the class; the exit is timed in globals.css.
export function IntroSplash() {
  return <div className="intro-splash-overlay" aria-hidden="true"><LoadingStage/></div>;
}

// Lives in the root layout. Leaving the home page drops the class before paint, so other
// pages (and a later return to the home page) don't wait on a splash that isn't showing.
export function IntroSplashGuard() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    if (pathname !== "/") document.documentElement.classList.remove(INTRO_SPLASH_CLASS);
  }, [pathname]);
  return null;
}
