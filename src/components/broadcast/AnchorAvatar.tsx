"use client";

/**
 * AnchorAvatar.tsx
 *
 * Cryztatoken of Africa — AI Anchor
 *
 * Animation system (all rAF-driven, zero CSS animation classes for motion):
 *
 * IDLE STATE
 *   • Slow breathing cycle: head floats ±3px on ~4s sine wave
 *   • Subtle tilt: ±1.5° rotation on ~6s sine wave (offset from breath)
 *   • Random micro-saccades: eyes shift ±2px every 2–6s
 *   • Random blinks: every 2.5–6s, 80ms close / 60ms reopen
 *   • Occasional slow head turn: ±3° on ~12s cycle
 *
 * SPEAKING STATE
 *   • Faster, larger breath: head floats ±5px on ~2s sine wave
 *   • More energetic tilt: ±2.5° on ~1.8s sine wave
 *   • Nodding: additional Y nod synced to syllable clock (~4Hz)
 *   • Eyes stay more open (wide-eye engagement)
 *   • Blinks less frequent but still present
 *   • Waveform bars driven by WaveformEngine
 *
 * PAUSED STATE
 *   • Head returns to neutral (lerps to 0,0)
 *   • Slow idle breath resumes
 *   • Waveform freezes
 *
 * The MouthEngine writes directly to SVG element IDs.
 * This component only manages head/eye/body motion.
 */

import { useEffect, useRef, useCallback } from "react";
import { useBroadcastStore } from "@/store/broadcastStore";
import { WaveformEngine }    from "@/lib/waveformEngine";

/* ── Animation state (not React state — never triggers re-render) ── */
interface AnchorAnim {
  // Current transform values
  headY:     number;   // px vertical offset
  headRotZ:  number;   // degrees Z rotation
  headRotY:  number;   // degrees Y rotation (subtle 3D-ish tilt)
  nodY:      number;   // speaking nod additional Y
  // Velocities for spring physics
  headYVel:  number;
  rotZVel:   number;
  // Time accumulators
  t:         number;   // global time (seconds)
  blinkTimer:number;   // countdown to next blink ms
  blinkPhase: "open" | "closing" | "closed" | "opening";
  blinkProgress: number;
  eyeLRY:    number;   // current left eye ry
  eyeRRY:    number;   // current right eye ry
  // Eye position
  eyeOffsetX: number;
  eyeOffsetY: number;
  eyeTargetX: number;
  eyeTargetY: number;
  saccadeTimer: number;
  // Previous state (for transitions)
  prevState: string;
}

const NATURAL_EYE_RY = 8.5;

export function AnchorAvatar() {
  const anchorState = useBroadcastStore((s) => s.anchorState);
  const isSpeaking  = anchorState === "speaking";
  const isPaused    = anchorState === "paused";

  const rafRef      = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const anim        = useRef<AnchorAnim>({
    headY: 0, headRotZ: 0, headRotY: 0, nodY: 0,
    headYVel: 0, rotZVel: 0,
    t: 0,
    blinkTimer: 2500 + Math.random() * 2000,
    blinkPhase: "open",
    blinkProgress: 0,
    eyeLRY: NATURAL_EYE_RY,
    eyeRRY: NATURAL_EYE_RY,
    eyeOffsetX: 0, eyeOffsetY: 0,
    eyeTargetX: 0, eyeTargetY: 0,
    saccadeTimer: 3000,
    prevState: "idle",
  });

  const waveformMounted = useRef(false);

  // Mount waveform engine once
  useEffect(() => {
    if (waveformMounted.current) return;
    waveformMounted.current = true;
    WaveformEngine.mount(Array.from({ length: 10 }, (_, i) => `wbar-${i}`));
  }, []);

  // Drive waveform from anchor state
  useEffect(() => {
    if (isSpeaking)    WaveformEngine.start();
    else if (isPaused) WaveformEngine.pause();
    else               WaveformEngine.stop();
  }, [isSpeaking, isPaused]);

  // ── Main animation loop ──
  const loop = useCallback((timestamp: number) => {
    const dt  = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05); // cap at 50ms
    lastTimeRef.current = timestamp;
    const a   = anim.current;
    a.t      += dt;

    const speaking = anchorState === "speaking";
    const paused   = anchorState === "paused";

    // ── Breath + sway targets ──
    let targetY: number;
    let targetRotZ: number;
    let targetRotY: number;
    let targetNodY = 0;

    if (paused) {
      // Return to neutral
      targetY    = 0;
      targetRotZ = 0;
      targetRotY = 0;
    } else if (speaking) {
      // Speaking breathing — deliberate, measured. News presenters hold posture.
      // Two overlapping frequencies prevent mechanical regularity.
      const breathFreq = 0.38;    // Hz — slightly slower than before
      const swayFreq   = 0.29;    // Hz — different ratio avoids lockstep beat
      targetY    = Math.sin(a.t * Math.PI * 2 * breathFreq) * 3.2          // was 4.5 — reduced
                 + Math.sin(a.t * Math.PI * 2 * (breathFreq * 0.61)) * 0.9; // was 1.5
      targetRotZ = Math.sin(a.t * Math.PI * 2 * swayFreq) * 1.4            // was 2.2 — much tighter
                 + Math.sin(a.t * Math.PI * 2 * (swayFreq * 1.7)) * 0.35;  // was 0.6
      targetRotY = Math.sin(a.t * Math.PI * 2 * 0.14) * 1.2;               // was 2.0 — subtle

      // Syllable nod: reduced amplitude, only present when syllable pulse is strong.
      // This prevents the head from becoming an audio visualiser.
      const syllableFreq = 4.1;
      const syllPulse    = WaveformEngine.syllablePulse;
      // Gate: only nod when pulse exceeds 0.55 threshold — avoids constant bobbing
      const syllGated    = Math.max(0, syllPulse - 0.55) * (1 / 0.45);
      targetNodY = Math.abs(Math.sin(a.t * Math.PI * 2 * syllableFreq)) * 1.1 // was 1.8
                 * syllGated;

    } else {
      // Gentle idle breathing — unchanged, already natural
      const breathFreq = 0.22;
      const swayFreq   = 0.17;
      targetY    = Math.sin(a.t * Math.PI * 2 * breathFreq) * 2.8
                 + Math.sin(a.t * Math.PI * 2 * (breathFreq * 1.5)) * 0.8;
      targetRotZ = Math.sin(a.t * Math.PI * 2 * swayFreq) * 1.4
                 + Math.sin(a.t * Math.PI * 2 * (swayFreq * 2.1)) * 0.4;
      targetRotY = Math.sin(a.t * Math.PI * 2 * 0.09) * 1.2;
    }

    // ── Spring-damp toward targets ──
    // Lower spring during speaking: presenter maintains composure, doesn't snap to every target.
    const SPRING  = speaking ? 0.08 : 0.06;   // was 0.12/0.06 — now closer together
    const DAMPING = 0.80;                       // was 0.78 — slightly more damped
    a.headYVel  += (targetY - a.headY) * SPRING;
    a.headYVel  *= DAMPING;
    a.headY     += a.headYVel;
    a.rotZVel   += (targetRotZ - a.headRotZ) * SPRING;
    a.rotZVel   *= DAMPING;
    a.headRotZ  += a.rotZVel;

    // Lerp slower-moving transforms
    const LERP_SLOW = dt * (speaking ? 1.8 : 0.9);
    a.headRotY  += (targetRotY - a.headRotY) * Math.min(1, LERP_SLOW);
    a.nodY      += (targetNodY - a.nodY) * Math.min(1, dt * 18);

    // ── Blink system ──
    a.blinkTimer -= dt * 1000;
    if (a.blinkTimer <= 0 && a.blinkPhase === "open") {
      a.blinkPhase    = "closing";
      a.blinkProgress = 0;
      // Presenters hold eye contact — blink infrequently during delivery.
      // Idle: natural rate (~0.25/s). Speaking: deliberate (~0.10/s).
      a.blinkTimer = speaking
        ? 5000 + Math.random() * 5000    // was 3500+3500 — much less frequent
        : 2800 + Math.random() * 2500;   // was 2500+3000 — similar
    }

    if (a.blinkPhase !== "open") {
      a.blinkProgress += dt * 1000;
      let ry: number;
      if (a.blinkPhase === "closing") {
        ry = NATURAL_EYE_RY * (1 - a.blinkProgress / 80);
        if (a.blinkProgress >= 80) { a.blinkPhase = "closed"; a.blinkProgress = 0; }
      } else if (a.blinkPhase === "closed") {
        ry = 0.4;
        if (a.blinkProgress >= 55) { a.blinkPhase = "opening"; a.blinkProgress = 0; }
      } else { // opening
        ry = NATURAL_EYE_RY * (a.blinkProgress / 65);
        if (a.blinkProgress >= 65) { a.blinkPhase = "open"; ry = NATURAL_EYE_RY; }
      }
      a.eyeLRY = Math.max(0.3, ry);
      a.eyeRRY = Math.max(0.3, ry);
    } else {
      a.eyeLRY = NATURAL_EYE_RY;
      a.eyeRRY = NATURAL_EYE_RY;
    }

    // ── Micro-saccades (subtle eye movement) ──
    a.saccadeTimer -= dt * 1000;
    if (a.saccadeTimer <= 0) {
      const range = speaking ? 2.5 : 1.8;
      a.eyeTargetX   = (Math.random() - 0.5) * range;
      a.eyeTargetY   = (Math.random() - 0.5) * range * 0.5;
      a.saccadeTimer = 2000 + Math.random() * 4000;
    }
    // Lerp eyes toward target (fast — eye movements are ballistic)
    const EYE_LERP  = Math.min(1, dt * 8);
    a.eyeOffsetX   += (a.eyeTargetX - a.eyeOffsetX) * EYE_LERP;
    a.eyeOffsetY   += (a.eyeTargetY - a.eyeOffsetY) * EYE_LERP;

    // ── Apply to DOM ──
    const totalY   = a.headY + a.nodY;
    const head     = document.getElementById("anchor-head-inner");
    if (head) {
      head.style.transform =
        `translateY(${totalY.toFixed(2)}px) ` +
        `rotate(${a.headRotZ.toFixed(2)}deg) ` +
        `rotateY(${a.headRotY.toFixed(2)}deg)`;
    }

    // Eyes
    const eyeL = document.getElementById("anchor-eye-l");
    const eyeR = document.getElementById("anchor-eye-r");
    if (eyeL) eyeL.setAttribute("ry", a.eyeLRY.toFixed(2));
    if (eyeR) eyeR.setAttribute("ry", a.eyeRRY.toFixed(2));

    // Eye iris positions (micro-saccade)
    const irisPositions: Array<[string, number, number]> = [
      ["anchor-iris-l", 32 + a.eyeOffsetX, 49 + a.eyeOffsetY],
      ["anchor-iris-r", 58 + a.eyeOffsetX, 49 + a.eyeOffsetY],
      ["anchor-pupil-l", 33 + a.eyeOffsetX, 50 + a.eyeOffsetY],
      ["anchor-pupil-r", 57 + a.eyeOffsetX, 50 + a.eyeOffsetY],
    ];
    irisPositions.forEach(([id, cx, cy]) => {
      const el = document.getElementById(id);
      if (el) {
        el.setAttribute("cx", cx.toFixed(2));
        el.setAttribute("cy", cy.toFixed(2));
      }
    });

    rafRef.current = requestAnimationFrame(loop);
  }, [anchorState]); // re-bind when state changes so speaking/idle/paused behavior updates

  useEffect(() => {
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [loop]);

  // ── Glow intensity based on state ──
  const glowShadow = isSpeaking
    ? "0 0 60px rgba(240,165,0,0.28), 0 0 0 1px rgba(240,165,0,0.15)"
    : "0 0 30px rgba(240,165,0,0.08)";

  return (
    <div
      className="relative w-[120px] h-[155px] lg:w-[190px] lg:h-[235px] rounded-2xl overflow-hidden flex-shrink-0 border border-crypto-border-g transition-shadow duration-700"
      style={{
        background:  "linear-gradient(160deg, #1c1400 0%, #0e0e1a 55%, #050508 100%)",
        boxShadow:   glowShadow,
      }}
    >
      {/* Ambient floor glow — brightens when speaking */}
      <div
        className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none transition-opacity duration-500"
        style={{
          background: "linear-gradient(to top, rgba(240,165,0,0.12), transparent)",
          opacity:    isSpeaking ? 1 : 0.5,
        }}
      />

      {/* Desk surface */}
      <div
        className="absolute left-[-10px] right-[-10px] h-3 pointer-events-none"
        style={{
          bottom:     "50px",
          background: "linear-gradient(180deg, #2a1f00, #1a1200)",
          borderTop:  "1px solid rgba(240,165,0,0.25)",
        }}
      />

      {/* ON AIR badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1 bg-[rgba(220,30,50,0.18)] border border-[rgba(220,30,50,0.4)] rounded px-2 py-0.5 z-10">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: "#ff4060",
            animation:  isSpeaking
              ? "blink-dot 0.8s ease-in-out infinite"
              : "blink-dot 1.8s ease-in-out infinite",
          }}
        />
        <span className="font-orbitron text-[7px] font-bold text-[#ff4060] tracking-[0.12em]">
          {isSpeaking ? "ON AIR" : isPaused ? "PAUSED" : "READY"}
        </span>
      </div>

      {/* Figure — outer wrapper stays fixed, inner div is the animated element */}
      <div className="absolute bottom-[54px] left-1/2 -translate-x-1/2 flex flex-col items-center">

        {/* Head — rAF writes transform directly to this element */}
        <div
          id="anchor-head-inner"
          className="relative w-[90px] h-[108px]"
          style={{ transformOrigin: "50% 85%", willChange: "transform" }}
        >
          <svg
            viewBox="0 0 90 108"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible"
          >
            <defs>
              <radialGradient id="sg" cx="44%" cy="38%" r="62%">
                <stop offset="0%"   stopColor="#9B6E1A"/>
                <stop offset="55%"  stopColor="#7A5210"/>
                <stop offset="100%" stopColor="#4A3008"/>
              </radialGradient>
              <radialGradient id="ew" cx="38%" cy="32%" r="62%">
                <stop offset="0%"   stopColor="#FFFAEE"/>
                <stop offset="100%" stopColor="#E8DFC0"/>
              </radialGradient>
            </defs>

            {/* Hair */}
            <ellipse cx="45" cy="17" rx="34" ry="16" fill="#1A0E00"/>
            <rect x="12" y="15" width="66" height="10" rx="3" fill="#1A0E00"/>

            {/* Head shape */}
            <path d="M15,38 Q12,25 22,18 Q45,6 68,18 Q78,25 75,38 L73,78 Q71,95 45,97 Q19,95 17,78 Z" fill="url(#sg)"/>

            {/* Ears */}
            <ellipse cx="13" cy="56" rx="7" ry="10" fill="#7A5210"/>
            <ellipse cx="77" cy="56" rx="7" ry="10" fill="#7A5210"/>
            <ellipse cx="12" cy="56" rx="4"  ry="6"  fill="#5A3A08"/>
            <ellipse cx="78" cy="56" rx="4"  ry="6"  fill="#5A3A08"/>

            {/* Eyebrows — lift slightly when speaking */}
            <path
              d="M22,38 Q30,34 40,37"
              stroke="#2A1600"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              style={{ transform: isSpeaking ? "translateY(-1px)" : "none", transition: "transform 0.3s" }}
            />
            <path
              d="M50,37 Q60,34 68,38"
              stroke="#2A1600"
              strokeWidth="2.8"
              strokeLinecap="round"
              fill="none"
              style={{ transform: isSpeaking ? "translateY(-1px)" : "none", transition: "transform 0.3s" }}
            />

            {/* Left eye — ry animated by rAF blink system */}
            <ellipse id="anchor-eye-l" cx="30" cy="48" rx="10" ry="8.5" fill="url(#ew)"/>
            <ellipse id="anchor-iris-l"  cx="32" cy="49" rx="6"   ry="6"   fill="#3A2800"/>
            <ellipse id="anchor-pupil-l" cx="33" cy="50" rx="3.5" ry="3.5" fill="#0A0500"/>
            {/* Shine — static, doesn't move with saccade */}
            <ellipse cx="35" cy="47" rx="1.8" ry="1.4" fill="rgba(255,255,255,0.7)" transform="rotate(-18,35,47)"/>

            {/* Right eye */}
            <ellipse id="anchor-eye-r" cx="60" cy="48" rx="10" ry="8.5" fill="url(#ew)"/>
            <ellipse id="anchor-iris-r"  cx="58" cy="49" rx="6"   ry="6"   fill="#3A2800"/>
            <ellipse id="anchor-pupil-r" cx="57" cy="50" rx="3.5" ry="3.5" fill="#0A0500"/>
            <ellipse cx="55" cy="47" rx="1.8" ry="1.4" fill="rgba(255,255,255,0.7)" transform="rotate(-18,55,47)"/>

            {/* Nose */}
            <path d="M40,60 Q45,67 50,60" stroke="#5A3A08" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <ellipse cx="37" cy="64" rx="4" ry="3" fill="#5A3A08" opacity="0.45"/>
            <ellipse cx="53" cy="64" rx="4" ry="3" fill="#5A3A08" opacity="0.45"/>

            {/* Mouth group — animated by MouthEngine via element IDs */}
            <g id="mouth-group" transform="translate(45,80)">
              <path id="mouth-upper-lip" d="M-14,0 Q-7,-4 0,-3 Q7,-4 14,0 Q7,.8 0,1.5 Q-7,.8 -14,0Z"   fill="#3A1A06"/>
              <path id="mouth-lower-lip" d="M-14,0 Q-7,1.5 0,2 Q7,1.5 14,0 Q7,5 0,6 Q-7,5 -14,0Z"     fill="#5A2A10"/>
              <rect  id="mouth-teeth"    x="-10" y=".5" width="20" height="5.5" rx="1.5" fill="#F0EAD8" opacity="0"/>
              <line  id="mouth-tooth1"   x1="-3" y1=".5" x2="-3" y2="6" stroke="#D8D0B8" strokeWidth=".7" opacity="0"/>
              <line  id="mouth-tooth2"   x1="4"  y1=".5" x2="4"  y2="6" stroke="#D8D0B8" strokeWidth=".7" opacity="0"/>
              <ellipse id="mouth-tongue" cx="0" cy="7" rx="6" ry="2.5" fill="#CC4040" opacity="0"/>
            </g>

            {/* Jaw highlight */}
            <path d="M22,82 Q45,98 68,82" stroke="rgba(160,100,20,0.2)" strokeWidth="1.2" fill="none"/>

            {/* Subtle forehead highlight — makes face feel lit from front */}
            <ellipse cx="42" cy="30" rx="18" ry="9" fill="rgba(200,150,50,0.06)"/>
          </svg>
        </div>

        {/* Neck */}
        <div
          className="w-[30px] h-[18px] -mt-0.5 rounded-b"
          style={{ background: "linear-gradient(180deg, #7B5A12, #5A3E0A)" }}
        />

        {/* Suit */}
        <div className="w-[140px] h-[110px] -mt-0.5">
          <svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="suit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#1E2A50"/>
                <stop offset="100%" stopColor="#0A1228"/>
              </linearGradient>
              <linearGradient id="tie" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%"   stopColor="#F0A500"/>
                <stop offset="100%" stopColor="#8A5C00"/>
              </linearGradient>
            </defs>
            <path d="M8,0 L132,0 L140,110 L0,110 Z"            fill="url(#suit)"/>
            <path d="M70,0 L44,0 L24,50 L62,28 Z"              fill="#253060"/>
            <path d="M70,0 L96,0 L116,50 L78,28 Z"             fill="#1A2250"/>
            <path d="M54,0 L70,0 L86,0 L78,25 L70,18 L62,25 Z" fill="#EEF0F8"/>
            <path d="M65,0 L75,0 L79,24 L70,80 L61,24 Z"       fill="url(#tie)"/>
            <path d="M65,0 L75,0 L72,10 L70,12 L68,10 Z"       fill="#C88A00"/>
            <path d="M18,22 L30,22 L28,32 L20,32 Z"            fill="#1A2250"/>
            <path d="M20,22 L28,22 L25,27 L21,27 Z"            fill="#F0A500" opacity="0.75"/>
            {/* CC badge */}
            <circle cx="34" cy="46" r="8" fill="#F0A500" opacity="0.12"/>
            <circle cx="34" cy="46" r="5.5" fill="none" stroke="#F0A500" strokeWidth="0.8" opacity="0.35"/>
            <text x="34" y="49.5" textAnchor="middle" fill="#F0A500" fontFamily="monospace" fontSize="5.5" opacity="0.6">CC</text>
            <circle cx="70" cy="90" r="2.5" fill="#0D1630"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
