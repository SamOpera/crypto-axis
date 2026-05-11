"use client";

import { useBroadcastStore } from "@/store/broadcastStore";

export function PlaybackControls() {
  const { isPlaying, isMuted, volume, togglePlay, next, toggleMute, setVolume } =
    useBroadcastStore();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        className="flex items-center gap-1.5 font-orbitron text-[10px] font-bold tracking-[0.08em] bg-gold text-crypto-bg rounded-lg px-4 py-2.5 hover:bg-gold-light hover:shadow-[0_4px_16px_rgba(240,165,0,0.3)] transition-all"
      >
        {isPlaying ? "⏸ PAUSE" : "▶ PLAY"}
      </button>

      {/* Next */}
      <button
        onClick={next}
        title="Next story"
        className="font-orbitron text-[10px] font-bold tracking-[0.08em] text-crypto-text3 bg-white/[0.04] border border-crypto-border rounded-lg px-3 py-2.5 hover:text-gold hover:border-crypto-border-g transition-all"
      >
        ⏭
      </button>

      {/* Mute */}
      <button
        onClick={toggleMute}
        title={isMuted ? "Unmute" : "Mute"}
        className="font-orbitron text-[12px] text-crypto-text3 bg-white/[0.04] border border-crypto-border rounded-lg px-3 py-2.5 hover:text-gold hover:border-crypto-border-g transition-all"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>

      {/* Volume slider — hidden on mobile */}
      <input
        type="range"
        min={0} max={1} step={0.05}
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="hidden md:block w-[70px] h-[3px] rounded accent-gold cursor-pointer"
        aria-label="Volume"
      />
    </div>
  );
}
