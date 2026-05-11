import { NextResponse } from "next/server";

// Shared in-memory posts — in production use DB with row locking
const votes = new Map<string, number>(); // "postId:userId" -> 1 | -1

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { value, userId = "anon" } = await req.json();
    if (value !== 1 && value !== -1) {
      return NextResponse.json({ error: "value must be 1 or -1" }, { status: 400 });
    }

    const key  = `${params.id}:${userId}`;
    const prev = votes.get(key) ?? 0;

    if (prev === value) {
      votes.delete(key);
      return NextResponse.json({ action: "removed", value: 0 });
    }

    votes.set(key, value);
    return NextResponse.json({ action: "voted", value });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
