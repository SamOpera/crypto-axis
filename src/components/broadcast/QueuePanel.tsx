"use client";

import { useBroadcastStore } from "@/store/broadcastStore";

export function QueuePanel() {
  const { stories, currentIdx, queueOpen, jumpTo, toggleQueue } = useBroadcastStore();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-crypto-text3">
          📋 Broadcast Queue
        </span>
        <button
          onClick={toggleQueue}
          className="font-mono text-[8px] text-crypto-text3 hover:text-gold bg-none border-none cursor-pointer uppercase tracking-[0.06em] transition-colors"
        >
          {queueOpen ? "Hide ▲" : "Show ▼"}
        </button>
      </div>

      {queueOpen && (
        <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto">
          {stories.map((story, i) => (
            <button
              key={story.id}
              onClick={() => jumpTo(i)}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left w-full
                border transition-all
                ${i === currentIdx
                  ? "border-crypto-border-g bg-gold/[0.05]"
                  : "border-transparent bg-white/[0.02] hover:border-crypto-border hover:bg-white/[0.04]"
                }
              `}
            >
              {i === currentIdx ? (
                <span className="w-1.5 h-1.5 bg-gold rounded-full animate-blink-dot flex-shrink-0" />
              ) : (
                <span className={`font-orbitron text-[10px] font-bold w-[18px] flex-shrink-0 ${i === currentIdx ? "text-gold" : "text-crypto-text3"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              )}
              <span
                className={`text-[11px] flex-1 leading-tight ${i === currentIdx ? "text-crypto-text" : "text-crypto-text3"}`}
                // Strip HTML tags for display
                dangerouslySetInnerHTML={{ __html: story.headline.replace(/<[^>]*>/g, "") }}
              />
              <span className="font-mono text-[9px] text-crypto-text3 flex-shrink-0">
                {story.duration}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
