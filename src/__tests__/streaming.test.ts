import { describe, expect, it } from "vitest";
import { STEP_LABELS, STEP_ORDER } from "@/hooks/use-article-stream";

describe("Streaming generation constants", () => {
  it("defines labels for every generation step", () => {
    expect(STEP_LABELS.idle).toBeTruthy();
    expect(STEP_LABELS.researching).toBeTruthy();
    expect(STEP_LABELS.generating).toBeTruthy();
    expect(STEP_LABELS.citing).toBeTruthy();
    expect(STEP_LABELS.scoring).toBeTruthy();
    expect(STEP_LABELS.complete).toBeTruthy();
    expect(STEP_LABELS.error).toBeTruthy();
  });

  it("keeps the step order from researching to complete", () => {
    expect(STEP_ORDER[0]).toBe("researching");
    expect(STEP_ORDER[STEP_ORDER.length - 1]).toBe("complete");
  });

  it("decodes encoded topics", () => {
    expect(decodeURIComponent("quantum%20computing")).toBe("quantum computing");
  });
});
