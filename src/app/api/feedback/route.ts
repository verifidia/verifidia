import { NextRequest, NextResponse } from "next/server";
import { feedbackInputSchema, submitFeedback } from "@/lib/feedback";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = feedbackInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid feedback payload" },
      { status: 400 }
    );
  }

  const inserted = await submitFeedback(parsed.data);

  return NextResponse.json({ success: true, feedbackId: inserted.id });
}
