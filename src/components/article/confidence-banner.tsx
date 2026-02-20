import { getConfidenceBanner } from "@/lib/safety";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ConfidenceBannerProps = {
  score: number;
};

const bannerCopy = {
  safe: "High confidence article",
  warning: "Moderate confidence - verify important claims",
  danger: "Low confidence - treat with caution",
} as const;

const levelStyles = {
  safe: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  danger: "border-red-300 bg-red-50 text-red-900",
} as const;

const badgeStyles = {
  safe: "bg-emerald-600 text-white",
  warning: "bg-amber-600 text-white",
  danger: "bg-red-600 text-white",
} as const;

export function ConfidenceBanner({ score }: ConfidenceBannerProps) {
  const banner = getConfidenceBanner(score);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3 text-sm",
        levelStyles[banner.level]
      )}
    >
      <Badge className={cn("uppercase tracking-wide", badgeStyles[banner.level])}>
        {banner.level}
      </Badge>
      <span className="font-medium">{bannerCopy[banner.level]}</span>
    </div>
  );
}
