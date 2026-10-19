"use client";

import { BriefcaseBusiness, Check, FileText, Pause, Play, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Degrees per millisecond for the idle auto-rotation (one full turn ≈ 16s). */
const BASE_SPEED = 360 / 16000;
const EDGE_LAYERS = 14;

export function HeroShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  const angle = useRef(-24);
  const velocity = useRef(BASE_SPEED);
  const tilt = useRef(-8);
  const tiltOffset = useRef(0);
  const pausedRef = useRef(false);
  const drag = useRef<{ active: boolean; x: number; y: number; t: number }>({ active: false, x: 0, y: 0, t: 0 });

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pausedRef.current = true;
      queueMicrotask(() => setPaused(true));
    }

    let frame = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(now - prev, 48);
      prev = now;

      if (!drag.current.active) {
        const target = pausedRef.current ? 0 : BASE_SPEED;
        velocity.current += (target - velocity.current) * Math.min(1, dt * 0.0025);
        angle.current += velocity.current * dt;
        tiltOffset.current += (0 - tiltOffset.current) * Math.min(1, dt * 0.002);
      }

      const breathe = pausedRef.current ? 0 : Math.sin(now / 2600) * 3;
      tilt.current = -8 + breathe + tiltOffset.current;

      const rad = (angle.current * Math.PI) / 180;
      const card = cardRef.current;
      const root = rootRef.current;
      if (card && root) {
        card.style.transform = `rotateX(${tilt.current}deg) rotateY(${angle.current}deg)`;
        root.style.setProperty("--sheen", `${50 + Math.sin(rad) * 70}%`);
        root.style.setProperty("--floor", `${0.45 + Math.abs(Math.cos(rad)) * 0.55}`);
        root.style.setProperty("--glow", `${0.55 + Math.abs(Math.sin(rad)) * 0.45}`);
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { active: true, x: event.clientX, y: event.clientY, t: performance.now() };
    velocity.current = 0;
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const now = performance.now();
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    const dt = Math.max(now - drag.current.t, 1);

    angle.current += dx * 0.45;
    tiltOffset.current = Math.max(-22, Math.min(22, tiltOffset.current - dy * 0.25));
    velocity.current = Math.max(-1.6, Math.min(1.6, (dx * 0.45) / dt));
    drag.current = { active: true, x: event.clientX, y: event.clientY, t: now };
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") { velocity.current -= 0.35; event.preventDefault(); }
    if (event.key === "ArrowRight") { velocity.current += 0.35; event.preventDefault(); }
  }

  const half = (EDGE_LAYERS - 1) / 2;

  return (
    <div
      ref={rootRef}
      className="showcase"
      role="group"
      aria-label="Rotating 3D preview of a wedding invitation and job application bundle. Drag or use arrow keys to spin."
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div className="showcase-halo" aria-hidden="true" />
      <div className="showcase-floor" aria-hidden="true" />

      <div className="spin-scene">
        <div className="spin-card" ref={cardRef}>
          {/* Horizontal orbit ring – its dots circle the card as it spins */}
          <div className="orbit-ring" aria-hidden="true">
            <i className="orbit-dot orbit-dot-a" />
            <i className="orbit-dot orbit-dot-b" />
            <i className="orbit-dot orbit-dot-c" />
          </div>
          <div className="orbit-ring orbit-ring-tilted" aria-hidden="true">
            <i className="orbit-dot orbit-dot-a" />
          </div>

          {/* Stacked slices give the card a physical edge when seen side-on */}
          {Array.from({ length: EDGE_LAYERS }, (_, i) => (
            <div
              key={i}
              className="card-edge"
              aria-hidden="true"
              style={{ transform: `translateZ(${(i - half) * 1}px)` }}
            />
          ))}

          {/* FRONT — wedding invitation */}
          <div className="card-face card-front">
            <div className="mock-window">
              <div className="mock-top">
                <span className="window-dots" aria-hidden="true"><i className="mock-dot"/><i className="mock-dot"/><i className="mock-dot"/></span>
                <span className="mock-url">launchph.ph/wedding/lea-and-miguel</span>
                <span className="live-indicator"><i/> Live</span>
              </div>
              <div className="invite-preview">
                <svg className="invite-flourish" viewBox="0 0 160 24" aria-hidden="true">
                  <path d="M2 12 C 30 2, 50 22, 80 12 S 130 2, 158 12" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="80" cy="12" r="2.4" fill="currentColor" />
                </svg>
                <div className="invite-crest"><span>L</span><i/><span>M</span></div>
                <p className="script">Together with our families</p>
                <h3>Lea &amp; Miguel</h3>
                <div className="invite-rule"/>
                <p>DECEMBER 18, 2026 · TAGAYTAY</p>
                <div className="invite-countdown" aria-hidden="true">
                  <span><b>71</b>days</span><span><b>08</b>hrs</span><span><b>42</b>min</span>
                </div>
                <span className="rsvp-button">Kindly RSVP</span>
              </div>
            </div>
            <span className="card-sheen" aria-hidden="true" />
          </div>

          {/* BACK — guided job application bundle */}
          <div className="card-face card-back">
            <div className="mock-window">
              <div className="mock-top">
                <span className="window-dots" aria-hidden="true"><i className="mock-dot"/><i className="mock-dot"/><i className="mock-dot"/></span>
                <span className="mock-url">launchph.ph/job-application-bundle</span>
                <span className="live-indicator"><i/> Career</span>
              </div>
              <div className="resume-preview">
                <div className="resume-head">
                  <span className="resume-avatar">JOB</span>
                  <div>
                    <h3>Application Bundle</h3>
                    <p>Focused support for your next opportunity</p>
                  </div>
                </div>
                <div className="resume-block">
                  <h4>Application materials</h4>
                  <div className="resume-row"><strong>Resume review</strong><span>Included</span></div>
                  <i className="skeleton w-90"/><i className="skeleton w-70"/>
                  <div className="resume-row"><strong>Tailored cover letter</strong><span>Included</span></div>
                  <i className="skeleton w-80"/><i className="skeleton w-55"/>
                </div>
                <div className="resume-block">
                  <h4>Profile review</h4>
                  <div className="resume-pills"><span>LinkedIn</span><span>Portfolio</span><span>Positioning</span><span>Clarity</span></div>
                </div>
                <div className="resume-block">
                  <h4>Next step</h4>
                  <div className="resume-row"><strong>Interview preparation notes</strong><span>Optional</span></div>
                </div>
              </div>
            </div>
            <span className="card-sheen" aria-hidden="true" />
          </div>

          {/* Front satellites */}
          <div className="sat sat-front sat-stat">
            <span className="status"><Check size={13}/> Invitation published</span>
            <strong>128 <small>guests</small></strong>
            <span className="sat-bar"><i style={{ width: "73%" }} /></span>
            <span>94 have responded</span>
          </div>
          <div className="sat sat-front sat-chip"><ShieldCheck size={15}/><span>Private &amp; protected</span></div>
          <div className="sat sat-front sat-spark" aria-hidden="true"><Sparkles size={16}/></div>

          {/* Back satellites */}
          <div className="sat sat-back sat-chip sat-chip-back"><BriefcaseBusiness size={15}/><span>Role-focused support</span></div>
          <div className="sat sat-back sat-stat sat-stat-back">
            <span className="status"><FileText size={13}/> Application reviewed</span>
            <strong>Ready <small>for the next step</small></strong>
            <span>Clear, consistent materials</span>
          </div>
        </div>
      </div>

      <div className="showcase-controls">
        <span className="showcase-hint">Drag to spin · 360° preview</span>
        <button
          type="button"
          className="spin-toggle"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? "Resume rotation" : "Pause rotation"}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}
