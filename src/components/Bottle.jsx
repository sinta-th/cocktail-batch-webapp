import React from "react";

export function Bottle({ ratio = 0, size = 700, tone = "red", compact = false, dim = false }) {
  const ticks = [0.25, 0.5, 0.75, 1];
  return (
    <svg
      viewBox="0 0 140 330"
      className={`bc-bottle ${compact ? "bc-bottle--compact" : ""} ${dim ? "bc-bottle--dim" : ""}`}
    >
      <defs>
        <clipPath id={`clip-${size}-${tone}`}>
          <path d="M55,2 L85,2 L85,50 C85,64 110,64 110,86 L110,298 Q110,320 90,320 L50,320 Q30,320 30,298 L30,86 C30,64 55,64 55,50 Z" />
        </clipPath>
        <linearGradient id={`liquid-${size}-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone === "red" ? "#C6394F" : "#B4863A"} />
          <stop offset="100%" stopColor={tone === "red" ? "#8E1C2E" : "#8C641F"} />
        </linearGradient>
      </defs>

      <path
        className="bc-bottle-glass"
        d="M55,2 L85,2 L85,50 C85,64 110,64 110,86 L110,298 Q110,320 90,320 L50,320 Q30,320 30,298 L30,86 C30,64 55,64 55,50 Z"
      />

      <g clipPath={`url(#clip-${size}-${tone})`}>
        <g className="bc-liquid" style={{ transform: `scaleY(${ratio})` }}>
          <rect x="20" y="80" width="100" height="245" fill={`url(#liquid-${size}-${tone})`} />
        </g>
      </g>

      <rect x="53" y="-6" width="34" height="14" rx="3" className="bc-bottle-cap" />

      {!compact &&
        ticks.map((t) => {
          const y = 320 - t * (320 - 86);
          return (
            <g key={t} className="bc-tick">
              <line x1="30" y1={y} x2="18" y2={y} />
              <text x="14" y={y + 4} textAnchor="end">
                {Math.round(size * t)}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

export function GlassIcon() {
  return (
    <svg viewBox="0 0 48 48" className="bc-brand-icon" aria-hidden="true">
      <path
        d="M8 8h32l-12.5 15.5V38h7a2 2 0 0 1 0 4H12.5a2 2 0 0 1 0-4h7V23.5L7 8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <line x1="12.5" y1="14" x2="35.5" y2="14" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
