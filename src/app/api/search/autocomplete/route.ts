import { NextRequest, NextResponse } from "next/server";
import { getAutocompleteSuggestions } from "@/lib/search";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const locale = searchParams.get("locale") ?? "en";

  try {
    const suggestions = await getAutocompleteSuggestions(q, locale);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { error: "Autocomplete failed" },
      { status: 500 }
    );
  }
}
