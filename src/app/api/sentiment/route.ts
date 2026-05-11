import { NextResponse } from "next/server";
import { SENTIMENT_SEED } from "@/data/sentiment";
import type { ApiSentimentResponse, SentimentPost } from "@/types";

export const dynamic = "force-dynamic";

// In-memory store — replace with DB (Prisma + PostgreSQL) in production
const posts: SentimentPost[] = [...SENTIMENT_SEED];

/* ── GET  /api/sentiment ── */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const asset = searchParams.get("asset")?.toUpperCase();
  const bias  = searchParams.get("bias");
  const page  = parseInt(searchParams.get("page")  ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  let filtered = [...posts].sort((a, b) => b.ts - a.ts);
  if (asset) filtered = filtered.filter(p => p.asset === asset);
  if (bias)  filtered = filtered.filter(p => p.bias  === bias);

  const start    = (page - 1) * limit;
  const paginated= filtered.slice(start, start + limit);

  const bulls    = filtered.filter(p => p.bias === "bull").length;
  const bullPct  = filtered.length ? Math.round((bulls / filtered.length) * 100) : 50;

  const body: ApiSentimentResponse = {
    posts:   paginated,
    total:   filtered.length,
    bullPct,
    bearPct: 100 - bullPct,
  };

  return NextResponse.json(body);
}

/* ── POST /api/sentiment ── */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { asset, bias, reason, tf, user } = body;

    if (!asset || !bias || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["bull", "bear"].includes(bias)) {
      return NextResponse.json({ error: "Invalid bias" }, { status: 400 });
    }
    if (reason.length < 10 || reason.length > 500) {
      return NextResponse.json({ error: "Reason must be 10–500 characters" }, { status: 400 });
    }

    const post: SentimentPost = {
      id:       Date.now(),
      asset:    asset.toUpperCase(),
      bias,
      reason,
      tf:       tf ?? "SWING",
      user:     user ?? "anonymous",
      rep:      100,
      up:       0,
      down:     0,
      userVote: null,
      ts:       Date.now(),
    };

    posts.unshift(post);

    return NextResponse.json(post, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
