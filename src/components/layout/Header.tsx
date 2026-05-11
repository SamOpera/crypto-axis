"use client";

import { useUIStore } from "@/store/uiStore";
import { WalletButton } from "@/components/ui/WalletButton";
import { useEffect, useState } from "react";

const NAV_ITEMS = ["Broadcast", "Markets", "Sentiment", "Discuss", "Advertise"];

export function Header() {
  const { menuOpen, toggleMenu } = useUIStore();
  const [viewers, setViewers]   = useState(2841);

  // Simulated viewer count — replace with real WebSocket
  useEffect(() => {
    const t = setInterval(() => {
      setViewers(v => Math.max(2500, v + Math.floor(Math.random() * 7) - 3));
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-[58px] bg-[rgba(7,8,12,0.96)] backdrop-blur-[24px] border-b border-crypto-border flex items-center px-4 lg:px-6 gap-0 sticky top-0 z-[90]">
      {/* Logo */}
      <a href="/" className="flex items-center gap-2.5 flex-shrink-0 no-underline">
        <div className="w-[34px] h-[34px] bg-gold rounded-lg flex items-center justify-center font-orbitron text-[11px] font-black text-crypto-bg">
          CC
        </div>
        <div className="leading-none">
          <p className="font-orbitron text-[13px] font-bold text-gold tracking-[0.04em]">CryptoChannel</p>
          <p className="font-mono text-[8px] text-crypto-text3 tracking-[0.18em] uppercase mt-0.5">Africa · Live Network</p>
        </div>
      </a>

      {/* Desktop nav */}
      <nav className="hidden lg:flex gap-0.5 items-center ml-6 flex-1">
        {NAV_ITEMS.map((item, i) => (
          <button
            key={item}
            className={`font-mono text-[10px] tracking-[0.08em] uppercase text-crypto-text3 bg-none border-none px-3.5 py-1.5 rounded-md cursor-pointer transition-all hover:text-gold hover:bg-gold-glass ${i === 0 ? "text-gold bg-gold-glass" : ""}`}
          >
            {item}
          </button>
        ))}
        <div className="flex items-center gap-1.5 bg-[rgba(255,59,92,0.1)] border border-[rgba(255,59,92,0.3)] rounded-md px-2.5 py-1.5 ml-2">
          <span className="w-1.5 h-1.5 bg-crypto-red rounded-full animate-blink-dot-fast" />
          <span className="font-orbitron text-[9px] font-bold text-crypto-red tracking-[0.1em]">ON AIR</span>
        </div>
      </nav>

      {/* Right */}
      <div className="flex items-center gap-2.5 ml-auto flex-shrink-0">
        <span className="hidden lg:flex items-center gap-1.5 font-mono text-[10px] text-crypto-text3">
          🌍 <span className="text-crypto-text2">{viewers.toLocaleString()}</span> watching
        </span>
        <WalletButton />
        {/* Hamburger */}
        <button
          onClick={toggleMenu}
          className="lg:hidden flex flex-col gap-[5px] bg-none border-none cursor-pointer p-1 ml-1"
          aria-label="Menu"
        >
          <span className="block w-[22px] h-[2px] bg-crypto-text2 rounded transition-all" />
          <span className="block w-[22px] h-[2px] bg-crypto-text2 rounded transition-all" />
          <span className="block w-[22px] h-[2px] bg-crypto-text2 rounded transition-all" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="lg:hidden absolute top-[58px] left-0 right-0 bg-crypto-bg2 border-b border-crypto-border px-4 py-3 flex flex-col gap-1 z-[88]">
          {NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={toggleMenu}
              className="font-mono text-[10px] tracking-[0.08em] uppercase text-crypto-text3 bg-none border-none py-2.5 text-left cursor-pointer hover:text-gold transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
