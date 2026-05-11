"use client";

import { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/store/uiStore";

const NAV = [
  { id: "broadcast",  label: "Live",      icon: LiveIcon      },
  { id: "markets",    label: "Markets",   icon: MarketsIcon   },
  { id: "sentiment",  label: "Sentiment", icon: SentimentIcon },
  { id: "discuss",    label: "Q&A",       icon: DiscussIcon   },
];

export function MobileNav() {
  const { mobileSection, setMobileSection, setActiveTab, connectWallet } = useUIStore();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const navRef   = useRef<HTMLDivElement>(null);
  const btnRefs  = useRef<(HTMLButtonElement | null)[]>([]);

  // Track active button position for sliding indicator
  useEffect(() => {
    const activeIdx = NAV.findIndex(n => n.id === mobileSection);
    const idx       = activeIdx === -1 ? 0 : activeIdx;
    const btn       = btnRefs.current[idx];
    const nav       = navRef.current;
    if (!btn || !nav) return;
    const btnRect = btn.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    setIndicatorStyle({
      left:  btnRect.left - navRect.left,
      width: btnRect.width,
    });
  }, [mobileSection]);

  const handleNav = (id: string) => {
    setMobileSection(id);

    if (id === "broadcast") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (id === "markets") {
      // Scroll to the price grid section
      const priceEl = document.getElementById("section-markets");
      priceEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (id === "sentiment") {
      setActiveTab("sentiment");
      const sidebar = document.querySelector("[data-sidebar]");
      sidebar?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (id === "discuss") {
      setActiveTab("discuss");
      const sidebar = document.querySelector("[data-sidebar]");
      sidebar?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[200]"
      style={{
        background:   "rgba(10,12,18,0.97)",
        backdropFilter: "blur(24px)",
        borderTop:    "1px solid rgba(255,255,255,0.07)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      <div ref={navRef} className="relative flex">
        {/* Sliding active indicator */}
        <div
          className="absolute top-0 h-[2px] bg-gold rounded-full transition-all duration-200"
          style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        />

        {NAV.map((item, i) => {
          const active = mobileSection === item.id;
          const Icon   = item.icon;
          return (
            <button
              key={item.id}
              ref={el => { btnRefs.current[i] = el; }}
              onClick={() => handleNav(item.id)}
              className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 border-none bg-none cursor-pointer transition-colors"
              style={{ color: active ? "#F0A500" : "#4A5068" }}
            >
              <Icon active={active} />
              <span
                className="font-mono tracking-[0.06em] uppercase"
                style={{ fontSize: "9px" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── SVG Icons — cleaner than emoji, consistent sizing ── */
function LiveIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="3" fill={active ? "#F0A500" : "none"} stroke={active ? "#F0A500" : "currentColor"}/>
      <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4"/>
      <path d="M9.4 9.4a4 4 0 0 0 0 5.2M14.6 9.4a4 4 0 0 1 0 5.2"/>
    </svg>
  );
}

function MarketsIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function SentimentIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <path d="M2 20h20M6 20V12M10 20V8M14 20V4M18 20v-8"/>
    </svg>
  );
}

function DiscussIcon({ active }: { active: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
