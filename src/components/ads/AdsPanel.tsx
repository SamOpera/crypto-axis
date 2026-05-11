"use client";

import { useUIStore } from "@/store/uiStore";

export function AdsPanel() {
  const showToast = useUIStore(s => s.showToast);

  return (
    <div className="border-t border-crypto-border grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
      {/* Sponsored ad */}
      <div className="p-5 border-r border-crypto-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-[3px] h-[14px] bg-gold rounded-full" />
          <h2 className="font-orbitron text-[10px] font-bold tracking-[0.14em] uppercase text-gold">Sponsored</h2>
        </div>
        <div className="bg-gradient-to-br from-[rgba(74,158,255,0.08)] to-[rgba(74,158,255,0.03)] border border-[rgba(74,158,255,0.18)] rounded-xl p-4 relative overflow-hidden mb-3">
          <span className="absolute top-2 right-2 font-mono text-[7px] text-[rgba(74,158,255,0.45)] tracking-[0.12em] uppercase">Sponsored</span>
          <p className="font-orbitron text-[15px] font-black text-crypto-blue mb-1.5">BYBIT PRO</p>
          <p className="text-[11px] text-crypto-text2 leading-relaxed mb-3">
            Trade crypto with up to 100× leverage. Zero fees for 30 days. Africa's fastest growing exchange.
          </p>
          <button className="font-mono text-[9px] font-bold text-crypto-bg bg-crypto-blue border-none rounded-md px-3.5 py-1.5 cursor-pointer hover:brightness-125 transition-all">
            Trade Now →
          </button>
        </div>
      </div>

      {/* Ad slot */}
      <div className="p-5 border-r border-crypto-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-[3px] h-[14px] bg-gold rounded-full" />
          <h2 className="font-orbitron text-[10px] font-bold tracking-[0.14em] uppercase text-gold">Advertise</h2>
        </div>
        <button
          onClick={() => showToast("Connect wallet to create an ad campaign", "gold")}
          className="w-full bg-crypto-bg4 border border-dashed border-crypto-border-g rounded-xl p-5 text-center cursor-pointer hover:border-gold hover:bg-[rgba(240,165,0,0.03)] transition-all"
        >
          <p className="text-[20px] mb-1.5">⬡</p>
          <p className="font-orbitron text-[11px] font-bold text-gold mb-1">Run Your Ad Here</p>
          <p className="font-mono text-[9px] text-crypto-text3 leading-relaxed">
            Pay via ETH or USDT.<br />
            50K+ traders daily.<br />
            Banner · Broadcast · Anchor Mention
          </p>
        </button>
      </div>

      {/* Stats */}
      <div className="p-5 hidden lg:block">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-[3px] h-[14px] bg-gold rounded-full" />
          <h2 className="font-orbitron text-[10px] font-bold tracking-[0.14em] uppercase text-gold">Ad Rates</h2>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { type: "Banner",           price: "$50 USDT / day" },
            { type: "Sidebar Card",     price: "$80 USDT / day" },
            { type: "Sponsored Segment",price: "$200 / slot"    },
            { type: "Anchor Mention",   price: "$500 / read"    },
          ].map(r => (
            <div key={r.type} className="flex justify-between items-center py-1.5 border-b border-crypto-border">
              <span className="font-mono text-[10px] text-crypto-text2">{r.type}</span>
              <span className="font-orbitron text-[10px] font-bold text-gold">{r.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
