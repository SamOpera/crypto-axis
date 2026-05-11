import { NextResponse } from "next/server";
import { STORIES } from "@/data/stories";
import type { ApiNewsResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page     = parseInt(searchParams.get("page")  ?? "1");
  const limit    = parseInt(searchParams.get("limit") ?? "10");
  const category = searchParams.get("category");

  const filtered = category
    ? STORIES.filter(s => s.category === category)
    : STORIES;

  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  const body: ApiNewsResponse = {
    stories: items,
    total:   filtered.length,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      "X-Data-Source": "mock",          // change to "live" once real pipeline is wired
    },
  });
}
