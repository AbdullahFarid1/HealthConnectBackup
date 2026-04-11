import { Star, StarHalf } from "lucide-react";

/**
 * Read-only rating display that ALWAYS renders exactly 5 stars.
 * Uses rounding to the nearest half-star so a value of `3` shows
 * 3 filled + 2 empty, and `3.5` shows 3 filled + 1 half + 1 empty.
 */
export function RatingStars({
  value,
  size = 14,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, Number(value) || 0));
  // Round to nearest half: 2.7 → 2.5, 2.8 → 3, etc.
  const half = Math.round(clamped * 2) / 2;
  const full = Math.floor(half);
  const hasHalf = half - full === 0.5;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  const dim = { width: size, height: size };

  return (
    <span
      className={`inline-flex items-center ${className}`}
      aria-label={`${clamped.toFixed(1)} out of 5`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={`f-${i}`}
          style={dim}
          className="fill-amber-400 text-amber-400"
        />
      ))}
      {hasHalf && (
        <StarHalf
          key="h"
          style={dim}
          className="fill-amber-400 text-amber-400"
        />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} style={dim} className="text-muted-foreground/40" />
      ))}
    </span>
  );
}
