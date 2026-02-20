export function getConfidenceThreshold() {
  return {
    safe: 0.8 as const,
    warning: 0.7 as const,
    danger: 0.5 as const,
  };
}

type ConfidenceLevel = "safe" | "warning" | "danger";

export function getConfidenceBanner(score: number): {
  level: ConfidenceLevel;
  message: string;
} {
  const { safe, warning } = getConfidenceThreshold();

  if (score >= safe) {
    return {
      level: "safe",
      message: "This article has high confidence and is likely reliable.",
    };
  }

  if (score >= warning) {
    return {
      level: "warning",
      message: "This article has moderate confidence and should be reviewed carefully.",
    };
  }

  return {
    level: "danger",
    message: "This article has low confidence and may contain inaccuracies.",
  };
}
