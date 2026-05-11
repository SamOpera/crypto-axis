"use client";

import useSWR        from "swr";
import { useState }  from "react";
import { useUIStore } from "@/store/uiStore";
import type { QAReply, ApiDiscussionResponse } from "@/types";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function QAPanel({ inline = false }: { inline?: boolean }) {
  const { data, mutate } = useSWR<ApiDiscussionResponse>(
    "/api/discussions",
    fetcher,
    { refreshInterval: 60_000 }
  );

  if (!data) {
    return (
      <div className={`${inline ? "" : "p-5 lg:p-6"} flex flex-col gap-3`}>
        <div className="skeleton h-[80px] rounded-xl" />
        <div className="skeleton h-[70px] rounded-xl" />
      </div>
    );
  }

  const Wrapper = inline ? InlineWrapper : SectionWrapper;

  return (
    <Wrapper>
      {/* Daily question */}
      <div className="bg-gradient-to-br from-[rgba(240,165,0,0.08)] to-[rgba(240,165,0,0.03)] border border-[rgba(240,165,0,0.18)] rounded-xl p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[8px] tracking-[0.18em] uppercase text-gold">🔥 Daily Question</span>
          <div className="flex-1 h-px bg-[rgba(240,165,0,0.18)]" />
        </div>
        <p className="text-[13px] font-medium leading-relaxed text-crypto-text">
          {data.question}
        </p>
      </div>

      {/* Thread */}
      <div className="flex flex-col gap-0">
        {data.replies.map(reply => (
          <ReplyCard key={reply.id} reply={reply} onVote={mutate} />
        ))}
      </div>

      {/* Reply input */}
      <ReplyForm onSubmit={mutate} />
    </Wrapper>
  );
}

function ReplyCard({ reply, onVote }: { reply: QAReply; onVote: () => void }) {
  const [upCount, setUpCount] = useState(reply.up);
  const [voted,   setVoted]   = useState(false);

  const handleUp = () => {
    if (voted) return;
    setUpCount(c => c + 1);
    setVoted(true);
  };

  return (
    <div className="flex gap-2 pb-2.5 mb-2.5 border-b border-white/[0.04] animate-fade-in-up">
      <div
        className="w-[26px] h-[26px] rounded-full flex-shrink-0 flex items-center justify-center font-orbitron text-[9px] font-bold text-crypto-bg"
        style={{ background: `linear-gradient(135deg, ${reply.color}88, ${reply.color}44)` }}
      >
        {reply.user[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className="font-mono text-[9px] font-bold text-crypto-text">{reply.user}</span>
          {reply.rep > 0 && (
            <span className="font-orbitron text-[8px] text-gold bg-gold-glass px-1.5 py-0.5 rounded">
              {reply.rep}
            </span>
          )}
          <span className="font-mono text-[8px] text-crypto-text3 ml-auto">
            {timeAgo(reply.ts)}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-crypto-text2">{reply.text}</p>
        <div className="flex gap-2.5 mt-1.5">
          <button
            onClick={handleUp}
            className={`font-mono text-[8px] uppercase tracking-wide border-none bg-none cursor-pointer transition-colors ${
              voted ? "text-gold" : "text-crypto-text3 hover:text-gold"
            }`}
          >
            ▲ {upCount}
          </button>
          <button className="font-mono text-[8px] uppercase tracking-wide border-none bg-none cursor-pointer text-crypto-text3 hover:text-gold transition-colors">
            Reply
          </button>
          <button className="font-mono text-[8px] uppercase tracking-wide border-none bg-none cursor-pointer text-crypto-text3 hover:text-gold transition-colors">
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplyForm({ onSubmit }: { onSubmit: () => void }) {
  const [text,  setText]    = useState("");
  const [busy,  setBusy]    = useState(false);
  const { walletAddress, walletConnected, showToast } = useUIStore();

  const charLeft = 300 - text.length;

  const handleSend = async () => {
    if (!text.trim() || text.length < 5) return showToast("Reply too short", "error");
    setBusy(true);
    try {
      const res = await fetch("/api/discussions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          user: walletConnected && walletAddress
            ? walletAddress.slice(0, 10)
            : `anon_${Math.random().toString(36).slice(2, 6)}`,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setText("");
      onSubmit();
      showToast("Reply posted!", "success");
    } catch {
      showToast("Failed to post reply", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        <input
          value={text}
          onChange={e => setText(e.target.value.slice(0, 300))}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Share your take…"
          className="flex-1 bg-crypto-bg5 border border-crypto-border rounded-lg px-3 py-2 font-mono text-[10px] text-crypto-text placeholder:text-crypto-text3 outline-none focus:border-crypto-border-g transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={busy}
          className="bg-gold text-crypto-bg font-orbitron text-[9px] font-bold border-none rounded-lg px-3 py-2 cursor-pointer hover:bg-gold-light transition-all disabled:opacity-40 whitespace-nowrap"
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
      <p className={`font-mono text-[8px] text-right mt-1 ${charLeft < 30 ? "text-crypto-red" : "text-crypto-text3"}`}>
        {charLeft} left
      </p>
    </div>
  );
}

function InlineWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>;
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-5 lg:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-[3px] h-[14px] bg-gold rounded-full" />
        <h2 className="font-orbitron text-[10px] font-bold tracking-[0.14em] uppercase text-gold">
          Today's Discussion
        </h2>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}
