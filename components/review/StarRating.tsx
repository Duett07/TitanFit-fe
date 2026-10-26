"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "Rất không hài lòng",
  2: "Không hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Tuyệt vời",
};

export default function StarRating({
  rating,
  maxRating = 5,
  interactive = false,
  onChange,
  size = "md",
  showLabel = false,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  }[size];

  const activeRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= activeRating;

          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange?.(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`transition-transform ${
                interactive
                  ? "cursor-pointer hover:scale-115 active:scale-95 focus:outline-none"
                  : "cursor-default"
              }`}
              aria-label={`${starValue} sao`}
            >
              <Star
                className={`${starSizeClasses} transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-muted text-muted-foreground/30"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold text-foreground/80 min-w-24">
          {RATING_LABELS[activeRating] || `${activeRating} / ${maxRating}`}
        </span>
      )}
    </div>
  );
}
