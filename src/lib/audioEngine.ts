/**
 * audioEngine.ts
 * Production audio engine for CryptoChannel Africa.
 *
 * Strategy:
 *  • Primary:  HTMLAudioElement — for real ElevenLabs MP3 URLs
 *  • Fallback: Web Speech API   — for when no audio URL is available
 *
 * Both paths emit the same callbacks so the store doesn't care which path runs.
 *
 * To plug in ElevenLabs:
 *   1. Generate audio URL server-side via /api/tts route
 *   2. Pass url to AudioEngine.speak() via options.audioUrl
 *   3. HTMLAudioElement path activates automatically
 */

import type { AnchorState } from "@/types";

interface SpeakOptions {
  audioUrl?: string;      // real MP3 — if provided, uses HTMLAudioElement
  muted?:    boolean;
  volume?:   number;
  rate?:     number;      // Web Speech only
  pitch?:    number;      // Web Speech only
}

type StateCallback    = (state: AnchorState) => void;
type ProgressCallback = (current: number, duration: number) => void;
type EndedCallback    = () => void;

class _AudioEngine {
  /* Callbacks — wired by broadcastStore.init() */
  onStateChange: StateCallback    = () => {};
  onProgress:    ProgressCallback = () => {};
  onEnded:       EndedCallback    = () => {};

  /* Internal */
  private _el:            HTMLAudioElement | null = null;
  private _utter:         SpeechSynthesisUtterance | null = null;
  private _voices:        SpeechSynthesisVoice[] = [];
  private _progressTimer: ReturnType<typeof setInterval> | null = null;
  private _elapsed        = 0;
  private _totalSec       = 0;
  private _muted          = false;
  private _volume         = 0.85;
  private _usingElement   = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const load = () => { this._voices = window.speechSynthesis.getVoices(); };
      window.speechSynthesis.onvoiceschanged = load;
      load();
    }
  }

  /* ──────────────────────────────────── speak ── */
  speak(text: string, durationSec: number, opts: SpeakOptions = {}) {
    this.stop();
    this._totalSec = durationSec;
    this._elapsed  = 0;
    this._muted    = opts.muted  ?? this._muted;
    this._volume   = opts.volume ?? this._volume;

    if (opts.audioUrl) {
      this._speakElement(opts.audioUrl, durationSec);
    } else {
      this._speakSynthesis(text, opts);
    }
  }

  /* ── Path A: real audio file ── */
  private _speakElement(url: string, durationSec: number) {
    this._usingElement = true;
    this._el = new Audio(url);
    this._el.volume  = this._muted ? 0 : this._volume;
    this._el.preload = "auto";

    this._el.onplay = () => {
      this.onStateChange("speaking");
      this._startProgress(this._el!.duration || durationSec);
    };
    this._el.onpause  = () => this.onStateChange("paused");
    this._el.onended  = () => {
      this._stopProgress();
      this.onStateChange("idle");
      this.onEnded();
    };
    this._el.onerror  = () => {
      console.warn("[AudioEngine] HTMLAudio error — falling back to synthesis");
      this._usingElement = false;
    };

    // Wire AudioContext for real waveform analysis if available
    this._tryConnectContext(this._el);

    this._el.play().catch(() => {
      // Autoplay blocked — common on mobile, user must interact first
      this.onStateChange("idle");
    });
  }

  /* ── Path B: Web Speech API ── */
  private _speakSynthesis(text: string, opts: SpeakOptions) {
    this._usingElement = false;
    if (!("speechSynthesis" in window)) return;

    this._utter         = new SpeechSynthesisUtterance(text);
    this._utter.rate    = opts.rate  ?? 0.91;
    this._utter.pitch   = opts.pitch ?? 0.94;
    this._utter.volume  = this._muted ? 0 : this._volume;

    const voice = this._voices.find(v => /daniel|george/i.test(v.name) && v.lang === "en-GB")
               || this._voices.find(v => v.lang === "en-GB")
               || this._voices.find(v => v.lang.startsWith("en"))
               || this._voices[0];
    if (voice) this._utter.voice = voice;

    this._utter.onstart = () => {
      this.onStateChange("speaking");
      this._startProgress(this._totalSec);
    };
    this._utter.onend = () => {
      this._stopProgress();
      this.onStateChange("idle");
      this.onEnded();
    };
    this._utter.onerror = () => {
      this._stopProgress();
      this.onStateChange("idle");
    };

    window.speechSynthesis.speak(this._utter);
  }

  /* ──────────────────────────────── controls ── */
  pause() {
    if (this._usingElement && this._el) {
      this._el.pause();
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    this._stopProgress();
    this.onStateChange("paused");
  }

  resume() {
    if (this._usingElement && this._el) {
      this._el.play();
    } else if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    this.onStateChange("speaking");
    this._startProgress(this._totalSec - this._elapsed);
  }

  stop() {
    if (this._el) {
      this._el.pause();
      this._el.src = "";
      this._el     = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    this._stopProgress();
    this.onStateChange("idle");
  }

  seek(seconds: number) {
    if (this._usingElement && this._el) {
      this._el.currentTime = seconds;
      this._elapsed = seconds;
    }
    // Web Speech cannot seek — update visual only
    this._elapsed = seconds;
    this.onProgress(seconds, this._totalSec);
  }

  setVolume(v: number) {
    this._volume = v;
    if (this._el)    this._el.volume = this._muted ? 0 : v;
    if (this._utter) this._utter.volume = this._muted ? 0 : v;
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this._el)    this._el.volume = m ? 0 : this._volume;
    if (this._utter) this._utter.volume = m ? 0 : this._volume;
    if (m && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }

  /* ──────────────────────── progress timer ── */
  private _startProgress(totalSec: number) {
    this._stopProgress();
    const TICK = 250;
    this._progressTimer = setInterval(() => {
      this._elapsed = Math.min(this._elapsed + TICK / 1000, totalSec);
      this.onProgress(this._elapsed, this._totalSec);
      if (this._elapsed >= totalSec) this._stopProgress();
    }, TICK);
  }

  private _stopProgress() {
    if (this._progressTimer) {
      clearInterval(this._progressTimer);
      this._progressTimer = null;
    }
  }

  /* ── Optional: AudioContext for real waveform data ── */
  audioContext:  AudioContext  | null = null;
  analyserNode:  AnalyserNode  | null = null;
  freqData:      Uint8Array<ArrayBuffer> | null = null;

  private _tryConnectContext(el: HTMLAudioElement) {
    try {
      this.audioContext  = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyserNode  = this.audioContext.createAnalyser();
      this.analyserNode.fftSize                = 128;
      this.analyserNode.smoothingTimeConstant  = 0.5;
      this.freqData      = new Uint8Array(this.analyserNode.frequencyBinCount);
      this.audioContext.createMediaElementSource(el).connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
    } catch {
      this.audioContext = null;
      this.analyserNode = null;
    }
  }

  /* Returns amplitude 0..1 from analyser (if available) */
  getAmplitude(): number {
    if (!this.analyserNode || !this.freqData) return 0;
    this.analyserNode.getByteFrequencyData(this.freqData);
    const sum = this.freqData.reduce((a, v) => a + v, 0);
    return Math.min(1, sum / (this.freqData.length * 96));
  }
}

/* Singleton — one instance per tab */
export const AudioEngine = new _AudioEngine();
