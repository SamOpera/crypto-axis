/* ── Broadcast ── */
export interface Story {
  id:          number;
  headline:    string;    // may contain <mark> tags
  script:      string;
  source:      string;
  duration:    string;    // "1m 24s"
  durationSec: number;
  category:    StoryCategory;
}

export type StoryCategory = "BITCOIN" | "ETHEREUM" | "AFRICA" | "DEFI" | "MARKETS" | "REGULATION" | "NFT";

export type AnchorState   = "idle" | "speaking" | "paused";
export type PlaybackState = "idle" | "playing" | "paused";

/* ── Prices ── */
export interface PricePoint { v: number; t: number; }
export type PriceStatus = "loading" | "live" | "stale";

export interface PriceData {
  sym:     string;
  id:      string;   // CoinGecko id
  name:    string;
  cls:     string;   // css class suffix
  price:   number;
  chg:     number;   // 24h % change
  vol24h:  number;
  mcap:    number;
  delta:   number;   // last tick delta
  status:  PriceStatus;
  history: PricePoint[];
}

/* ── Sentiment ── */
export type Bias      = "bull" | "bear";
export type Timeframe = "SCALP" | "SWING" | "POSITION";

export interface SentimentPost {
  id:       number;
  asset:    string;
  bias:     Bias;
  reason:   string;
  tf:       Timeframe;
  user:     string;
  rep:      number;
  up:       number;
  down:     number;
  userVote: 1 | -1 | null;
  ts:       number;
}

/* ── Q&A ── */
export interface QAReply {
  id:       number;
  user:     string;
  color:    string;
  rep:      number;
  text:     string;
  up:       number;
  userVote: 1 | null;
  ts:       number;
}

/* ── API Responses ── */
export interface ApiNewsResponse {
  stories: Story[];
  total:   number;
}

export interface ApiSentimentResponse {
  posts:      SentimentPost[];
  total:      number;
  bullPct:    number;
  bearPct:    number;
}

export interface ApiDiscussionResponse {
  question: string;
  replies:  QAReply[];
  total:    number;
}
