// ─── ScriptDisplay.tsx ────────────────────────────────────────
"use client";

import { useEffect, useState, useRef } from "react";
import { useBroadcastStore } from "@/store/broadcastStore";

export function ScriptDisplay() {
  const story      = useBroadcastStore((s) => s.currentStory);
  const isPlaying  = useBroadcastStore((s) => s.isPlaying);
  const [displayed, setDisplayed] = useState("");
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const versionRef = useRef(0);

  useEffect(() => {
    if (!story) return;
    // New story — reset
    versionRef.current++;
    const ver = versionRef.current;
    setDisplayed("");
    let i = 0;

    const tick = () => {
      if (versionRef.current !== ver) return;
      if (!isPlaying) { timerRef.current = setTimeout(tick, 200); return; }
      if (i <= story.script.length) {
        setDisplayed(story.script.slice(0, i));
        i++;
        timerRef.current = setTimeout(tick, 28);
      }
    };
    tick();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  return (
    <div
      className="border-l-[3px] border-l-gold rounded-r-[10px] px-4 py-3.5 font-mono leading-[1.85] text-white/82 min-h-[88px]"
      style={{
        background:  "rgba(255,255,255,0.02)",
        border:      "1px solid rgba(255,255,255,0.06)",
        borderLeft:  "3px solid #F0A500",
        fontSize:    "clamp(11px, 1.2vw, 13px)",
      }}
    >
      {displayed}
      <span className="inline-block w-[2px] h-[13px] bg-gold animate-cur-blink align-text-bottom ml-0.5" />
    </div>
  );
}
