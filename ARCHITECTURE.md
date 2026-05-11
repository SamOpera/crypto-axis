# CryptoChannel Africa — Full System Architecture
## Production-Grade AI Crypto Media Platform

---

## BRAND IDENTITY (Extracted from existing broadcast)

| Property | Value |
|---|---|
| Platform Name | CryptoChannel Africa |
| AI Anchor | Cryztatoken of Africa |
| Anchor Title | Africa's Premier Crypto Correspondent |
| Color — Gold | #f5c842 |
| Color — Green (accent) | #00e084 |
| Color — Red (live/alert) | #cc2200 |
| Color — Dark BG | #060a08 |
| Typography Display | Bebas Neue |
| Typography Body | IBM Plex Sans |
| Typography Mono | IBM Plex Mono |
| Cultural Identity | Pan-African (Kente collar, Red/Gold/Green badge) |

---

## PHASE 1 — SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                   GLOBAL CDN (Cloudflare)            │
│              Static assets, Edge caching             │
└───────────────────┬─────────────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────┐
│            NEXT.JS FRONTEND (App Router)             │
│   SSR/ISR pages + WebSocket real-time client        │
│   Deployed: Vercel / AWS CloudFront                 │
└───────────────────┬─────────────────────────────────┘
                    │ REST + WebSocket
┌───────────────────▼─────────────────────────────────┐
│        API GATEWAY (Kong / AWS API Gateway)         │
│        Auth, Rate Limiting, Load Balancing          │
└──────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │
   ┌───▼───┐  ┌──▼────┐  ┌──▼────┐  ┌──▼────────┐
   │ News  │  │ Users │  │  Ads  │  │ Broadcast │
   │Service│  │Service│  │Service│  │  Service  │
   └───┬───┘  └──┬────┘  └──┬────┘  └──┬────────┘
       │         │          │           │
┌──────▼─────────▼──────────▼───────────▼──────────────┐
│                PostgreSQL (Primary DB)                │
│           Partitioned + Read Replicas                 │
└────────────────────────────────────────────────────-─┘
                    │
┌───────────────────▼────────────────────────────────-─┐
│                Redis Cluster                          │
│    Sessions, Cache, Pub/Sub, Real-time queues        │
└──────────────────────────────────────────────────────┘
                    │
┌───────────────────▼────────────────────────────────-─┐
│                AI PIPELINE                           │
│  News Fetch → Summarize → Script → TTS → Avatar     │
│  (OpenAI GPT-4o + ElevenLabs + D-ID / HeyGen)      │
└──────────────────────────────────────────────────────┘
```

---

## PHASE 2 — MICROSERVICES BREAKDOWN

### Service 1: Broadcast Service
**Responsibility:** AI anchor pipeline, story generation, TTS, WebSocket broadcast
- Tech: NestJS + Bull queue + Redis pub/sub
- Endpoints:
  - `GET /broadcast/current` — current live story
  - `WS /broadcast/live` — real-time story stream
  - `POST /broadcast/generate` — admin trigger new broadcast
- Pipeline:
  1. CryptoCompare/CoinGecko API → raw news
  2. GPT-4o → summarize + generate anchor script
  3. ElevenLabs → TTS audio file
  4. Upload to S3/R2 CDN
  5. Push via WebSocket to all clients

### Service 2: User Service
**Responsibility:** Auth, profiles, reputation scoring
- Tech: NestJS + Passport.js + JWT
- Endpoints:
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /users/:id/profile`
  - `GET /users/:id/reputation`

### Service 3: Sentiment Service
**Responsibility:** Trader bias posts, votes, leaderboard
- Tech: NestJS
- Endpoints:
  - `GET /sentiment` — paginated feed
  - `POST /sentiment` — create post
  - `POST /sentiment/:id/vote`
  - `GET /sentiment/leaderboard`

### Service 4: Discussion Service
**Responsibility:** Q&A, daily topics, threaded replies
- Tech: NestJS
- Endpoints:
  - `GET /discussions`
  - `POST /discussions`
  - `POST /discussions/:id/replies`
  - `GET /discussions/daily` — AI-generated daily question

### Service 5: Ads Service
**Responsibility:** Wallet payments, ad creation, placement
- Tech: NestJS + ethers.js + wagmi
- Endpoints:
  - `POST /ads/create`
  - `POST /ads/pay` — wallet tx verification
  - `GET /ads/active` — currently running ads
  - `GET /ads/slots` — available placements

### Service 6: Prices Service
**Responsibility:** Real-time crypto prices via WebSocket ticker
- Tech: NestJS + CoinGecko WebSocket / CryptoCompare Stream
- Pushes to Redis pub/sub → all connected clients

---

## PHASE 3 — DATABASE SCHEMA (PostgreSQL)

```sql
-- USERS
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(50) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  wallet_address VARCHAR(42),
  reputation_score INTEGER DEFAULT 0,
  role          VARCHAR(20) DEFAULT 'user', -- user | moderator | admin
  country       VARCHAR(60),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_active   TIMESTAMPTZ
);

-- NEWS CONTENT
CREATE TABLE news_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url    TEXT,
  source_name   VARCHAR(100),
  raw_headline  TEXT NOT NULL,
  raw_body      TEXT,
  ai_summary    TEXT,           -- GPT-4o summary
  anchor_script TEXT,           -- Spoken script for Cryztatoken
  tts_audio_url TEXT,           -- ElevenLabs generated audio
  thumbnail_url TEXT,
  category      VARCHAR(50),    -- market | regulation | defi | nft | macro
  assets_mentioned TEXT[],      -- ['BTC', 'ETH']
  status        VARCHAR(20) DEFAULT 'pending', -- pending | live | archived
  broadcast_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- SENTIMENT POSTS (Trader Bias)
CREATE TABLE sentiment_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  asset         VARCHAR(20) NOT NULL,   -- 'BTC', 'ETH', etc.
  bias          VARCHAR(10) NOT NULL,   -- 'bullish' | 'bearish'
  reasoning     TEXT NOT NULL,
  target_price  NUMERIC(20,8),
  timeframe     VARCHAR(20),            -- '24h' | '1w' | '1m'
  upvotes       INTEGER DEFAULT 0,
  downvotes     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ            -- auto-expire after 7 days
);
CREATE INDEX ON sentiment_posts(asset);
CREATE INDEX ON sentiment_posts(created_at DESC);

-- VOTES
CREATE TABLE votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  entity_type   VARCHAR(20) NOT NULL,  -- 'sentiment' | 'discussion' | 'reply'
  entity_id     UUID NOT NULL,
  vote_type     VARCHAR(10) NOT NULL,  -- 'up' | 'down'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- DISCUSSIONS (Q&A)
CREATE TABLE discussions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id),
  type          VARCHAR(20) DEFAULT 'user', -- 'user' | 'ai_daily' | 'ai_weekly'
  title         TEXT NOT NULL,
  body          TEXT,
  is_pinned     BOOLEAN DEFAULT false,
  upvotes       INTEGER DEFAULT 0,
  reply_count   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- DISCUSSION REPLIES
CREATE TABLE discussion_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  parent_id     UUID REFERENCES discussion_replies(id), -- threaded
  body          TEXT NOT NULL,
  upvotes       INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ADS
CREATE TABLE ads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID REFERENCES users(id),
  company_name  VARCHAR(200) NOT NULL,
  tagline       TEXT,
  creative_url  TEXT,           -- Banner image / video
  cta_url       TEXT,
  placement     VARCHAR(30) NOT NULL, -- 'banner' | 'broadcast_segment' | 'anchor_mention'
  status        VARCHAR(20) DEFAULT 'pending', -- pending | active | expired | rejected
  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TRANSACTIONS (Crypto payments for ads)
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id         UUID REFERENCES ads(id),
  payer_wallet  VARCHAR(42) NOT NULL,
  chain         VARCHAR(20) NOT NULL,  -- 'ethereum' | 'polygon' | 'base'
  token         VARCHAR(10) NOT NULL,  -- 'ETH' | 'USDT' | 'USDC'
  amount_wei    NUMERIC(40) NOT NULL,
  amount_usd    NUMERIC(12,2),
  tx_hash       VARCHAR(66) UNIQUE,
  status        VARCHAR(20) DEFAULT 'pending', -- pending | confirmed | failed
  confirmed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- BROADCAST SESSIONS (analytics)
CREATE TABLE broadcast_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at    TIMESTAMPTZ NOT NULL,
  ended_at      TIMESTAMPTZ,
  stories_count INTEGER DEFAULT 0,
  peak_viewers  INTEGER DEFAULT 0,
  total_listeners INTEGER DEFAULT 0
);

-- PRICE SNAPSHOTS (for chart history)
CREATE TABLE price_snapshots (
  id            BIGSERIAL PRIMARY KEY,
  asset         VARCHAR(20) NOT NULL,
  price_usd     NUMERIC(20,8) NOT NULL,
  change_24h    NUMERIC(8,4),
  market_cap    NUMERIC(30,2),
  volume_24h    NUMERIC(30,2),
  snapshot_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON price_snapshots(asset, snapshot_at DESC);

-- Partition price_snapshots by month for scale
-- ALTER TABLE price_snapshots PARTITION BY RANGE (snapshot_at);
```

---

## PHASE 4 — SCALABILITY DESIGN

### CDN Strategy
- **Cloudflare** for global edge caching
- Static assets (avatar SVGs, fonts, scripts) → cached at edge
- TTS audio files → R2 (Cloudflare) or S3 with CDN prefix
- WebSocket connections → Cloudflare Durable Objects or dedicated WebSocket servers per region

### Real-Time Architecture
```
Client Browser
    │
    │ WebSocket (Socket.IO)
    ▼
Load Balancer (sticky sessions)
    │
    ▼
NestJS WebSocket Gateway
    │
    ├── Subscribe to Redis Pub/Sub channels:
    │     - broadcast:live (new story events)
    │     - prices:tick (real-time prices)
    │     - sentiment:new (new posts)
    │
    └── Emit to client namespaces
```

### Horizontal Scaling Rules
| Service | Scaling Strategy |
|---|---|
| Broadcast | 1 leader, N readers; leader publishes to Redis |
| Prices | Single WebSocket feed → Redis fanout |
| Users/Auth | Stateless, scale freely |
| Sentiment | Scale with DB read replicas |
| Ads | Low traffic, scale conservatively |

### Caching Strategy
- Redis TTL: price data = 5s, news list = 30s, user sessions = 24h
- PostgreSQL: pgBouncer for connection pooling
- Next.js: ISR for public pages (60s revalidation)

### Database Scaling
- Read replicas for analytics queries
- Partition `price_snapshots` by month
- Archive old `news_items` to cold storage (S3) after 90 days
- CQRS for high-write paths (votes, views)

---

## PHASE 5 — MVP ROADMAP

### Week 1–2: Foundation
- [ ] Initialize monorepo (Turborepo)
- [ ] Next.js app with Tailwind + global design system
- [ ] NestJS API starter with JWT auth
- [ ] PostgreSQL schema deployment (Prisma migrations)
- [ ] Redis setup
- [ ] Static broadcast UI (Cryztatoken avatar, ticker, headlines)
- [ ] Manual news entry → display in broadcast
- [ ] Price ticker from CoinGecko API (polling)

### Week 3–4: AI Core + Real-Time
- [ ] OpenAI GPT-4o news summarization pipeline
- [ ] ElevenLabs TTS integration
- [ ] Automated news fetch + script generation (every 2h)
- [ ] WebSocket: real-time price updates to clients
- [ ] WebSocket: live broadcast story push
- [ ] Trader Sentiment: post, vote, feed
- [ ] User auth: register, login, profile

### Month 2+: Platform Features
- [ ] Q&A Discussion system (daily AI questions)
- [ ] Crypto ad payment system (MetaMask + WalletConnect)
- [ ] Ad placement scheduler + broadcast integration
- [ ] Reputation scoring system
- [ ] Mobile-responsive optimization
- [ ] Analytics dashboard (admin)
- [ ] Multilingual support (French, Swahili, Hausa)
- [ ] D-ID or HeyGen animated avatar upgrade
- [ ] Africa-specific market coverage (CBDC, P2P markets)

---

## PHASE 6 — PROJECT STRUCTURE

```
cryptochannel-africa/
├── apps/
│   ├── web/                    # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (broadcast)/
│   │   │   │   ├── page.tsx    # Main broadcast page
│   │   │   │   └── layout.tsx
│   │   │   ├── sentiment/
│   │   │   │   └── page.tsx    # Trader bias feed
│   │   │   ├── discuss/
│   │   │   │   └── page.tsx    # Q&A
│   │   │   ├── advertise/
│   │   │   │   └── page.tsx    # Ad payment portal
│   │   │   └── api/            # Next.js API routes (BFF)
│   │   ├── components/
│   │   │   ├── broadcast/
│   │   │   │   ├── CryztatokenAvatar.tsx
│   │   │   │   ├── NewsPanel.tsx
│   │   │   │   ├── PriceTicker.tsx
│   │   │   │   ├── StoryNav.tsx
│   │   │   │   └── BroadcastLayout.tsx
│   │   │   ├── sentiment/
│   │   │   ├── discuss/
│   │   │   └── ui/             # Design system components
│   │   └── lib/
│   │       ├── socket.ts       # WebSocket client
│   │       ├── api.ts          # API client
│   │       └── web3.ts         # Wallet connection
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── broadcast/
│       │   │   ├── broadcast.module.ts
│       │   │   ├── broadcast.gateway.ts  # WebSocket
│       │   │   ├── broadcast.service.ts
│       │   │   └── broadcast.controller.ts
│       │   ├── news/
│       │   ├── users/
│       │   ├── sentiment/
│       │   ├── discussions/
│       │   ├── ads/
│       │   ├── prices/
│       │   └── ai/
│       │       ├── ai.module.ts
│       │       ├── openai.service.ts
│       │       ├── tts.service.ts
│       │       └── news-pipeline.service.ts
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── ui/                     # Shared component library
│   ├── types/                  # Shared TypeScript types
│   └── config/                 # Shared configs
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   └── k8s/                    # Kubernetes manifests (Month 2+)
│
├── turbo.json
├── package.json
└── README.md
```

---

## ENVIRONMENT VARIABLES

```env
# API Keys
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=         # Cryztatoken's voice ID
COINGECKO_API_KEY=
CRYPTOCOMPARE_API_KEY=

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Web3
ALCHEMY_API_KEY=             # For tx verification
PAYMENT_WALLET_ADDRESS=      # Platform's receiving wallet

# Storage
AWS_S3_BUCKET=               # or Cloudflare R2
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
CDN_BASE_URL=

# Frontend
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_WS_URL=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```
