"use client";

import { useUIStore } from "@/store/uiStore";

export function Toast() {
  const { toasts, dismissToast } = useUIStore();

  return (
    <div className="fixed bottom-[80px] lg:bottom-6 right-4 lg:right-6 flex flex-col gap-2 z-[1000] pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`
            animate-toast-in max-w-[280px] px-4 py-3 rounded-xl font-mono text-[11px]
            shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto cursor-pointer
            bg-crypto-bg4 border
            ${t.type === "success" ? "border-[rgba(0,229,160,0.35)] text-crypto-green"
            : t.type === "error"   ? "border-[rgba(255,59,92,0.35)]  text-crypto-red"
            : t.type === "gold"    ? "border-crypto-border-g           text-gold"
            :                        "border-crypto-border              text-crypto-text"
            }
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
