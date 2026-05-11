"use client";

import { AnchorAvatar }  from "./AnchorAvatar";
import { ScriptDisplay } from "./ScriptDisplay";
import { QueuePanel }    from "./QueuePanel";
import { PlaybackControls } from "./PlaybackControls";
import { useBroadcastStore } from "@/store/broadcastStore";

export function BroadcastPlayer() {
  const story = useBroadcastStore((s) => s.currentStory);

  return (
    <section className="relative bg-crypto-bg2 border-b border-crypto-border overflow-hidden min-h-[520px] lg:min-h-[560px]">
      {/* Kente top accent */}
      <div className="absolute top-0 left-0 right-0 h-[3px] kente-stripe z-10" />

      {/* Ambient glow — stronger, broadcast-focused */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 25% 70%, rgba(240,165,0,0.07) 0%, transparent 65%)," +
            "radial-gradient(ellipse 45% 45% at 80% 15%, rgba(74,158,255,0.04) 0%, transparent 60%)," +
            "radial-gradient(ellipse 50% 40% at 50% 100%, rgba(240,165,0,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Scanlines — desktop only */}
      <div className="absolute inset-0 scanlines opacity-40 pointer-events-none hidden md:block" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-10 p-5 lg:p-10 pt-7">
        {/* Anchor column — primary visual anchor, do not shrink */}
        <div className="flex flex-row lg:flex-col items-start gap-4 flex-shrink-0">
          <AnchorAvatar />
          <div className="flex flex-col gap-3 flex-1 lg:flex-none lg:w-[190px]">
            <Nameplate />
            <WaveformBar />
            <PlaybackControls />
          </div>
        </div>

        {/* Content column — broadcast is the focus */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          <BroadcastHeader />

          {/* Headline — largest element on screen */}
          <h1
            className="font-orbitron font-bold leading-[1.2] tracking-tight text-crypto-text"
            style={{ fontSize: "clamp(18px, 2.6vw, 28px)" }}
            dangerouslySetInnerHTML={{ __html: story?.headline ?? "Loading broadcast…" }}
          />

          <ScriptDisplay />
          <ProgressRow />
          <SourceMeta />

          {/* Queue — secondary, collapsed by default on mobile */}
          <QueuePanel />
        </div>
      </div>
    </section>
  );
}

/* ── Sub-components ── */
function Nameplate() {
  return (
    <div className="bg-[rgba(240,165,0,0.07)] border border-crypto-border-g rounded-lg px-3.5 py-2 text-center w-full">
      <p className="font-orbitron text-[10px] font-bold text-gold tracking-[0.05em]">CRYZTATOKEN</p>
      <p className="font-mono text-[8px] text-crypto-text3 tracking-[0.15em] uppercase mt-0.5">
        of Africa · AI Anchor
      </p>
    </div>
  );
}

function WaveformBar() {
  const anchorState = useBroadcastStore((s) => s.anchorState);
  const isSpeaking  = anchorState === "speaking";
  const isPaused    = anchorState === "paused";

  const label = isSpeaking ? "SPEAKING" : isPaused ? "PAUSED" : "READY";
  const labelColor = isSpeaking ? "text-gold" : isPaused ? "text-crypto-text3" : "text-crypto-text3";

  return (
    <div className="flex items-center gap-1 h-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          id={`wbar-${i}`}
          className="wave-bar transition-opacity duration-300"
          style={{
            // WaveformEngine.start() takes over animation via direct style writes.
            // When not speaking, show a minimal static bar.
            animationPlayState: isSpeaking ? "running" : "paused",
            transform:  isSpeaking ? undefined : `scaleY(${isPaused ? 0.1 : 0.18})`,
            opacity:    isSpeaking ? undefined : isPaused ? 0.15 : 0.25,
          }}
        />
      ))}
      <span className={`font-mono text-[8px] tracking-[0.14em] ml-1.5 min-w-[52px] transition-colors duration-300 ${labelColor}`}>
        {label}
      </span>
    </div>
  );
}

function BroadcastHeader() {
  const { currentIdx, stories } = useBroadcastStore();
  const now = new Date();
  const utc = now.toUTCString().replace(" GMT", "") + " UTC";

  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 bg-[rgba(240,165,0,0.10)] border border-crypto-border-g rounded px-3 py-1">
        <span className="w-[5px] h-[5px] bg-crypto-red rounded-full animate-blink-dot-fast" />
        <span className="font-mono text-[9px] text-gold tracking-[0.12em] uppercase">
          Segment {currentIdx + 1} of {stories.length}
        </span>
      </div>
      <span className="font-mono text-[9px] text-crypto-text3 tracking-[0.06em] hidden sm:block">
        {utc}
      </span>
    </div>
  );
}

function ProgressRow() {
  const { progress, currentTime, duration } = useBroadcastStore();
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div>
      <div className="h-[3px] bg-crypto-bg4 rounded-full overflow-hidden cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-gold-dim to-gold rounded-full transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[9px] text-crypto-text3">{fmt(currentTime)}</span>
        <span className="font-mono text-[9px] text-crypto-text3">{fmt(duration)}</span>
      </div>
    </div>
  );
}

function SourceMeta() {
  const story = useBroadcastStore((s) => s.currentStory);
  if (!story) return null;
  return (
    <div className="flex gap-4 flex-wrap">
      {[story.source, "AI Script", story.duration].map((item) => (
        <span key={item} className="flex items-center gap-1.5 font-mono text-[9px] text-crypto-text3">
          <span className="w-[3px] h-[3px] bg-crypto-text3 rounded-full" />
          {item}
        </span>
      ))}
    </div>
  );
}
