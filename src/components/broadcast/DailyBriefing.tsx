"use client";

/**
 * DailyBriefing.tsx
 *
 * Appears directly below the StatsBar on first load of each day.
 * Dismissed with a single click. Stores dismissal in localStorage
 * keyed to today's date so it re-appears the next calendar day.
 *
 * Content:
 *  - Today's date + market session (Asia/Europe/Americas)
 *  - Top trader sentiment from the last 24h
 *  - BTC daily change highlight
 *  - Daily question teaser
 *  - "Start Daily Briefing" CTA that opens the Q&A tab
 *
 * Engineering notes:
 *  - Reads from priceStore (already initialised by page.tsx)
 *  - Does NOT make its own API calls
 *  - Renders null if already dismissed today
 *  - Animation: slides down from StatsBar
 */

import { useEffect, useState } from "react";
import { usePriceStore }  from "@/store/priceStore";
import { useUIStore }     from "@/store/uiStore";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10); // "2026-05-10"
}

function getMarketSession(): { name: string; color: string } {
  const hour = new Date().getUTCHours();
  if (hour >= 0  && hour < 8)  return { name: "Asia Session",     color: "#4A9EFF" };
  if (hour >= 8  && hour < 14) return { name: "Europe Session",   color: "#00E5A0" };
  if (hour >= 14 && hour < 22) return { name: "Americas Session", color: "#F0A500" };
  return { name: "After Hours", color: "#8A90A8" };
}

function formatDate() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function DailyBriefing() {
  const [dismissed, setDismissed] = useState(true); // start hidden, check on mount
  const btc           = usePriceStore((s) => s.prices["BTC"]);
  const setActiveTab  = useUIStore((s) => s.setActiveTab);

  useEffect(() => {
    // Only show if not dismissed today
    const stored = localStorage.getItem("cc_briefing_dismissed");
    if (stored !== getTodayKey()) {
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cc_briefing_dismissed", getTodayKey());
    setDismissed(true);
  };

  if (dismissed) return null;

  const session = getMarketSession();
  const btcUp   = (btc?.chg ?? 0) >= 0;
  const btcChg  = btc?.chg?.toFixed(2) ?? "—";
  const btcPx   = btc?.price
    ? "$" + btc.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : "$—";

  const handleReadBriefing = () => {
    setActiveTab("discuss");
    dismiss();
    // Scroll sidebar into view on mobile
    document.querySelector("[data-sidebar]")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="briefing-enter border-b border-crypto-border overflow-hidden"
      style={{
        background: "linear-gradient(90deg, rgba(240,165,0,0.04) 0%, rgba(7,8,12,0) 60%)",
      }}
    >
      <div className="flex items-center gap-0 px-4 lg:px-6 py-2.5 flex-wrap gap-y-2">

        {/* Date + session */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: session.color }}
            />
            <span
              className="font-mono text-[9px] font-bold tracking-[0.10em] uppercase"
              style={{ color: session.color }}
            >
              {session.name}
            </span>
          </div>
          <span className="font-mono text-[9px] text-crypto-text3 tracking-[0.04em]">
            {formatDate()}
          </span>
        </div>

        <div className="w-px h-4 bg-crypto-border mx-3 hidden md:block flex-shrink-0" />

        {/* BTC snapshot */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[9px] text-crypto-text3">BTC</span>
          <span className="font-orbitron text-[11px] font-bold text-crypto-text">
            {btcPx}
          </span>
          <span
            className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
              btcUp
                ? "bg-crypto-green/10 text-crypto-green"
                : "bg-crypto-red/10 text-crypto-red"
            }`}
          >
            {btcUp ? "+" : ""}{btcChg}%
          </span>
        </div>

        <div className="w-px h-4 bg-crypto-border mx-3 hidden md:block flex-shrink-0" />

        {/* Daily question teaser */}
        <div className="flex items-center gap-2 flex-1 min-w-0 hidden sm:flex">
          <span className="font-mono text-[8px] text-gold tracking-[0.10em] uppercase flex-shrink-0">
            Today:
          </span>
          <span className="font-mono text-[9px] text-crypto-text2 truncate">
            Will Bitcoin confirm $100K before end of May 2026?
          </span>
        </div>

        {/* Actions — pinned right */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          <button
            onClick={handleReadBriefing}
            className="font-orbitron text-[9px] font-bold text-crypto-bg bg-gold border-none rounded-md px-3 py-1.5 cursor-pointer hover:bg-gold-light transition-all tracking-[0.06em]"
          >
            Daily Q&amp;A →
          </button>
          <button
            onClick={dismiss}
            className="font-mono text-[10px] text-crypto-text3 bg-none border-none cursor-pointer hover:text-crypto-text transition-colors leading-none px-1"
            aria-label="Dismiss daily briefing"
          >
            ✕
          </button>
        </div>

      </div>
    </div>
  );
}
