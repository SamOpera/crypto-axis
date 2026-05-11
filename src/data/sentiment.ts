import type { SentimentPost, QAReply } from "@/types";

export const SENTIMENT_SEED: SentimentPost[] = [
  { id:101, asset:"BTC", bias:"bull", reason:"HTF structure is clean — higher highs on the weekly. ETF flows confirm. $100K before end of Q2. DCA and hold.", tf:"POSITION", user:"alade_onchain", rep:847,  up:142, down:18, userVote:null, ts:Date.now()-720000  },
  { id:102, asset:"ETH", bias:"bear", reason:"ETH underperforming BTC for 6 weeks. L2 cannibalising mainnet fees. Rotating into BTC and SOL until ratio reclaims.", tf:"SWING", user:"kemi_nakamoto", rep:612, up:87, down:34, userVote:null, ts:Date.now()-1800000 },
  { id:103, asset:"SOL", bias:"bull", reason:"DEX volumes, NFT activity, meme launches — everything on SOL is firing. Alt-season bellwether. $250 before $150.", tf:"SWING", user:"tunde_mvp", rep:1240, up:203, down:29, userVote:null, ts:Date.now()-3600000 },
];

export const QA_SEED: QAReply[] = [
  { id:201, user:"alade_onchain", color:"#F7931A", rep:847,  text:"Weekly close above $96K with volume confirms the breakout. Next resistance is $100K psychological. After that, price discovery.", up:42, userVote:null, ts:Date.now()-720000  },
  { id:202, user:"tunde_mvp",     color:"#9945FF", rep:1240, text:"MVRV-Z score still not in extreme greed territory. On-chain says room to run. $100K confirmed before May 20 — screenshot this.", up:76, userVote:null, ts:Date.now()-1680000 },
  { id:203, user:"fatima_defi",   color:"#00E5A0", rep:531,  text:"Careful — CME futures gap at $91K still open. Markets love to fill gaps before continuing. Possible wick down first.", up:31, userVote:null, ts:Date.now()-2640000 },
];

export const DAILY_QUESTION = "Will Bitcoin confirm $100K before end of May 2026? What's your technical case?";
