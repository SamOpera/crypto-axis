"use client";

/**
 * IntroSequence.tsx
 *
 * Shown once per browser session on first visit.
 * Dismissed automatically after 3.8s or on any user interaction.
 *
 * Design intent:
 *  - Establish platform identity immediately ("live AI broadcast network")
 *  - Create a sense of tuning in to something already happening
 *  - Not decorative — gives stores time to initialise before UI is visible
 *  - Skippable instantly (click/tap anywhere or press any key)
 *
 * Timing (3.8s total):
 *  0.0s — background fades in (dark, ambient glow)
 *  0.3s — logo + CC monogram rises
 *  0.7s — "CRYPTOCHANNEL AFRICA" wordmark appears
 *  1.1s — kente bar grows across
 *  1.5s — tagline + live stats appear
 *  2.8s — "STARTING BROADCAST" CTA pulses
 *  3.8s — everything fades, main UI fades in
 */

import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/store/uiStore";

/* Simulated "live now" stats — replaced by real store values
   once the main UI mounts. Shown during intro only. */
const INTRO_STATS = [
  { label: "Watching",    value: "2,841" },
  { label: "Market Cap",  value: "$3.41T" },
  { label: "BTC",         value: "$98,421" },
  { label: "Segments",    value: "4 live"  },
];

const TOTAL_DURATION = 3800; // ms

export function IntroSequence() {
  const completeIntro  = useUIStore((s) => s.completeIntro);
  const [phase, setPhase] = useState<
    "logo" | "stats" | "cta" | "exiting"
  >("logo");
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const dismiss = () => {
    // Clear all pending timers
    timerRef.current.forEach(clearTimeout);
    setPhase("exiting");
    setTimeout(completeIntro, 450);
  };

  useEffect(() => {
    // Phase progression
    const t1 = setTimeout(() => setPhase("stats"),   1500);
    const t2 = setTimeout(() => setPhase("cta"),     2600);
    const t3 = setTimeout(() => setPhase("exiting"), 3400);
    const t4 = setTimeout(completeIntro,              TOTAL_DURATION);

    timerRef.current = [t1, t2, t3, t4];

    // Skip on any key press
    const onKey = () => dismiss();
    window.addEventListener("keydown", onKey, { once: true });

    return () => {
      timerRef.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isExiting = phase === "exiting";

  return (
    <div
      onClick={dismiss}
      className="fixed inset-0 z-[500] flex flex-col items-center justify-center cursor-pointer select-none"
      role="dialog"
      aria-label="CryptoChannel Africa intro — click to skip"
      style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 60%, rgba(240,165,0,0.10) 0%, transparent 65%),
          radial-gradient(ellipse 60% 40% at 20% 20%, rgba(74,158,255,0.05) 0%, transparent 60%),
          #07080C
        `,
        animation:  isExiting
          ? "intro-bg-pulse 0.45s ease forwards reverse"
          : "intro-bg-pulse 0.4s ease forwards",
      }}
    >
      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none scanlines opacity-30"
      />

      {/* Kente top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] kente-stripe origin-left"
        style={{
          animation: isExiting
            ? "none"
            : "intro-bar-grow 3.8s ease forwards",
        }}
      />

      {/* Main content */}
      <div
        className="flex flex-col items-center gap-6 text-center px-6"
        style={{
          animation: isExiting
            ? "intro-logo-rise 0.45s ease forwards reverse"
            : "intro-logo-rise 3.8s ease forwards",
        }}
      >
        {/* CC monogram */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-orbitron text-[28px] font-black text-crypto-bg"
            style={{
              background: "linear-gradient(135deg, #F0A500 0%, #C88000 100%)",
              boxShadow:  "0 0 48px rgba(240,165,0,0.35), 0 0 96px rgba(240,165,0,0.12)",
            }}
          >
            CC
          </div>

          {/* Wordmark */}
          <div>
            <h1
              className="font-orbitron text-[22px] md:text-[28px] font-black text-gold tracking-[0.10em] leading-none"
            >
              CRYPTOCHANNEL
            </h1>
            <p className="font-orbitron text-[18px] md:text-[22px] font-bold text-white/60 tracking-[0.20em] mt-1">
              AFRICA
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            animation: isExiting
              ? "intro-tagline-rise 0.45s ease forwards reverse"
              : "intro-tagline-rise 3.8s ease forwards",
          }}
        >
          <p className="font-mono text-[11px] md:text-[13px] text-white/45 tracking-[0.20em] uppercase">
            AI-Powered Crypto Intelligence Network
          </p>
        </div>

        {/* Live stats row — appears at phase "stats" */}
        {(phase === "stats" || phase === "cta") && (
          <div
            className="flex gap-5 md:gap-8 flex-wrap justify-center"
            style={{
              animation: "intro-stat-rise 2.4s ease forwards",
            }}
          >
            {INTRO_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="font-orbitron text-[15px] md:text-[17px] font-bold text-gold">
                  {s.value}
                </span>
                <span className="font-mono text-[8px] text-white/35 tracking-[0.14em] uppercase">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA — appears at phase "cta" */}
        {phase === "cta" && (
          <div
            className="flex flex-col items-center gap-3 mt-2"
            style={{ animation: "intro-stat-rise 1.2s ease forwards" }}
          >
            {/* Live indicator */}
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 bg-crypto-red rounded-full"
                style={{ animation: "intro-dot-blink 0.7s ease-in-out infinite" }}
              />
              <span className="font-orbitron text-[11px] font-bold text-crypto-red tracking-[0.18em]">
                BROADCAST STARTING
              </span>
              <span
                className="w-2 h-2 bg-crypto-red rounded-full"
                style={{ animation: "intro-dot-blink 0.7s ease-in-out 0.35s infinite" }}
              />
            </div>

            <p className="font-mono text-[10px] text-white/30 tracking-[0.10em]">
              TAP ANYWHERE TO ENTER
            </p>
          </div>
        )}
      </div>

      {/* Bottom kente bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] kente-stripe origin-right"
        style={{
          animation: isExiting
            ? "none"
            : "intro-bar-grow 3.8s ease 0.2s forwards",
        }}
      />

      {/* Skip hint — bottom right */}
      <div className="absolute bottom-6 right-6">
        <span className="font-mono text-[9px] text-white/20 tracking-[0.10em] uppercase">
          Tap to skip
        </span>
      </div>
    </div>
  );
}
