"use client";

import { useEffect, useState } from "react";
import { usePriceStore }       from "@/store/priceStore";

export function StatsBar() {
  const [clock, setClock]     = useState("");
  const prices                = usePriceStore(s => s.prices);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(
        [n.getUTCHours(), n.getUTCMinutes(), n.getUTCSeconds()]
          .map(v => String(v).padStart(2, "0"))
          .join(":")
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Derive totals from price store
  const totalMcap = Object.values(prices).reduce((s, p) => s + (p.mcap || 0), 0);
  const totalVol  = Object.values(prices).reduce((s, p) => s + (p.vol24h || 0), 0);
  const btcDom    = totalMcap > 0
    ? ((prices.BTC?.mcap ?? 0) / totalMcap * 100).toFixed(1) + "%"
    : "—";

  const stats = [
    { label: "Market Cap",   value: totalMcap > 0 ? "$" + fmtLarge(totalMcap) : "$3.41T", cls: "" },
    { label: "24H Vol",      value: totalVol  > 0 ? "$" + fmtLarge(totalVol)  : "$187B",  cls: "text-crypto-green" },
    { label: "BTC Dom.",     value: btcDom,                                                cls: "text-gold" },
    { label: "Fear & Greed", value: "74 — Greed",                                         cls: "text-crypto-green" },
    { label: "Stories",      value: "4 live",                                              cls: "text-gold" },
  ];

  return (
    <div className="h-[38px] bg-crypto-bg2 border-b border-crypto-border flex items-center px-4 lg:px-6 overflow-x-auto scrollbar-none">
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-center gap-2 flex-shrink-0 px-3 lg:px-4 ${i > 0 ? "border-l border-crypto-border" : ""}`}>
          <span className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3">
            {s.label}
          </span>
          <span className={`font-orbitron text-[12px] font-bold ${s.cls || "text-crypto-text"}`}>
            {s.value}
          </span>
        </div>
      ))}
      {/* Clock — pinned right */}
      <div className="ml-auto flex items-center gap-2 flex-shrink-0 pl-4">
        <span className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3">UTC</span>
        <span className="font-orbitron text-[11px] font-bold text-crypto-text tracking-[0.05em]">{clock}</span>
      </div>
    </div>
  );
}

function fmtLarge(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
  return n.toLocaleString();
}
