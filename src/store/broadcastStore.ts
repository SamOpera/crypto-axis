/**
 * broadcastStore.ts
 * Central state for broadcast playback, anchor animation, and audio engine.
 * The audio engine lives entirely inside this store so any component
 * can call play/pause/next without prop-drilling.
 */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Story, AnchorState, PlaybackState } from "@/types";
import { STORIES } from "@/data/stories";
import { AudioEngine } from "@/lib/audioEngine";
import { MouthEngine }  from "@/lib/mouthEngine";

/* ── State shape ── */
interface BroadcastStore {
  /* Data */
  stories:        Story[];
  currentIdx:     number;
  currentStory:   Story | null;

  /* Playback */
  playback:       PlaybackState;
  isPlaying:      boolean;
  isMuted:        boolean;
  volume:         number;
  currentTime:    number;
  duration:       number;
  progress:       number; // 0-100

  /* Anchor */
  anchorState:    AnchorState;

  /* Queue UI */
  queueOpen:      boolean;

  /* Actions */
  init:           () => void;
  play:           () => void;
  pause:          () => void;
  togglePlay:     () => void;
  next:           () => void;
  jumpTo:         (idx: number) => void;
  setVolume:      (v: number) => void;
  toggleMute:     () => void;
  setAnchorState: (s: AnchorState) => void;
  setProgress:    (t: number, dur: number) => void;
  toggleQueue:    () => void;
}

export const useBroadcastStore = create<BroadcastStore>()(
  subscribeWithSelector((set, get) => ({
    stories:      STORIES,
    currentIdx:   0,
    currentStory: null,
    playback:     "idle",
    isPlaying:    false,
    isMuted:      false,
    volume:       0.85,
    currentTime:  0,
    duration:     0,
    progress:     0,
    anchorState:  "idle",
    queueOpen:    true,

    /* ─── init ─── */
    init() {
      const story = get().stories[0];
      if (!story) return;
      set({ currentStory: story, currentIdx: 0, duration: story.durationSec });

      // Wire audio engine callbacks — read currentStory from get() each time,
      // NOT from the closed-over `story` variable (which would always be story[0])
      AudioEngine.onStateChange = (state: AnchorState) => {
        get().setAnchorState(state);
        if (state === "speaking") {
          const current = get().currentStory;
          if (current) MouthEngine.start(current.script, current.durationSec);
        } else {
          MouthEngine.stop();
        }
      };
      AudioEngine.onProgress = (t: number, dur: number) => get().setProgress(t, dur);
      AudioEngine.onEnded    = () => {
        setTimeout(() => {
          if (get().isPlaying) get().next();
        }, 3000);
      };
    },

    /* ─── play ─── */
    play() {
      const { currentStory, isMuted, volume } = get();
      if (!currentStory) return;
      set({ isPlaying: true, playback: "playing" });
      AudioEngine.speak(currentStory.script, currentStory.durationSec, {
        muted:  isMuted,
        volume: volume,
        rate:   0.91,
        pitch:  0.94,
      });
    },

    /* ─── pause ─── */
    pause() {
      set({ isPlaying: false, playback: "paused" });
      AudioEngine.pause();
    },

    togglePlay() {
      const { isPlaying, playback } = get();
      if (isPlaying) {
        get().pause();
      } else {
        if (playback === "paused") {
          set({ isPlaying: true, playback: "playing" });
          AudioEngine.resume();
        } else {
          get().play();
        }
      }
    },

    /* ─── next ─── */
    next() {
      const { currentIdx, stories } = get();
      const nextIdx = (currentIdx + 1) % stories.length;
      get().jumpTo(nextIdx);
    },

    /* ─── jumpTo ─── */
    jumpTo(idx) {
      const story = get().stories[idx];
      if (!story) return;
      AudioEngine.stop();
      MouthEngine.stop();
      set({
        currentIdx:   idx,
        currentStory: story,
        currentTime:  0,
        duration:     story.durationSec,
        progress:     0,
        playback:     "idle",
        anchorState:  "idle",
      });
      if (get().isPlaying) {
        // Small gap before next story
        setTimeout(() => get().play(), 350);
      }
    },

    setVolume(v) {
      set({ volume: v });
      AudioEngine.setVolume(v);
    },

    toggleMute() {
      const muted = !get().isMuted;
      set({ isMuted: muted });
      AudioEngine.setMuted(muted);
    },

    setAnchorState(s) {
      set({ anchorState: s });
    },

    setProgress(t, dur) {
      set({
        currentTime: t,
        duration:    dur,
        progress:    dur > 0 ? (t / dur) * 100 : 0,
      });
    },

    toggleQueue() {
      set((s) => ({ queueOpen: !s.queueOpen }));
    },
  }))
);
