import React from "react";

interface LogoProps {
  className?: string;
  height?: number;
}

export default function Logo({ className = "h-8 w-auto", height = 32 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 320 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ height: `${height}px`, width: "auto" }}
      aria-label="TITANFIT Logo"
    >
      {/* Geometric Athletic Mark: Stylized T / Delta Blade */}
      <g transform="translate(4, 12)">
        <path
          d="M4 4 H36 V12 H24 V36 H16 V12 H4 Z"
          fill="currentColor"
          className="text-foreground"
        />
        <polygon points="26,14 36,4 36,24" fill="#F97316" />
      </g>

      {/* Brand Wordmark (adapts to light/dark via currentColor) */}
      <text
        x="52"
        y="38"
        fontFamily="'Outfit', var(--font-outfit), sans-serif"
        fontWeight="800"
        fontSize="26"
        letterSpacing="-0.03em"
        fill="currentColor"
        className="text-foreground"
      >
        TITAN<tspan fill="#F97316">FIT</tspan>
      </text>
      <text
        x="53"
        y="50"
        fontFamily="'Plus Jakarta Sans', var(--font-plus-jakarta-sans), sans-serif"
        fontWeight="600"
        fontSize="8.5"
        letterSpacing="0.22em"
        fill="currentColor"
        className="text-muted-foreground"
      >
        SPORTS &amp; NUTRITION
      </text>
    </svg>
  );
}
