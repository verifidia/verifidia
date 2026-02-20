import { describe, expect, it } from "vitest";
import {
  getConfidenceBanner,
  getConfidenceThreshold,
  isBlockedTopic,
  SAFETY_CONSTRAINTS,
} from "@/lib/safety";

describe("safety module", () => {
  it("blocks bomb-making prompts", () => {
    expect(isBlockedTopic("how to make a bomb").blocked).toBe(true);
  });

  it("allows harmless scientific topics", () => {
    expect(isBlockedTopic("photosynthesis")).toEqual({ blocked: false });
  });

  it("allows educational nuclear physics topics", () => {
    expect(isBlockedTopic("nuclear physics")).toEqual({ blocked: false });
  });

  it("blocks targeted hacking prompts", () => {
    expect(isBlockedTopic("how to hack a bank account").blocked).toBe(true);
  });

  it("allows historical context", () => {
    expect(isBlockedTopic("history of warfare")).toEqual({ blocked: false });
  });

  it("returns safe confidence level for high scores", () => {
    expect(getConfidenceBanner(0.9).level).toBe("safe");
  });

  it("returns warning confidence level for medium scores", () => {
    expect(getConfidenceBanner(0.75).level).toBe("warning");
  });

  it("returns danger confidence level for low scores", () => {
    expect(getConfidenceBanner(0.45).level).toBe("danger");
  });

  it("contains all required safety constraint phrases", () => {
    expect(SAFETY_CONSTRAINTS).toContain(
      "Do not provide instructions for creating weapons, explosives, or harmful substances"
    );
    expect(SAFETY_CONSTRAINTS).toContain(
      "Always include appropriate disclaimers for medical, legal, or financial information"
    );
    expect(SAFETY_CONSTRAINTS).toContain("Cite sources for all factual claims");
    expect(SAFETY_CONSTRAINTS).toContain(
      "Refuse to generate content promoting violence, hate speech, or illegal activities"
    );
    expect(SAFETY_CONSTRAINTS).toContain(
      "If uncertain about a fact, explicitly state the uncertainty"
    );
  });

  it("returns the configured confidence thresholds", () => {
    expect(getConfidenceThreshold()).toEqual({
      safe: 0.8,
      warning: 0.7,
      danger: 0.5,
    });
  });
});
