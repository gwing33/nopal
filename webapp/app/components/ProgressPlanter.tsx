import React from "react";

export type NopalPhase = "seed" | "sprout" | "seedling" | "flower" | "renewing";

interface ProgressPlanterProps {
  phase: NopalPhase;
  size?: number;
}

// ---------------------------------------------------------------------------
// Pot layers (split so plant content renders between body and rim/soil)
// ---------------------------------------------------------------------------

function PotBody() {
  return (
    <>
      {/* Pot body trapezoid */}
      <path d="M20,92 L100,92 L87,116 L33,116 Z" fill="#C1603C" />
      {/* Highlight */}
      <path d="M20,92 L32,92 L22,116 L33,116 Z" fill="#E8885A" opacity="0.3" />
    </>
  );
}

function PotRimAndSoil() {
  return (
    <>
      {/* Rim */}
      <rect x="18" y="84" width="84" height="8" rx="4" fill="#9B4523" />
      {/* Soil */}
      <ellipse cx="60" cy="87" rx="36" ry="6" fill="#2D1A0A" />
      {/* Soil texture */}
      <ellipse cx="60" cy="85" rx="27" ry="4" fill="#3E2412" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Phase plant content
// ---------------------------------------------------------------------------

/** Seed: three seeds on top of the soil */
function SeedContent() {
  return (
    <>
      <ellipse
        cx="46" cy="83" rx="4" ry="2.5"
        fill="#1E0F05"
        transform="rotate(-20 46 83)"
      />
      <ellipse
        cx="60" cy="81" rx="3.5" ry="2"
        fill="#1E0F05"
        transform="rotate(5 60 81)"
      />
      <ellipse
        cx="74" cy="83" rx="4" ry="2.5"
        fill="#1E0F05"
        transform="rotate(15 74 83)"
      />
    </>
  );
}

/** Sprout: single small nopal pad emerging */
function SproutContent() {
  return (
    <>
      {/* Stem */}
      <rect x="58" y="72" width="4" height="14" rx="2" fill="#4E9A3E" />
      {/* Main pad */}
      <ellipse
        cx="60" cy="62" rx="10" ry="14"
        fill="#5AAA48" stroke="#3A7A2E" strokeWidth="1"
      />
      {/* Areole dots – 4 corners */}
      <circle cx="60" cy="50" r="1.5" fill="white" />
      <circle cx="68" cy="62" r="1.5" fill="white" />
      <circle cx="60" cy="73" r="1.5" fill="white" />
      <circle cx="52" cy="62" r="1.5" fill="white" />
    </>
  );
}

/** Seedling: taller main pad + smaller side pad */
function SeedlingContent() {
  return (
    <>
      {/* Stem */}
      <rect x="56" y="72" width="4" height="14" rx="2" fill="#4E9A3E" />
      {/* Main pad */}
      <ellipse
        cx="58" cy="52" rx="14" ry="22"
        fill="#4E9A3E" stroke="#3A7A2E" strokeWidth="1"
      />
      {/* Side pad */}
      <ellipse
        cx="74" cy="62" rx="9" ry="13"
        fill="#5AAA48" stroke="#3A7A2E" strokeWidth="0.8"
      />
      {/* Areole dots – 6 on main pad */}
      <circle cx="58" cy="34" r="1.5" fill="white" />
      <circle cx="66" cy="44" r="1.5" fill="white" />
      <circle cx="68" cy="58" r="1.5" fill="white" />
      <circle cx="58" cy="68" r="1.5" fill="white" />
      <circle cx="48" cy="58" r="1.5" fill="white" />
      <circle cx="50" cy="44" r="1.5" fill="white" />
    </>
  );
}

/** Flower: seedling layout + yellow flower on top */
function FlowerContent() {
  return (
    <>
      {/* Stem */}
      <rect x="56" y="72" width="4" height="14" rx="2" fill="#4E9A3E" />
      {/* Main pad – shifted slightly to leave room for flower */}
      <ellipse
        cx="58" cy="56" rx="14" ry="20"
        fill="#4E9A3E" stroke="#3A7A2E" strokeWidth="1"
      />
      {/* Side pad */}
      <ellipse
        cx="74" cy="64" rx="9" ry="12"
        fill="#5AAA48" stroke="#3A7A2E" strokeWidth="0.8"
      />
      {/* Areole dots */}
      <circle cx="58" cy="40" r="1.5" fill="white" />
      <circle cx="66" cy="50" r="1.5" fill="white" />
      <circle cx="68" cy="62" r="1.5" fill="white" />
      <circle cx="58" cy="70" r="1.5" fill="white" />
      <circle cx="48" cy="62" r="1.5" fill="white" />
      <circle cx="50" cy="48" r="1.5" fill="white" />
      {/* 6 petals radiating from centre (58, 26), each petal cx=58 cy=14, rotated */}
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(0 58 26)" />
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(60 58 26)" />
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(120 58 26)" />
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(180 58 26)" />
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(240 58 26)" />
      <ellipse cx="58" cy="14" rx="4" ry="9" fill="#F5D563" transform="rotate(300 58 26)" />
      {/* Flower centre */}
      <circle cx="58" cy="26" r="6" fill="#F5A623" />
    </>
  );
}

/** Renewing: seedling layout + prickly pear fruit */
function RenewingContent() {
  return (
    <>
      {/* Stem */}
      <rect x="56" y="72" width="4" height="14" rx="2" fill="#4E9A3E" />
      {/* Main pad */}
      <ellipse
        cx="58" cy="52" rx="14" ry="22"
        fill="#4E9A3E" stroke="#3A7A2E" strokeWidth="1"
      />
      {/* Side pad */}
      <ellipse
        cx="74" cy="62" rx="9" ry="13"
        fill="#5AAA48" stroke="#3A7A2E" strokeWidth="0.8"
      />
      {/* Areole dots on pad */}
      <circle cx="58" cy="34" r="1.5" fill="white" />
      <circle cx="66" cy="44" r="1.5" fill="white" />
      <circle cx="68" cy="58" r="1.5" fill="white" />
      <circle cx="58" cy="68" r="1.5" fill="white" />
      <circle cx="48" cy="58" r="1.5" fill="white" />
      <circle cx="50" cy="44" r="1.5" fill="white" />
      {/* Prickly pear fruit */}
      <ellipse
        cx="62" cy="28" rx="10" ry="14"
        fill="#C62A47" stroke="#8B1E35" strokeWidth="1"
      />
      {/* Areole dots on fruit (pale pink) */}
      <circle cx="62" cy="18" r="1.5" fill="#FFB4C2" />
      <circle cx="70" cy="28" r="1.5" fill="#FFB4C2" />
      <circle cx="62" cy="38" r="1.5" fill="#FFB4C2" />
      <circle cx="54" cy="28" r="1.5" fill="#FFB4C2" />
      {/* Fruit crown – small green tuft at top */}
      <ellipse cx="62" cy="15" rx="4" ry="2.5" fill="#3A7A2E" />
      <ellipse cx="58" cy="13" rx="2.5" ry="3.5" fill="#5AAA48" />
      <ellipse cx="66" cy="13" rx="2.5" ry="3.5" fill="#5AAA48" />
      <ellipse cx="62" cy="11" rx="2" ry="3" fill="#4E9A3E" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ProgressPlanter({ phase, size = 120 }: ProgressPlanterProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 132"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Nopal phase: ${phase}`}
    >
      {/* 1. Pot body (behind everything) */}
      <PotBody />

      {/* 2. Plant content – stems & pads rendered above pot body but below rim/soil */}
      {phase === "sprout"   && <SproutContent />}
      {phase === "seedling" && <SeedlingContent />}
      {phase === "flower"   && <FlowerContent />}
      {phase === "renewing" && <RenewingContent />}

      {/* 3. Pot rim + soil layer (covers stem bases) */}
      <PotRimAndSoil />

      {/* 4. Seeds rendered on top of soil */}
      {phase === "seed" && <SeedContent />}

      {/* 5. Phase label */}
      <text
        x="60"
        y="128"
        textAnchor="middle"
        fontSize="8"
        fontFamily="monospace"
        fill="#7f5b8b"
      >
        {phase}
      </text>
    </svg>
  );
}
