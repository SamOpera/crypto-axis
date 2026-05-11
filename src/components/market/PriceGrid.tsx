"use client";

import { usePriceStore } from "@/store/priceStore";
import { useUIStore }    from "@/store/uiStore";
import { useRef }        from "react";
import type { PriceData } from "@/types";

export function PriceGrid() {
  return (
    <div id="section-markets" className="p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-[3px] h-[14px] bg-gold rounded-full" />
        <h2 className="font-orbitron text-[10px] font-bold tracking-[0.14em] uppercase text-gold">
          Live Prices
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["BTC", "ETH", "SOL", "BNB"].map((sym) => (
          <PriceCard key={sym} sym={sym} />
        ))}
      </div>
    </div>
  );
}

function PriceCard({ sym }: { sym: string }) {
  const data        = usePriceStore((s) => s.prices[sym]);
  const showToast   = useUIStore((s) => s.showToast);
  const flashRef    = useRef<string | null>(null);

  if (!data) return <div className="skeleton h-[90px] rounded-lg" />;

  const up     = data.chg >= 0;
  const fmtPx  = formatPrice(sym, data.price);
  const status = data.status;

  const handleClick = () => {
    showToast(
      `${sym}: ${fmtPx} · Vol $${fmtLarge(data.vol24h)} 24h`,
      "gold"
    );
  };

  return (
    <button
      onClick={handleClick}
      className={`
        bg-crypto-bg4 border rounded-lg p-3 text-left
        hover:border-crypto-border-g hover:translate-y-[-2px]
        transition-all duration-150 cursor-pointer
        ${status === "stale" ? "opacity-55" : ""}
        border-crypto-border
      `}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-orbitron text-[11px] font-bold text-crypto-text">{sym}</span>
        <span
          className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
            up ? "bg-green/10 text-crypto-green" : "bg-red/10 text-crypto-red"
          }`}
        >
          {up ? "+" : ""}{data.chg.toFixed(2)}%
        </span>
      </div>

      <div
        className={`font-orbitron text-[16px] font-bold leading-none mb-1 transition-colors duration-200 ${
          data.delta > 0
            ? "text-crypto-green"
            : data.delta < 0
            ? "text-crypto-red"
            : "text-crypto-text"
        }`}
      >
        {fmtPx}
      </div>

      <div className="font-mono text-[8px] text-crypto-text3 mb-2">
        {data.name}
        {status === "stale" && (
          <span className="ml-1.5 text-yellow-600">stale</span>
        )}
      </div>

      {/* Sparkline */}
      <Sparkline history={data.history} up={up} />
    </button>
  );
}

function Sparkline({ history, up }: { history: { v: number; t: number }[]; up: boolean }) {
  if (history.length < 2) return <div className="h-[22px]" />;
  const vals   = history.map(h => h.v);
  const mn     = Math.min(...vals);
  const mx     = Math.max(...vals);
  const rng    = mx - mn || 1;
  const W = 80, H = 24;
  const step   = W / (vals.length - 1);
  const pts    = vals.map((v, i) =>
    `${(i * step).toFixed(1)},${(H - ((v - mn) / rng) * (H - 4) - 2).toFixed(1)}`
  ).join(" ");
  const color  = up ? "#00E5A0" : "#FF3B5C";
  const fill   = up ? "rgba(0,229,160,0.1)" : "rgba(255,59,92,0.1)";

  return (
    <div className="h-[22px] mt-1.5">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full">
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points={`${pts} ${W},${H} 0,${H}`} fill={fill} stroke="none"/>
      </svg>
    </div>
  );
}

function formatPrice(sym: string, price: number): string {
  if (!price) return "$—";
  if (price >= 1000) return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1)    return "$" + price.toFixed(2);
  return "$" + price.toFixed(4);
}

function fmtLarge(n: number): string {
  if (!n) return "—";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return (n / 1e9).toFixed(1)  + "B";
  if (n >= 1e6)  return (n / 1e6).toFixed(1)  + "M";
  return n.toLocaleString();
}
