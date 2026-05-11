# CryptoChannel Africa — Next.js Application

AI-powered crypto media platform. Cryztatoken of Africa broadcasts live crypto news 24/7.

## Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 14 (App Router)             |
| Language   | TypeScript (strict)                 |
| Styling    | Tailwind CSS (custom design tokens) |
| State      | Zustand (3 stores)                  |
| Data fetch | SWR                                 |
| Audio      | Web Speech API + HTMLAudioElement   |
| Prices     | CoinGecko free API                  |
| Animation  | Framer Motion + CSS                 |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Home — composes all sections
│   ├── globals.css         # Tailwind base + design tokens
│   └── api/
│       ├── news/           # GET /api/news
│       ├── sentiment/      # GET/POST /api/sentiment
│       │   └── [id]/vote/  # POST /api/sentiment/:id/vote
│       └── discussions/    # GET/POST /api/discussions
│
├── store/
│   ├── broadcastStore.ts   # Playback + anchor state + audio engine wiring
│   ├── priceStore.ts       # Live CoinGecko prices + sparklines
│   └── uiStore.ts          # Tabs, wallet, toast queue, nav
│
├── lib/
│   ├── audioEngine.ts      # HTMLAudioElement + Web Speech wrapper
│   ├── mouthEngine.ts      # Syllable-clock mouth animation (v5)
│   ├── waveformEngine.ts   # AudioContext + physics waveform
│   └── utils.ts            # Shared helpers
│
├── components/
│   ├── broadcast/
│   │   ├── BroadcastPlayer.tsx   # Stage, anchor, script, queue
│   │   ├── AnchorAvatar.tsx      # SVG anchor figure + blink + sway
│   │   ├── ScriptDisplay.tsx     # Typewriter text display
│   │   ├── PlaybackControls.tsx  # Play/pause/next/mute/volume
│   │   └── QueuePanel.tsx        # Story queue list
│   ├── market/
│   │   └── PriceGrid.tsx         # Live price cards + sparklines
│   ├── sentiment/
│   │   ├── SentimentSidebar.tsx  # Tab container
│   │   ├── SentimentFeed.tsx     # Live sentiment cards + voting
│   │   └── PostForm.tsx          # Submit bias form
│   ├── qa/
│   │   └── QAPanel.tsx           # Daily question + reply thread
│   ├── ads/
│   │   └── AdsPanel.tsx          # Sponsored + ad slots + rates
│   ├── layout/
│   │   ├── Header.tsx            # Sticky nav + wallet + mobile menu
│   │   ├── TickerBar.tsx         # Live price ticker
│   │   ├── StatsBar.tsx          # Market stats + UTC clock
│   │   ├── Footer.tsx            # Links + socials
│   │   └── MobileNav.tsx         # Fixed bottom nav (mobile)
│   └── ui/
│       ├── WalletButton.tsx      # Connect/connected state
│       └── Toast.tsx             # Global toast notifications
│
├── data/
│   ├── stories.ts          # Broadcast story content
│   ├── prices.ts           # Fallback price seed data
│   └── sentiment.ts        # Seed sentiment + QA data
│
└── types/
    └── index.ts            # All shared TypeScript types
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
# Optional — for ElevenLabs TTS (anchor voice)
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=

# Optional — CoinGecko Pro (higher rate limits)
COINGECKO_API_KEY=
```

## Plugging In ElevenLabs

1. Create `/api/tts` route that calls ElevenLabs and returns a signed audio URL
2. In `broadcastStore.ts`, pass `options.audioUrl` to `AudioEngine.speak()`
3. `AudioEngine` automatically uses `HTMLAudioElement` path when URL is provided
4. `WaveformEngine` auto-switches to real FFT analysis via `AudioEngine.analyserNode`

## Replacing Mock Data with Real APIs

All mock data lives in `src/data/`. API routes at `src/app/api/` use in-memory stores.
To go live, replace the in-memory arrays with Prisma + PostgreSQL queries.
The store interfaces (`ApiNewsResponse`, `ApiSentimentResponse`, `ApiDiscussionResponse`)
are already typed to match the expected real API shape.
