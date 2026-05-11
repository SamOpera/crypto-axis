import type { PriceData } from "@/types";

function seedHistory(price: number) {
  return Array.from({ length: 24 }, (_, i) => ({
    v: price * (1 + (Math.random() - 0.5) * 0.04),
    t: Date.now() - (23 - i) * 3_600_000,
  }));
}

export const PRICE_SEED: Record<string, PriceData> = {
  BTC: { sym:"BTC", id:"bitcoin",     name:"Bitcoin",   cls:"btc", price:98421,  chg:2.14,  vol24h:0, mcap:0, delta:0, status:"loading", history:seedHistory(98421)  },
  ETH: { sym:"ETH", id:"ethereum",    name:"Ethereum",  cls:"eth", price:3847,   chg:1.87,  vol24h:0, mcap:0, delta:0, status:"loading", history:seedHistory(3847)   },
  SOL: { sym:"SOL", id:"solana",      name:"Solana",    cls:"sol", price:178.40, chg:-0.92, vol24h:0, mcap:0, delta:0, status:"loading", history:seedHistory(178.40) },
  BNB: { sym:"BNB", id:"binancecoin", name:"BNB Chain", cls:"bnb", price:612.30, chg:3.41,  vol24h:0, mcap:0, delta:0, status:"loading", history:seedHistory(612.30) },
};
