import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const locale = searchParams.get("locale") ?? "en";

  try {
    const results = await searchArticles(q, locale);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
