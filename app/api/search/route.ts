import { postRowToCardData } from "@/lib/posts/map-row-to-card";
import { searchPublishedPostRows } from "@/lib/posts/search-published";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limitRaw = req.nextUrl.searchParams.get("limit");
  const parsed = limitRaw ? Number.parseInt(limitRaw, 10) : 8;
  const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 24) : 8;

  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ ok: true as const, results: [] });
  }

  try {
    const rows = await searchPublishedPostRows(trimmed, limit);
    const results = await Promise.all(rows.map((r) => postRowToCardData(r)));
    return NextResponse.json({ ok: true as const, results }, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[api/search]", msg);
    return NextResponse.json(
      { ok: false as const, error: "Search failed." },
      { status: 500 },
    );
  }
}
