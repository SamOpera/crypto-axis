import { NextResponse } from "next/server";
import { QA_SEED, DAILY_QUESTION } from "@/data/sentiment";
import type { ApiDiscussionResponse, QAReply } from "@/types";

export const dynamic = "force-dynamic";

const replies: QAReply[] = [...QA_SEED];

/* ── GET /api/discussions ── */
export async function GET() {
  const body: ApiDiscussionResponse = {
    question: DAILY_QUESTION,
    replies:  [...replies].sort((a, b) => b.up - a.up),
    total:    replies.length,
  };
  return NextResponse.json(body);
}

/* ── POST /api/discussions ── */
export async function POST(req: Request) {
  try {
    const { text, user, color } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Reply text required" }, { status: 400 });
    }
    if (text.length < 5 || text.length > 300) {
      return NextResponse.json({ error: "Reply must be 5–300 characters" }, { status: 400 });
    }

    const colors = ["#F0A500","#627EEA","#9945FF","#00E5A0","#F7931A","#FF3B5C"];
    const reply: QAReply = {
      id:       Date.now(),
      user:     user ?? "anonymous",
      color:    color ?? colors[Math.floor(Math.random() * colors.length)],
      rep:      0,
      text:     text.trim(),
      up:       0,
      userVote: null,
      ts:       Date.now(),
    };

    replies.push(reply);
    return NextResponse.json(reply, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
