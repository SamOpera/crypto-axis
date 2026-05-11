/**
 * mouthEngine.ts  — v6 "presenter realism"
 *
 * Core changes from v5:
 *
 * 1. DECOUPLED JAW FROM AMPLITUDE
 *    Amplitude was directly scaling jaw openness every frame. That made
 *    the mouth feel like an audio visualiser — bouncing in lockstep with
 *    sound energy. Now amplitude is used only as a soft envelope gating
 *    factor (max 20% influence), not as the primary driver. The schedule
 *    drives shape; physics drives timing.
 *
 * 2. SEPARATE UPPER AND LOWER LIP PHYSICS
 *    Upper lip and lower lip now have independent spring states.
 *    Upper lip leads slightly (anticipatory — opens before jaw drops).
 *    Lower lip has more damping (heavier, trails slightly).
 *    This asymmetry is the single biggest realism improvement.
 *
 * 3. ASYMMETRIC LIP GEOMETRY
 *    Left/right sides of both lips have a persistent micro-offset
 *    (seeded randomly at init, constant per session) so the mouth
 *    never looks perfectly centred. A slow drift term rotates the
 *    asymmetry over time (imperceptible but prevents symmetry fatigue).
 *
 * 4. REDUCED ARTICULATION INTENSITY
 *    All jaw targets scaled by 0.72 (down from 1.0).
 *    All teeth/tongue opacity scaled by 0.65.
 *    News presenters do not open their mouths fully to show all teeth.
 *
 * 5. ANTICIPATORY ARTICULATION
 *    Look-ahead coarticulation blend extended: the mouth begins moving
 *    toward the NEXT viseme at 20% into the current keyframe (was 0%).
 *    Provides the natural forward-lean of real speech.
 *
 * 6. MICRO JITTER + TIMING DRIFT
 *    A small band-limited noise term (pseudo-random walk, ±0.4px) is
 *    added to jaw position each frame. It is smoothed over 3 frames so
 *    it reads as organic texture, not computational noise.
 *    Additionally, schedule timestamps have ±8ms random drift injected
 *    at build time so no two sentences sound identical.
 *
 * 7. IRREGULAR CADENCE
 *    The syllable-duration calculation now varies per-word (±12%
 *    randomness) rather than being a uniform 1/sps. Real speech has
 *    duration variation at the word level (content words longer than
 *    function words).
 *
 * 8. SIMULATED AMPLITUDE CLEANED UP
 *    The old 3-layer model used a 4.2Hz syllable clock in both
 *    amplitude and mouth — double-driving the same frequency and making
 *    it too regular. The syllable component is now removed from sim
 *    amplitude (it lives in the schedule instead).
 */

import { AudioEngine } from "./audioEngine";

/* ── Types ── */
interface Viseme {
  ll:  string;  // lower-lip path (canonical, jaw=1)
  ul:  number;  // upper-lip curl amount
  th:  number;  // teeth opacity
  tg:  number;  // tongue opacity
  jaw: number;  // jaw open target 0..1
  wid: number;  // lip-corner spread
}

interface Keyframe {
  t:      number;
  viseme: string;
  energy: number;
  drift:  number;  // per-keyframe timing jitter (seconds, baked at build)
}

/* ── Viseme library (intensities reduced ~25% across the board) ── */
const V: Record<string, Viseme> = {
  //          lower-lip path (canonical)                                                     ul    th     tg    jaw   wid
  rest:     { ll:"M-14,0 Q-7,1.0 0,1.5 Q7,1.0 14,0 Q7,3.0 0,3.8 Q-7,3.0 -14,0Z",         ul:0,   th:0,    tg:0,    jaw:0.00, wid:0     },
  bilabial: { ll:"M-14,0 Q-7,0.3 0,0.5 Q7,0.3 14,0 Q7,1.2 0,1.8 Q-7,1.2 -14,0Z",         ul:0,   th:0,    tg:0,    jaw:0.01, wid:0     },
  dental:   { ll:"M-13,1.2 Q-6,2.5 0,3.0 Q6,2.5 13,1.2 Q7,4.8 0,5.5 Q-7,4.8 -13,1.2Z",  ul:0.3, th:0.05, tg:0,    jaw:0.08, wid:0.08  },
  sibilant: { ll:"M-12,0 Q-6,1.2 0,1.7 Q6,1.2 12,0 Q7,5.5 0,6.8 Q-7,5.5 -12,0Z",        ul:0.2, th:0.18, tg:0.05, jaw:0.13, wid:0.10  },
  slight:   { ll:"M-14,0 Q-7,1.6 0,2.4 Q7,1.6 14,0 Q7,6.0 0,7.2 Q-7,6.0 -14,0Z",        ul:0.1, th:0.07, tg:0,    jaw:0.16, wid:0     },
  mid:      { ll:"M-14,0 Q-7,1.2 0,1.7 Q7,1.2 14,0 Q7,8.0 0,9.5 Q-7,8.0 -14,0Z",        ul:0.6, th:0.34, tg:0,    jaw:0.34, wid:0.04  },
  open:     { ll:"M-14,0 Q-7,0.9 0,1.3 Q7,0.9 14,0 Q10,10.5 0,12.5 Q-10,10.5 -14,0Z",   ul:1.1, th:0.58, tg:0.28, jaw:0.52, wid:0.07  },
  wide:     { ll:"M-14,0 Q-7,0.7 0,1.0 Q7,0.7 14,0 Q9,12.0 0,14.0 Q-9,12.0 -14,0Z",     ul:1.3, th:0.65, tg:0.42, jaw:0.50, wid:0.22  },
  round:    { ll:"M-10,0 Q-5,1.7 0,2.5 Q5,1.7 10,0 Q6,9.5 0,11.5 Q-6,9.5 -10,0Z",       ul:0.4, th:0.38, tg:0.12, jaw:0.36, wid:-0.15 },
};

/* ── G2V rules (unchanged) ── */
const GV: [RegExp, string][] = [
  [/^[pbm]/i,                          "bilabial"],
  [/^[fv]/i,                           "dental"  ],
  [/^(sh|ch|zh|j|[sz])/i,             "sibilant"],
  [/^(wh|w|oo|ou|ow|oe|oa|oh)/i,      "round"   ],
  [/^(ee|ea|ey|ay|ai|ie|i[^aeiou])/i, "wide"    ],
  [/(ar|ah|aa|a[^aeiou]$)/i,          "open"    ],
  [/[aeiou]{2}/i,                      "mid"     ],
  [/[aeiou]/i,                         "slight"  ],
  [/[^aeiou]{2,}/i,                    "slight"  ],
  [/./,                                "slight"  ],
];

/* ── Upper lip spring state (separate from jaw) ── */
interface LipSpring {
  pos: number;
  vel: number;
}

/* ── Noise state for micro-jitter ── */
interface NoiseState {
  v:  number;   // current value
  v1: number;   // one frame ago
  v2: number;   // two frames ago
}

class _MouthEngine {
  private _rafId:     number | null = null;
  private _schedule:  Keyframe[]   = [];
  private _startTime: number       = 0;

  /* ── Separate jaw and upper-lip springs ── */
  private _jaw:   LipSpring = { pos: 0, vel: 0 };
  private _ulip:  LipSpring = { pos: 0, vel: 0 };  // upper-lip curl

  /* ── Jaw spring constants (lower = slower, more natural) ── */
  private readonly JAW_SPRING       = 0.14;   // was 0.18 — slightly slower onset
  private readonly JAW_DAMPING      = 0.65;   // was 0.62 — slightly more overshoot
  private readonly ULIP_SPRING      = 0.22;   // upper lip is faster (leads jaw)
  private readonly ULIP_DAMPING     = 0.72;

  /* ── Persistent asymmetry offset (seeded once per session) ── */
  private readonly _asymX: number  = (Math.random() - 0.5) * 0.8;   // left/right bias px
  private readonly _asymY: number  = (Math.random() - 0.5) * 0.4;   // up/down bias px
  private _asymDrift               = 0;  // slow rotation of asymmetry

  /* ── Micro-jitter noise ── */
  private _jitter: NoiseState      = { v: 0, v1: 0, v2: 0 };

  /* ── Smoothed display state ── */
  private _cur = {
    ll: V.rest.ll,
    th: 0, tg: 0, wid: 0,
    // upper lip stored separately — driven by _ulip spring
  };

  /* ── Public API ── */
  start(text: string, durationSec: number) {
    this._buildSchedule(text, durationSec);
    this._startTime     = performance.now();
    this._jaw           = { pos: 0, vel: 0 };
    this._ulip          = { pos: 0, vel: 0 };
    this._jitter        = { v: 0, v1: 0, v2: 0 };
    this._asymDrift     = 0;
    this._cur           = { ll: V.rest.ll, th: 0, tg: 0, wid: 0 };
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._loop();
  }

  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._jaw   = { pos: 0, vel: 0 };
    this._ulip  = { pos: 0, vel: 0 };
    this._applyToDOM({ ll: V.rest.ll, th: 0, tg: 0, ulCurl: 0, wid: 0, jitter: 0 });
  }

  /* ── Schedule builder ── */
  private _buildSchedule(text: string, totalSec: number) {
    const words     = text.trim().split(/\s+/);
    const syllCount = words.reduce((n, w) => n + this._countSyllables(w), 0);
    const baseSps   = Math.min(4.0, Math.max(2.6, syllCount / totalSec));

    this._schedule = [];
    let t = 0.04;

    for (const word of words) {
      const clean = word.replace(/[^a-z']/gi, "");
      const syls  = this._splitSyllables(clean);

      // ── Per-word duration variation (±12%) — content words are longer ──
      const wordLen     = clean.length;
      const isFuncWord  = wordLen <= 3;                  // a, the, in, of, …
      const wordRate    = baseSps * (isFuncWord ? 1.12 : 0.94) * (0.88 + Math.random() * 0.24);
      const sylDur      = 1 / Math.max(2.0, wordRate);

      syls.forEach((syl, si) => {
        const viseme   = this._classifySyllable(syl);
        const stressed = syls.length === 1 || si === 0;  // first syllable often stressed
        const energy   = stressed ? 0.88 : 0.64;         // reduced from 1.0/0.72

        // Per-keyframe timing drift: ±8ms — makes no two sentences identical
        const drift = (Math.random() - 0.5) * 0.016;

        this._schedule.push({ t, viseme, energy, drift });
        // Closure — mouth starts returning to rest at 58% through syllable
        this._schedule.push({
          t:      t + sylDur * 0.58,
          viseme: "rest",
          energy: 0.18,       // reduced from 0.25
          drift:  (Math.random() - 0.5) * 0.008,
        });
        t += sylDur;
      });

      // Inter-word rest
      this._schedule.push({ t, viseme: "rest", energy: 0.04, drift: 0 });
      t += 0.038 + Math.random() * 0.012;  // slight variation even in gaps

      if (/[.!?]$/.test(word))      t += 0.26 + Math.random() * 0.06;
      else if (/[,;:—]$/.test(word)) t += 0.11 + Math.random() * 0.04;
    }

    this._schedule.sort((a, b) => a.t - b.t);
  }

  /* ── rAF loop ── */
  private _loop() {
    this._rafId = requestAnimationFrame(() => {
      const now     = performance.now();
      const elapsed = (now - this._startTime) / 1000;

      /* ── Find current & next keyframe (apply drift offset) ── */
      let curKF: Keyframe = { t: 0, viseme: "rest", energy: 0.25, drift: 0 };
      let nxtKF: Keyframe = { t: 0.1, viseme: "rest", energy: 0.25, drift: 0 };
      let curIdx = 0;

      for (let i = this._schedule.length - 1; i >= 0; i--) {
        const kf = this._schedule[i];
        if (elapsed >= kf.t + kf.drift) {
          curKF  = kf;
          curIdx = i;
          break;
        }
      }
      if (curIdx + 1 < this._schedule.length) nxtKF = this._schedule[curIdx + 1];

      const kfDur     = (nxtKF.t + nxtKF.drift) - (curKF.t + curKF.drift);
      const kfElapsed = elapsed - (curKF.t + curKF.drift);
      const blend     = kfDur > 0 ? Math.min(1, kfElapsed / kfDur) : 1;

      /* ── Anticipatory coarticulation: starts at 20% into current KF ── */
      const coart = Math.max(0, Math.min(0.28, (blend - 0.20) * 1.8));

      const curV = V[curKF.viseme] ?? V.rest;
      const nxtV = V[nxtKF.viseme] ?? V.rest;

      /* ── Amplitude: soft gate only (max 20% influence) ── */
      const fftAmp = AudioEngine.getAmplitude();
      const simAmp = this._simAmplitude(elapsed);
      const rawAmp = fftAmp > 0 ? fftAmp : simAmp;
      // Compress amplitude influence significantly — it is NOT the primary driver
      const ampGate = 0.80 + rawAmp * 0.20;

      /* ── Jaw target: schedule-driven, amplitude-gated ── */
      const blendedJaw = curV.jaw + (nxtV.jaw - curV.jaw) * coart;
      const jawTarget  = blendedJaw * curKF.energy * ampGate * 0.72; // 0.72 = intensity reduction

      /* ── Upper lip target: leads jaw (opens earlier) ── */
      const blendedUl  = curV.ul  + (nxtV.ul  - curV.ul)  * Math.min(1, coart * 1.4);
      const ulTarget   = blendedUl * curKF.energy * 0.72;

      /* ── Jaw spring (heavier, more damped) ── */
      this._jaw.vel += (jawTarget - this._jaw.pos) * this.JAW_SPRING;
      this._jaw.vel *= this.JAW_DAMPING;
      this._jaw.pos  = Math.max(0, Math.min(1.08, this._jaw.pos + this._jaw.vel));
      // 1.08 max allows slight overshoot but not 1.15 — more controlled

      /* ── Upper lip spring (lighter, leads jaw) ── */
      this._ulip.vel += (ulTarget - this._ulip.pos) * this.ULIP_SPRING;
      this._ulip.vel *= this.ULIP_DAMPING;
      this._ulip.pos  = Math.max(0, this._ulip.pos + this._ulip.vel);

      const jaw   = this._jaw.pos;
      const ulCurl= this._ulip.pos;

      /* ── Micro-jitter: 3-frame smoothed band-limited noise ── */
      this._jitter.v2 = this._jitter.v1;
      this._jitter.v1 = this._jitter.v;
      this._jitter.v  = (Math.random() - 0.5) * 0.55;
      // Smooth over 3 frames — removes high-freq hash, keeps organic texture
      const jitter = (this._jitter.v + this._jitter.v1 + this._jitter.v2) / 3;

      /* ── Slow asymmetry drift (one full rotation ~every 40s) ── */
      this._asymDrift += 0.0004;
      const asymScale  = Math.cos(this._asymDrift);

      /* ── Lower-lip path: coarticulation + asymmetry ── */
      const llCur = this._lerpPath(V.rest.ll, curV.ll, jaw);
      const llNxt = this._lerpPath(V.rest.ll, nxtV.ll, jaw * 0.55);
      const ll    = this._applyAsymmetry(
        this._lerpPath(llCur, llNxt, coart),
        this._asymX * asymScale,
        this._asymY * asymScale + jitter * 0.4
      );

      /* ── Other shape features ── */
      const th  = (curV.th  + (nxtV.th  - curV.th)  * coart) * jaw * ampGate * 0.65;
      const tg  = (curV.tg  + (nxtV.tg  - curV.tg)  * coart) * jaw * ampGate * 0.65;
      const wid = (curV.wid + (nxtV.wid - curV.wid) * coart) * jaw;

      /* ── Smooth current state (different lerp per feature) ── */
      // Lower lip: fairly responsive
      this._cur.ll  = this._lerpPath(this._cur.ll, ll, 0.34);
      // Teeth/tongue: slightly slower (they trail the lips)
      this._cur.th  = this._cur.th  + (th  - this._cur.th)  * 0.26;
      this._cur.tg  = this._cur.tg  + (tg  - this._cur.tg)  * 0.26;
      this._cur.wid = this._cur.wid + (wid - this._cur.wid)  * 0.20;

      this._applyToDOM({ ...this._cur, ulCurl, jitter });
      this._loop();
    });
  }

  /* ── DOM write ── */
  private _applyToDOM(s: {
    ll: string; th: number; tg: number;
    ulCurl: number; wid: number; jitter: number;
  }) {
    const ll  = document.getElementById("mouth-lower-lip");
    const ul  = document.getElementById("mouth-upper-lip");
    const te  = document.getElementById("mouth-teeth");
    const t1  = document.getElementById("mouth-tooth1");
    const t2  = document.getElementById("mouth-tooth2");
    const tg  = document.getElementById("mouth-tongue");
    const grp = document.getElementById("mouth-group");

    if (ll) ll.setAttribute("d", s.ll);

    if (ul) {
      // Upper lip: asymmetric — left control point slightly different from right
      const u   = s.ulCurl;
      const jL  = s.jitter * 0.3 + this._asymY * 0.2;
      const jR  = -s.jitter * 0.15;
      ul.setAttribute("d",
        `M-14,0 Q-7,${(-3.5 - u + jL).toFixed(2)} 0,${(-2.8 - u).toFixed(2)} Q7,${(-3.5 - u + jR).toFixed(2)} 14,0 Q7,.7 0,1.3 Q-7,.7 -14,0Z`
      );
    }

    if (te) te.setAttribute("opacity", Math.min(1, s.th).toFixed(3));
    if (t1) t1.setAttribute("opacity", Math.min(1, s.th).toFixed(3));
    if (t2) t2.setAttribute("opacity", Math.min(1, s.th).toFixed(3));
    if (tg) tg.setAttribute("opacity", Math.min(1, s.tg).toFixed(3));

    if (grp) {
      const w = 1 + (s.wid || 0) * 0.06;  // reduced scale effect (was 0.08)
      grp.setAttribute("transform", `translate(45,80) scale(${w.toFixed(3)},1)`);
    }
  }

  /* ── Asymmetry: nudge path coordinates on left vs right side ── */
  private _applyAsymmetry(path: string, dx: number, dy: number): string {
    if (!path || (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01)) return path;
    // Nudge Q control points — not endpoints — so outline stays closed
    let seg = 0;
    return path.replace(/Q(-?[\d.]+),(-?[\d.]+)\s+(-?[\d.]+),(-?[\d.]+)/g,
      (_m, cx, cy, ex, ey) => {
        seg++;
        // Left side control point (segs 1,3): apply asymmetry in one direction
        // Right side (segs 2,4): opposite
        const side  = seg % 2 === 1 ? 1 : -1;
        const ncx   = (+cx + dx * side * 0.5).toFixed(2);
        const ncy   = (+cy + dy * 0.3).toFixed(2);
        return `Q${ncx},${ncy} ${ex},${ey}`;
      }
    );
  }

  /* ── Simulated amplitude — speech envelope without syllable clock ── */
  private _simAmplitude(t: number): number {
    // Removed the 4.2Hz syllable term — that's handled by the schedule now.
    // This is purely a breath-level envelope + phonation flutter.
    const breathEnv   = 0.55 + 0.45 * Math.sin(t * Math.PI * 2 * 0.30);
    const phonFlutter = 0.65 + 0.35 * Math.abs(Math.sin(t * Math.PI * 2 * 9.8));
    // Occasional plosive burst — ~5% of frames
    const plosive     = Math.random() < 0.05 ? 0.12 : 0;
    return Math.min(1, breathEnv * phonFlutter * 0.88 + plosive);
  }

  /* ── Phoneme helpers (unchanged) ── */
  private _countSyllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return 0;
    const m = w.match(/[aeiouy]+/g);
    let n   = m ? m.length : 1;
    if (w.endsWith("e") && n > 1) n--;
    return Math.max(1, n);
  }

  private _splitSyllables(word: string): string[] {
    if (!word) return [""];
    const w    = word.toLowerCase();
    const syls: string[] = [];
    let cur = "";
    for (let i = 0; i < w.length; i++) {
      cur += w[i];
      const isV  = /[aeiouy]/.test(w[i]);
      const nextC= w[i + 1] !== undefined && /[^aeiouy]/.test(w[i + 1]);
      const nextV= w[i + 2] !== undefined && /[aeiouy]/.test(w[i + 2]);
      if (isV && nextC && nextV && cur.length > 1) { syls.push(cur); cur = ""; }
    }
    if (cur) syls.push(cur);
    return syls.length ? syls : [word];
  }

  private _classifySyllable(syl: string): string {
    for (const [pat, viseme] of GV) {
      if (pat.test(syl)) return viseme;
    }
    return "slight";
  }

  /* ── SVG path numeric lerp ── */
  private _lerpPath(from: string, to: string, t: number): string {
    if (!from || from === to) return to;
    if (t <= 0) return from;
    if (t >= 1) return to;
    const fN = from.match(/-?[\d.]+/g);
    const tN = to.match(/-?[\d.]+/g);
    if (!fN || !tN || fN.length !== tN.length) return to;
    let i = 0;
    return to.replace(/-?[\d.]+/g, () => {
      const v = +fN[i] + (+tN[i] - +fN[i]) * t;
      i++;
      return v.toFixed(3);
    });
  }
}

export const MouthEngine = new _MouthEngine();
