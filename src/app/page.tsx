"use client";

import { useEffect } from "react";
import { TickerBar }        from "@/components/layout/TickerBar";
import { Header }           from "@/components/layout/Header";
import { StatsBar }         from "@/components/layout/StatsBar";
import { BroadcastPlayer }  from "@/components/broadcast/BroadcastPlayer";
import { IntroSequence }    from "@/components/broadcast/IntroSequence";
import { DailyBriefing }    from "@/components/broadcast/DailyBriefing";
import { SentimentSidebar } from "@/components/sentiment/SentimentSidebar";
import { PriceGrid }        from "@/components/market/PriceGrid";
import { QAPanel }          from "@/components/qa/QAPanel";
import { AdsPanel }         from "@/components/ads/AdsPanel";
import { Footer }           from "@/components/layout/Footer";
import { MobileNav }        from "@/components/layout/MobileNav";
import { Toast }            from "@/components/ui/Toast";
import { useBroadcastStore } from "@/store/broadcastStore";
import { usePriceStore }     from "@/store/priceStore";
import { useUIStore }        from "@/store/uiStore";

export default function HomePage() {
  const initBroadcast  = useBroadcastStore((s) => s.init);
  const initPrices     = usePriceStore((s) => s.init);
  const introComplete  = useUIStore((s) => s.introComplete);

  useEffect(() => {
    initBroadcast();
    initPrices();
  }, [initBroadcast, initPrices]);

  return (
    <>
      {/* ── Intro sequence — overlays everything, shown once per session ── */}
      {!introComplete && <IntroSequence />}

      {/* ── Chrome — always rendered so stores boot while intro plays ── */}
      <TickerBar />
      <Header />
      <StatsBar />

      {/* ── Daily briefing strip — appears once per calendar day ── */}
      {introComplete && <DailyBriefing />}

      {/* ── Main content — fades in after intro ── */}
      <div className={introComplete ? "content-enter" : "opacity-0 pointer-events-none"}>

        {/*
          Layout hierarchy (visual weight order):
          1. BroadcastPlayer   — full width, dominant
          2. SentimentSidebar  — right rail, supporting
          3. PriceGrid         — informational, below fold
          4. QAPanel           — community, below fold
          5. AdsPanel          — monetisation, bottom
        */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] min-h-[calc(100vh-124px)]">

          {/* Left col: broadcast primary + secondary panels below */}
          <div className="flex flex-col">
            <BroadcastPlayer />

            {/* Secondary panels — visually subordinate via reduced padding and muted borders */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 border-t border-crypto-border"
              style={{ opacity: 0.92 }}   // subtle de-emphasis vs broadcast
            >
              <div className="border-r border-crypto-border">
                <PriceGrid />
              </div>
              <QAPanel />
            </div>
          </div>

          {/* Right sidebar — supporting role, never competes with broadcast */}
          <SentimentSidebar data-sidebar />

        </div>

        {/* Ads — clearly below fold, separated by stronger border */}
        <div className="border-t-2 border-crypto-border">
          <AdsPanel />
        </div>

        <Footer />
      </div>

      <MobileNav />
      <Toast />
    </>
  );
}

