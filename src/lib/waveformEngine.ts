/**
 * waveformEngine.ts
 * Drives the 10-bar waveform display.
 * Reads from AudioEngine.analyserNode when real audio is playing,
 * falls back to 3-layer speech physics model for Web Speech.
 * Exports amplitude + syllablePulse for MouthEngine to consume.
 */

import { AudioEngine } from "./audioEngine";

class _WaveformEngine {
  /* Public signals */
  amplitude      = 0;   // smoothed 0..1
  syllablePulse  = 0;   // raw syllable clock 0..1

  private _rafId:  number | null = null;
  private _t       = 0;
  private _active  = false;
  private _bars:   HTMLElement[] = [];

  /** Call after DOM mounts — grabs bar elements by id */
  mount(barIds: string[]) {
    this._bars = barIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
  }

  start() {
    this._active = true;
    this._t      = 0;
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._loop();
  }

  pause() {
    this._active = false;
    cancelAnimationFrame(this._rafId!);
    this._rafId  = null;
    this.amplitude     = 0;
    this.syllablePulse = 0;
    this._bars.forEach(b => {
      b.style.animation = "none";
      b.style.transform = "scaleY(0.12)";
      b.style.opacity   = "0.2";
    });
  }

  stop() {
    this._active = false;
    if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    this.amplitude     = 0;
    this.syllablePulse = 0;
    this._bars.forEach(b => {
      b.style.animation = "";
      b.style.transform = "";
      b.style.opacity   = "";
    });
  }

  private _loop() {
    this._rafId = requestAnimationFrame(() => {
      if (!this._active) return;
      this._t += 1 / 60;
      const t = this._t;

      let masterAmp: number;
      let syllAmp: number;

      const fft = AudioEngine.getAmplitude();
      if (fft > 0 && AudioEngine.analyserNode) {
        // Real audio path
        const fd = AudioEngine.freqData as Uint8Array<ArrayBuffer>;
        AudioEngine.analyserNode.getByteFrequencyData(fd);
        const n   = fd.length;
        let sum   = 0;
        for (let i = 0; i < n; i++) sum += fd[i];
        masterAmp = Math.min(1, sum / (n * 96));
        const mid = Array.from(fd.slice(Math.floor(n * 0.1), Math.floor(n * 0.4)));
        syllAmp   = Math.min(1, mid.reduce((a, v) => a + v, 0) / (mid.length * 80));
      } else {
        // Web Speech simulation
        const breathEnv   = 0.50 + 0.50 * Math.sin(t * Math.PI * 2 * 0.35);
        const syllClock   = 0.50 + 0.50 * Math.sin(t * Math.PI * 2 * 4.2);
        const phonFlutter = 0.60 + 0.40 * Math.abs(Math.sin(t * Math.PI * 2 * 11.5));
        const plosive     = Math.random() < 0.06 ? 0.15 : 0;
        syllAmp   = Math.max(0, syllClock * breathEnv);
        masterAmp = Math.min(1, breathEnv * syllClock * phonFlutter * 0.9 + plosive);
      }

      // Asymmetric smoothing: fast attack, slow release
      const prev  = this.amplitude;
      const alpha = masterAmp > prev ? 0.35 : 0.18;
      this.amplitude     = prev + (masterAmp - prev) * alpha;
      this.syllablePulse = syllAmp;

      // Drive each bar
      const amp = this.amplitude;
      this._bars.forEach((b, i) => {
        const spectral = 0.5 + 0.5 * Math.sin(Math.PI * i / (this._bars.length - 1));
        const phase    = i * 0.61;
        const localOsc = 0.65 + 0.35 * Math.sin(t * Math.PI * 2 * (2.1 + i * 0.38) + phase);
        const scale    = Math.max(0.06, amp * spectral * localOsc);
        b.style.animation = "none";
        b.style.transform = `scaleY(${scale.toFixed(3)})`;
        b.style.opacity   = (0.28 + scale * 0.72).toFixed(3);
      });

      this._loop();
    });
  }
}

export const WaveformEngine = new _WaveformEngine();
