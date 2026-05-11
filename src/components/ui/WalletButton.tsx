"use client";

import { useUIStore } from "@/store/uiStore";

export function WalletButton() {
  const { walletConnected, walletAddress, walletLoading, connectWallet } = useUIStore();

  const label = walletLoading
    ? "Connecting…"
    : walletConnected && walletAddress
    ? `⬡ ${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
    : "⬡ Connect Wallet";

  return (
    <button
      onClick={connectWallet}
      disabled={walletLoading}
      className={`
        font-orbitron text-[10px] font-bold tracking-[0.07em] rounded-lg px-4 py-2.5
        border-none cursor-pointer transition-all whitespace-nowrap
        disabled:opacity-50 disabled:cursor-not-allowed
        ${walletConnected
          ? "bg-[rgba(240,165,0,0.12)] text-gold border border-crypto-border-g hover:bg-[rgba(240,165,0,0.18)]"
          : "bg-gold text-crypto-bg hover:bg-gold-light hover:shadow-[0_4px_18px_rgba(240,165,0,0.3)]"
        }
      `}
    >
      {label}
    </button>
  );
}
