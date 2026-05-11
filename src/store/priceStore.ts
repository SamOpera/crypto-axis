/**
 * priceStore.ts
 * Live crypto price state. Fetches from CoinGecko free API.
 * Falls back to seed data if API is unavailable.
 */
import { create } from "zustand";
import type { PriceData } from "@/types";
import { PRICE_SEED } from "@/data/prices";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const POLL_MS        = 30_000;  // 30s — safe for free tier
const SPARK_MS       = 300_000; // 5min — heavy endpoint

const COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
};

interface PriceStore {
  prices:         Record<string, PriceData>;
  lastUpdated:    number | null;
  isLive:         boolean;
  error:          string | null;
  init:           () => void;
  _fetch:         () => Promise<void>;
  _fetchSparklines: () => Promise<void>;
}

export const usePriceStore = create<PriceStore>()((set, get) => ({
  prices:      PRICE_SEED,
  lastUpdated: null,
  isLive:      false,
  error:       null,

  init() {
    // Fetch immediately, then poll
    get()._fetch().then(() => get()._fetchSparklines());

    const poll  = setInterval(() => get()._fetch(), POLL_MS);
    const spark = setInterval(() => get()._fetchSparklines(), SPARK_MS);

    // Pause when hidden, resume when visible
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) get()._fetch();
      });
    }

    // Cleanup handled by page unmount — in production use a store middleware
    return () => { clearInterval(poll); clearInterval(spark); };
  },

  async _fetch() {
    const ids = Object.values(COIN_IDS).join(",");
    const url = `${COINGECKO_BASE}/simple/price?ids=${ids}`
              + `&vs_currencies=usd&include_24hr_change=true`
              + `&include_24hr_vol=true&include_market_cap=true`;
    try {
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000), next: { revalidate: 0 } } as RequestInit);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const updated: Record<string, PriceData> = { ...get().prices };
      Object.entries(COIN_IDS).forEach(([sym, id]) => {
        const raw = data[id];
        if (!raw) return;
        const prev   = updated[sym];
        const newPrice = raw.usd ?? prev.price;
        updated[sym] = {
          ...prev,
          price:      newPrice,
          chg:        raw.usd_24h_change  ?? prev.chg,
          vol24h:     raw.usd_24h_vol     ?? prev.vol24h,
          mcap:       raw.usd_market_cap  ?? prev.mcap,
          delta:      newPrice - prev.price,
          status:     "live",
          history: [
            ...prev.history.slice(-47),
            { v: newPrice, t: Date.now() },
          ],
        };
      });

      set({ prices: updated, lastUpdated: Date.now(), isLive: true, error: null });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn("[PriceStore] fetch failed:", msg);
      set({ error: msg, isLive: false });
      // Mark prices stale
      const stale = Object.fromEntries(
        Object.entries(get().prices).map(([k, v]) => [k, { ...v, status: "stale" as const }])
      );
      set({ prices: stale });
    }
  },

  async _fetchSparklines() {
    const syms = Object.entries(COIN_IDS);
    for (const [sym, id] of syms) {
      try {
        const url = `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=1&interval=hourly`;
        const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const data = await res.json();
        if (!data.prices?.length) continue;

        const history = (data.prices as [number, number][]).map(([t, v]) => ({ t, v }));
        set((s) => ({
          prices: {
            ...s.prices,
            [sym]: { ...s.prices[sym], history },
          },
        }));
      } catch {
        // Non-critical — keep existing sparklines
      }
      await new Promise((r) => setTimeout(r, 600)); // stagger CoinGecko calls
    }
  },
}));
