"use client";

import useSWR        from "swr";
import { useState }  from "react";
import { useUIStore } from "@/store/uiStore";
import type { SentimentPost, ApiSentimentResponse } from "@/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

/* ── Reputation tier system ── */
const REP_TIERS = [
  { min: 0,    max: 199,  label: "Rookie",   color: "#4A5068", bg: "rgba(74,80,104,0.15)"   },
  { min: 200,  max: 499,  label: "Trader",   color: "#627EEA", bg: "rgba(98,126,234,0.15)"  },
  { min: 500,  max: 999,  label: "Analyst",  color: "#00E5A0", bg: "rgba(0,229,160,0.15)"   },
  { min: 1000, max: 2499, label: "Veteran",  color: "#F0A500", bg: "rgba(240,165,0,0.15)"   },
  { min: 2500, max: Infinity, label: "Elite",color: "#FF3B5C", bg: "rgba(255,59,92,0.15)"   },
];

function getRepTier(rep: number) {
  return REP_TIERS.find(t => rep >= t.min && rep <= t.max) ?? REP_TIERS[0];
}

/* ── Conviction score derived from votes + rep ── */
function convictionScore(post: SentimentPost): number {
  const net     = post.up - post.down;
  const total   = post.up + post.down;
  const winRate = total > 0 ? post.up / total : 0.5;
  const repMod  = Math.min(1, post.rep / 1000);
  // 0–100: weighted blend of net votes, win rate, and author rep
  return Math.min(100, Math.round((net * 0.4 + winRate * 40 + repMod * 20)));
}

function convictionLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Very High",  color: "#00E5A0" };
  if (score >= 60) return { label: "High",       color: "#90E040" };
  if (score >= 40) return { label: "Medium",     color: "#F0A500" };
  if (score >= 20) return { label: "Low",        color: "#FF8C40" };
  return              { label: "Very Low",   color: "#FF3B5C" };
}

/* ────────────────────────────────────────── */

export function SentimentFeed() {
  const { data, mutate } = useSWR<ApiSentimentResponse>(
    "/api/sentiment",
    fetcher,
    { refreshInterval: 30_000 }
  );

  if (!data) return <SentimentSkeleton />;

  return (
    <div className="flex flex-col gap-2.5">
      <SentimentIndex bull={data.bullPct} bear={data.bearPct} total={data.total} />
      {data.posts.map(post => (
        <SentimentCard key={post.id} post={post} onVote={mutate} />
      ))}
      {data.posts.length === 0 && (
        <div className="text-center py-6">
          <p className="font-mono text-[10px] text-crypto-text3">No posts yet. Be first.</p>
        </div>
      )}
    </div>
  );
}

/* ── Sentiment index bar ── */
function SentimentIndex({
  bull, bear, total,
}: { bull: number; bear: number; total: number }) {
  return (
    <div className="bg-crypto-bg4 border border-crypto-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[8px] tracking-[0.15em] uppercase text-crypto-text3">
          Market Sentiment · BTC · 24H
        </p>
        <span className="font-mono text-[8px] text-crypto-text3">{total} posts</span>
      </div>

      {/* Dual-direction bar */}
      <div className="h-[6px] bg-crypto-bg5 rounded-full overflow-hidden mb-2 flex">
        <div
          className="h-full bg-gradient-to-r from-crypto-green to-[#00C890] rounded-l-full transition-[width] duration-[1200ms]"
          style={{ width: `${bull}%` }}
        />
        <div
          className="h-full bg-gradient-to-l from-crypto-red to-[#CC2040] rounded-r-full transition-[width] duration-[1200ms]"
          style={{ width: `${bear}%` }}
        />
      </div>

      <div className="flex justify-between font-orbitron text-[11px] font-semibold">
        <span className="text-crypto-green">▲ {bull}% Bullish</span>
        <span className="text-crypto-red">{bear}% Bearish ▼</span>
      </div>
    </div>
  );
}

/* ── Sentiment card ── */
function SentimentCard({ post, onVote }: { post: SentimentPost; onVote: () => void }) {
  const [up,       setUp]   = useState(post.up);
  const [down,     setDown] = useState(post.down);
  const [vote,     setVote] = useState<1 | -1 | null>(post.userVote);
  const [expanded, setExpanded] = useState(false);
  const showToast = useUIStore(s => s.showToast);

  const tier       = getRepTier(post.rep);
  const conviction = convictionScore({ ...post, up, down });
  const convLabel  = convictionLabel(conviction);
  const isBull     = post.bias === "bull";

  const handleVote = async (v: 1 | -1) => {
    const prev = vote;
    if (prev === v) {
      setVote(null);
      v === 1 ? setUp(u => u - 1) : setDown(d => d - 1);
    } else {
      if (prev === 1)  setUp(u => u - 1);
      if (prev === -1) setDown(d => d - 1);
      v === 1 ? setUp(u => u + 1) : setDown(d => d + 1);
      setVote(v);
    }
    try {
      await fetch(`/api/sentiment/${post.id}/vote`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ value: v }),
      });
    } catch {
      showToast("Vote failed", "error");
    }
  };

  const reasonNeedsExpand = post.reason.length > 100;
  const displayReason     = expanded || !reasonNeedsExpand
    ? post.reason
    : post.reason.slice(0, 100) + "…";

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{
        background:  "rgba(24,28,36,1)",
        borderColor: "rgba(255,255,255,0.06)",
        // Subtle left accent colour based on bias
        borderLeft:  `3px solid ${isBull ? "rgba(0,229,160,0.5)" : "rgba(255,59,92,0.5)"}`,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(240,165,0,0.20)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)")}
    >
      {/* Header row */}
      <div className="flex items-start justify-between px-3 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <AssetPill asset={post.asset} />
          <div>
            <p className="font-orbitron text-[11px] font-semibold text-crypto-text leading-none">
              {post.asset}
            </p>
            <p className="font-mono text-[8px] text-crypto-text3 mt-0.5">{post.tf}</p>
          </div>
        </div>

        {/* Bias badge */}
        <div
          className="flex items-center gap-1 px-2 py-1 rounded-md font-orbitron text-[9px] font-bold"
          style={{
            background: isBull ? "rgba(0,229,160,0.10)" : "rgba(255,59,92,0.10)",
            color:      isBull ? "#00E5A0"              : "#FF3B5C",
            border:     `1px solid ${isBull ? "rgba(0,229,160,0.22)" : "rgba(255,59,92,0.22)"}`,
          }}
        >
          {isBull ? "▲" : "▼"} {isBull ? "BULL" : "BEAR"}
        </div>
      </div>

      {/* Conviction bar */}
      <div className="px-3 mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-[8px] text-crypto-text3 tracking-[0.08em] uppercase">
            Conviction
          </span>
          <span
            className="font-mono text-[8px] font-bold"
            style={{ color: convLabel.color }}
          >
            {convLabel.label} · {conviction}
          </span>
        </div>
        <div className="h-[3px] bg-crypto-bg5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width:      `${Math.max(4, conviction)}%`,
              background: `linear-gradient(90deg, ${convLabel.color}80, ${convLabel.color})`,
            }}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div className="px-3 pb-2">
        <p className="text-[11px] text-crypto-text2 leading-[1.6]">
          {displayReason}
        </p>
        {reasonNeedsExpand && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="font-mono text-[9px] text-gold mt-1 bg-none border-none cursor-pointer hover:text-gold-light transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-3 pb-3 pt-1.5 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        {/* Author + rep tier */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div
            className="w-[20px] h-[20px] rounded-full flex items-center justify-center font-orbitron text-[8px] font-bold text-crypto-bg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${tier.color}99, ${tier.color})` }}
          >
            {post.user[0].toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[9px] text-crypto-text truncate">
                {post.user}
              </span>
              {/* Tier badge */}
              <span
                className="font-orbitron text-[7px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: tier.bg, color: tier.color }}
              >
                {tier.label}
              </span>
            </div>
            <p className="font-mono text-[8px] text-crypto-text3">
              {post.rep} rep · {timeAgo(post.ts)}
            </p>
          </div>
        </div>

        {/* Votes */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => handleVote(1)}
            className="flex items-center gap-1 font-mono text-[9px] rounded px-2 py-1 cursor-pointer border transition-all"
            style={{
              background:  vote === 1 ? "rgba(0,229,160,0.08)" : "rgba(255,255,255,0.03)",
              borderColor: vote === 1 ? "rgba(0,229,160,0.35)"  : "rgba(255,255,255,0.08)",
              color:       vote === 1 ? "#00E5A0"               : "#4A5068",
            }}
          >
            ▲ {up}
          </button>
          <button
            onClick={() => handleVote(-1)}
            className="flex items-center gap-1 font-mono text-[9px] rounded px-2 py-1 cursor-pointer border transition-all"
            style={{
              background:  vote === -1 ? "rgba(255,59,92,0.08)"  : "rgba(255,255,255,0.03)",
              borderColor: vote === -1 ? "rgba(255,59,92,0.35)"   : "rgba(255,255,255,0.08)",
              color:       vote === -1 ? "#FF3B5C"                : "#4A5068",
            }}
          >
            ▼ {down}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Asset pill ── */
const ASSET_COLORS: Record<string, [string, string]> = {
  BTC: ["rgba(247,147,26,0.12)",  "#F7931A"],
  ETH: ["rgba(98,126,234,0.12)", "#627EEA"],
  SOL: ["rgba(153,69,255,0.12)", "#9945FF"],
  BNB: ["rgba(240,185,11,0.12)", "#F0B90B"],
  XRP: ["rgba(0,180,255,0.12)",  "#00B4FF"],
  ADA: ["rgba(0,51,173,0.18)",   "#4D88FF"],
};

function AssetPill({ asset }: { asset: string }) {
  const [bg, text] = ASSET_COLORS[asset] ?? ["rgba(240,165,0,0.12)", "#F0A500"];
  return (
    <div
      className="w-[26px] h-[26px] rounded-full flex items-center justify-center font-orbitron text-[8px] font-bold flex-shrink-0"
      style={{ background: bg, color: text, border: `1px solid ${text}44` }}
    >
      {asset.slice(0, 3)}
    </div>
  );
}

/* ── Skeleton ── */
function SentimentSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[110, 130, 115].map((h, i) => (
        <div key={i} className="skeleton rounded-xl" style={{ height: h }} />
      ))}
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
