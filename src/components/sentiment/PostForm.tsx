"use client";

import { useState } from "react";
import { useUIStore } from "@/store/uiStore";
import type { Bias, Timeframe } from "@/types";

const POPULAR_ASSETS = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA"];
const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "SCALP",    label: "Scalp"    },
  { id: "SWING",    label: "Swing"    },
  { id: "POSITION", label: "Position" },
];

export function PostForm() {
  const { walletConnected, walletAddress, showToast, setActiveTab } = useUIStore();

  const [asset,  setAsset]  = useState("");
  const [bias,   setBias]   = useState<Bias | null>(null);
  const [tf,     setTF]     = useState<Timeframe>("SWING");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const charLeft = 500 - reason.length;

  const handleChip = (sym: string) => {
    setAsset(sym);
  };

  const handleSubmit = async () => {
    if (!asset.trim())    return showToast("Enter an asset symbol", "error");
    if (!bias)            return showToast("Select Bullish or Bearish", "error");
    if (reason.length < 10) return showToast("Add at least 10 chars of reasoning", "error");

    setLoading(true);
    try {
      const res = await fetch("/api/sentiment", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset: asset.toUpperCase(),
          bias,
          reason,
          tf,
          user: walletConnected && walletAddress
            ? walletAddress.slice(0, 10)
            : `trader_${Math.random().toString(36).slice(2, 7)}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Submit failed");
      }

      // Reset form
      setAsset("");
      setBias(null);
      setReason("");
      showToast("✓ Sentiment posted!", "success");
      setActiveTab("sentiment");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Submit failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-crypto-bg4 border border-crypto-border rounded-xl p-3 flex flex-col gap-3">
      <p className="font-orbitron text-[10px] font-bold text-gold">Post Market Bias</p>

      {/* Asset quick-chips */}
      <div>
        <label className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3 block mb-2">
          Asset
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {POPULAR_ASSETS.map(sym => (
            <button
              key={sym}
              onClick={() => handleChip(sym)}
              className={`font-orbitron text-[8px] font-bold px-2 py-1 rounded border transition-all cursor-pointer ${
                asset === sym
                  ? "bg-gold-glass border-crypto-border-g text-gold"
                  : "bg-white/[0.03] border-crypto-border text-crypto-text3 hover:border-white/20"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
        <input
          value={asset}
          onChange={e => setAsset(e.target.value.toUpperCase())}
          placeholder="Or type another..."
          className="w-full bg-crypto-bg5 border border-crypto-border rounded-lg px-3 py-2 font-mono text-[11px] text-crypto-text placeholder:text-crypto-text3 outline-none focus:border-crypto-border-g transition-colors"
        />
      </div>

      {/* Bias */}
      <div>
        <label className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3 block mb-2">
          Bias
        </label>
        <div className="flex gap-2">
          {(["bull", "bear"] as Bias[]).map(b => (
            <button
              key={b}
              onClick={() => setBias(b)}
              className={`flex-1 py-2.5 rounded-lg font-orbitron text-[10px] font-bold border cursor-pointer transition-all ${
                bias === b
                  ? b === "bull"
                    ? "bg-[rgba(0,229,160,0.1)] border-[rgba(0,229,160,0.35)] text-crypto-green"
                    : "bg-[rgba(255,59,92,0.1)]  border-[rgba(255,59,92,0.35)]  text-crypto-red"
                  : "bg-white/[0.03] border-crypto-border text-crypto-text3 hover:border-white/20"
              }`}
            >
              {b === "bull" ? "▲ BULLISH" : "▼ BEARISH"}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3 block mb-2">
          Timeframe
        </label>
        <div className="flex gap-1.5">
          {TIMEFRAMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTF(t.id)}
              className={`flex-1 py-2 rounded-lg font-mono text-[8px] tracking-wide border cursor-pointer transition-all ${
                tf === t.id
                  ? "bg-gold-glass border-crypto-border-g text-gold"
                  : "bg-white/[0.03] border-crypto-border text-crypto-text3 hover:border-white/15"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <label className="font-mono text-[8px] tracking-[0.14em] uppercase text-crypto-text3 block mb-2">
          Reasoning{" "}
          <span className={`${charLeft < 50 ? "text-crypto-red" : "text-crypto-text3"}`}>
            ({reason.length}/500)
          </span>
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value.slice(0, 500))}
          placeholder="Technical or fundamental analysis..."
          rows={3}
          className="w-full bg-crypto-bg5 border border-crypto-border rounded-lg px-3 py-2.5 font-mono text-[11px] text-crypto-text placeholder:text-crypto-text3 outline-none focus:border-crypto-border-g transition-colors resize-none leading-relaxed"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-2.5 bg-gold text-crypto-bg font-orbitron text-[10px] font-bold tracking-[0.09em] uppercase border-none rounded-lg cursor-pointer transition-all hover:bg-gold-light hover:shadow-[0_4px_14px_rgba(240,165,0,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? "Posting…" : "⬡ Post Sentiment"}
      </button>

      <p className="font-mono text-[9px] text-crypto-text3 text-center leading-[1.7]">
        Rep earned through accuracy.
        {!walletConnected && <><br />Connect wallet to post on-chain.</>}
      </p>
    </div>
  );
}
