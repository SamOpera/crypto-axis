"use client";

import { usePriceStore } from "@/store/priceStore";

export function TickerBar() {
  const prices = usePriceStore(s => s.prices);

  const items = Object.entries(prices).map(([sym, d]) => {
    const up  = d.chg >= 0;
    const px  = d.price >= 1000
      ? "$" + d.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : "$" + d.price.toFixed(2);
    return { sym, px, chg: `${up ? "▲ +" : "▼ "}${Math.abs(d.chg).toFixed(2)}%`, up };
  });

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="h-[28px] bg-gold flex items-center overflow-hidden flex-shrink-0 relative z-[100]">
      {/* Label */}
      <div className="bg-crypto-bg text-gold h-full px-3.5 flex items-center font-mono text-[9px] tracking-[0.18em] uppercase gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 bg-crypto-red rounded-full animate-blink-dot" />
        LIVE
      </div>

      {/* Scrolling track */}
      <div className="flex gap-10 whitespace-nowrap animate-ticker-scroll font-mono text-[10px] font-bold text-crypto-bg pl-6">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {item.sym}/USD{" "}
            <span className={item.up ? "text-[#005520]" : "text-[#880020]"}>
              {item.px} {item.chg}
            </span>
            <span className="opacity-35 mx-1">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
