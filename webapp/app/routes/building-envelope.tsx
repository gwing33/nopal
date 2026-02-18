import { useState, useCallback, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "Building Envelope Survey | Nopal" },
  {
    name: "description",
    content:
      "Evaluate your building envelope — air tightness, ventilation, and fresh air strategy — and see where your home lands on the health vs efficiency quadrant.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AirTightness = "old-and-leaky" | "code" | "passive-house" | null;

type Ventilation = "exhaust-only" | "supply-only" | "balanced" | null;

type WindowsFreshAir = "yes" | "no" | null;

interface SurveyState {
  airTightness: AirTightness;
  ventilation: Ventilation;
  windowsFreshAir: WindowsFreshAir;
}

interface Insight {
  kind: "tip" | "warning" | "info";
  text: string;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const INITIAL_STATE: SurveyState = {
  airTightness: null,
  ventilation: null,
  windowsFreshAir: "no",
};

// ---------------------------------------------------------------------------
// Scoring — Each selection nudges the home on two axes
//   Health:     positive = healthier indoor environment
//   Efficiency: positive = more energy efficient
// ---------------------------------------------------------------------------

interface Score {
  health: number;
  efficiency: number;
}

function computeScore(state: SurveyState): Score {
  let health = 0;
  let efficiency = 0;

  // Air tightness
  switch (state.airTightness) {
    case "old-and-leaky":
      health -= 25;
      efficiency -= 30;
      break;
    case "code":
      health -= 10;
      efficiency -= 10;
      break;
    case "passive-house":
      health += 15;
      efficiency += 30;
      break;
  }

  // Ventilation
  switch (state.ventilation) {
    case "exhaust-only":
      health += 10;
      efficiency -= 8;
      break;
    case "supply-only":
      health += 15;
      efficiency -= 8;
      break;
    case "balanced":
      health += 25;
      efficiency += 15;
      break;
  }

  // Sick building syndrome: passive house without balanced ventilation
  if (
    state.airTightness === "passive-house" &&
    state.ventilation !== "balanced"
  ) {
    // Severity depends on ventilation type
    if (state.ventilation === null) health -= 65;
    else if (state.ventilation === "exhaust-only") health -= 45;
    else if (state.ventilation === "supply-only") health -= 40;
  }

  // Windows for fresh air — effect depends on ventilation type
  if (state.windowsFreshAir === "yes") {
    if (state.ventilation === "balanced") {
      // With balanced ventilation, open windows introduce unfiltered air
      // and waste the energy your ERV/HRV is recovering
      health -= 20;
      efficiency -= 10;
    } else {
      // Without balanced ventilation, windows are your best fresh air source
      health += 20;
      efficiency -= 10;
    }
  }

  // Clamp to [-50, 50]
  health = Math.max(-50, Math.min(50, health));
  efficiency = Math.max(-50, Math.min(50, efficiency));

  return { health, efficiency };
}

function hasAnySelection(state: SurveyState) {
  return (
    state.airTightness !== null ||
    state.ventilation !== null ||
    state.windowsFreshAir !== null
  );
}

// ---------------------------------------------------------------------------
// Quadrant label logic
// ---------------------------------------------------------------------------

function getQuadrantLabel(score: Score, hasSelection: boolean): string {
  if (!hasSelection) return "Make selections to place your home";
  const { health, efficiency } = score;
  if (health >= 0 && efficiency >= 0) return "Healthy & Efficient";
  if (health >= 0 && efficiency < 0) return "Healthy but Inefficient";
  if (health < 0 && efficiency >= 0) return "Efficient but Less Healthy";
  return "Needs Improvement";
}

function getQuadrantColor(score: Score, hasSelection: boolean): string {
  if (!hasSelection) return "var(--text-subtle)";
  const { health, efficiency } = score;
  if (health >= 0 && efficiency >= 0) return "var(--green)";
  if (health >= 0 && efficiency < 0) return "var(--yellow)";
  if (health < 0 && efficiency >= 0) return "var(--yellow)";
  return "var(--red)";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mb-1">{children}</h3>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs opacity-70 mb-2">{children}</p>;
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
}) {
  return (
    <label
      className="flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all"
      style={{
        borderColor: checked ? "var(--green)" : "var(--midground)",
        backgroundColor: checked ? "var(--green-light)" : "transparent",
        opacity: checked ? 1 : 0.85,
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="mt-0.5 shrink-0"
        style={{ accentColor: "var(--green)" }}
      />
      <div className="min-w-0">
        <div className="font-semibold text-sm leading-tight">{label}</div>
        {description && (
          <div className="text-xs opacity-70 mt-0.5 leading-snug">
            {description}
          </div>
        )}
      </div>
    </label>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const styles: Record<
    Insight["kind"],
    { bg: string; border: string; icon: string; label: string }
  > = {
    warning: {
      bg: "var(--red-light)",
      border: "var(--red)",
      icon: "⚠",
      label: "Heads Up",
    },
    tip: {
      bg: "var(--green-light)",
      border: "var(--green)",
      icon: "✦",
      label: "Nice",
    },
    info: {
      bg: "var(--yellow-light)",
      border: "var(--yellow)",
      icon: "ℹ",
      label: "Note",
    },
  };

  const s = styles[insight.kind];

  return (
    <div
      className="rounded-lg p-3 mb-2"
      style={{
        backgroundColor: s.bg,
        borderLeft: `4px solid ${s.border}`,
      }}
    >
      <div className="font-semibold text-xs mb-0.5">
        {s.icon} {s.label}
      </div>
      <p className="text-xs leading-relaxed">{insight.text}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Home marker SVG (simple house icon)
// ---------------------------------------------------------------------------

function HomeIcon({ color }: { color: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Quadrant Chart
// ---------------------------------------------------------------------------

function QuadrantChart({
  score,
  hasSelection,
}: {
  score: Score;
  hasSelection: boolean;
}) {
  // Map score from [-50, 50] to [5%, 95%] of the chart area
  // When no selection, position at center (50%, 50%)
  const xPercent = hasSelection ? 50 + (score.efficiency / 50) * 45 : 50;
  const yPercent = hasSelection ? 50 - (score.health / 50) * 45 : 50;

  const quadrantLabel = getQuadrantLabel(score, hasSelection);
  const quadrantColor = getQuadrantColor(score, hasSelection);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Quadrant status label */}
      <div
        className="text-center mb-4 px-4 py-2 rounded-full font-semibold text-sm"
        style={{
          color: quadrantColor,
          backgroundColor: hasSelection ? undefined : "transparent",
          border: hasSelection
            ? `2px solid ${quadrantColor}`
            : "2px solid var(--midground)",
        }}
      >
        {quadrantLabel}
      </div>

      {/* Chart container */}
      <div
        className="relative w-full"
        style={{ maxWidth: 520, aspectRatio: "1 / 1" }}
      >
        {/* Quadrant backgrounds */}
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 rounded-xl overflow-hidden">
          {/* Top-left: Healthy but Inefficient */}
          <div
            className="flex items-start justify-start p-3"
            style={{ backgroundColor: "rgba(255, 234, 164, 0.15)" }}
          >
            <span className="text-xs opacity-40 font-medium leading-tight">
              Healthy but
              <br />
              Inefficient
            </span>
          </div>
          {/* Top-right: Healthy & Efficient */}
          <div
            className="flex items-start justify-end p-3"
            style={{ backgroundColor: "rgba(93, 160, 109, 0.12)" }}
          >
            <span className="text-xs opacity-40 font-medium text-right leading-tight">
              Healthy &<br />
              Efficient
            </span>
          </div>
          {/* Bottom-left: Needs Improvement */}
          <div
            className="flex items-end justify-start p-3"
            style={{ backgroundColor: "rgba(166, 59, 49, 0.08)" }}
          >
            <span className="text-xs opacity-40 font-medium leading-tight">
              Needs
              <br />
              Improvement
            </span>
          </div>
          {/* Bottom-right: Efficient but Less Healthy */}
          <div
            className="flex items-end justify-end p-3"
            style={{ backgroundColor: "rgba(255, 234, 164, 0.15)" }}
          >
            <span className="text-xs opacity-40 font-medium text-right leading-tight">
              Efficient but
              <br />
              Less Healthy
            </span>
          </div>
        </div>

        {/* Axes */}
        {/* Vertical axis (Health) */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: "50%",
            width: 1,
            backgroundColor: "var(--midground)",
          }}
        />
        {/* Horizontal axis (Efficiency) */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "50%",
            height: 1,
            backgroundColor: "var(--midground)",
          }}
        />

        {/* Axis labels */}
        {/* Health top */}
        <div
          className="absolute text-xs font-semibold"
          style={{
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--green)",
            opacity: 0.7,
          }}
        >
          ↑ Healthier
        </div>
        {/* Health bottom */}
        <div
          className="absolute text-xs font-semibold"
          style={{
            bottom: 4,
            left: "50%",
            transform: "translateX(-50%)",
            color: "var(--red)",
            opacity: 0.7,
          }}
        >
          Less Healthy ↓
        </div>
        {/* Efficiency right */}
        <div
          className="absolute text-xs font-semibold"
          style={{
            right: 4,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--green)",
            opacity: 0.7,
          }}
        >
          Efficient →
        </div>
        {/* Efficiency left */}
        <div
          className="absolute text-xs font-semibold"
          style={{
            left: 4,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--red)",
            opacity: 0.7,
          }}
        >
          ← Inefficient
        </div>

        {/* Outer border */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: "2px solid var(--midground)" }}
        />

        {/* Home marker */}
        <div
          className="absolute flex flex-col items-center pointer-events-none"
          style={{
            left: `${xPercent}%`,
            top: `${yPercent}%`,
            transform: "translate(-50%, -50%)",
            transition:
              "left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            zIndex: 10,
          }}
        >
          <div
            className="rounded-full flex items-center justify-center shadow-lg"
            style={{
              width: 48,
              height: 48,
              backgroundColor: hasSelection
                ? quadrantColor
                : "var(--midground)",
              transition: "background-color 0.4s ease",
              border: "3px solid white",
            }}
          >
            <HomeIcon color="white" />
          </div>
          <div
            className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: "white",
              color: hasSelection ? quadrantColor : "var(--text-subtle)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
              transition: "color 0.4s ease",
            }}
          >
            Your Home
          </div>
        </div>

        {/* Center dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: "var(--midground)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 5,
          }}
        />
      </div>

      {/* Score readout */}
      {hasSelection && (
        <div
          className="flex gap-6 mt-4 text-xs font-medium"
          style={{ color: "var(--text-subtle)" }}
        >
          <span>
            Health:{" "}
            <span
              style={{
                color: score.health >= 0 ? "var(--green)" : "var(--red)",
                fontWeight: 700,
              }}
            >
              {score.health > 0 ? "+" : ""}
              {score.health}
            </span>
          </span>
          <span>
            Efficiency:{" "}
            <span
              style={{
                color: score.efficiency >= 0 ? "var(--green)" : "var(--red)",
                fontWeight: 700,
              }}
            >
              {score.efficiency > 0 ? "+" : ""}
              {score.efficiency}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score Reference Table
// ---------------------------------------------------------------------------

const AIR_TIGHTNESS_OPTIONS: { value: AirTightness; label: string }[] = [
  { value: "old-and-leaky", label: "Old & Leaky" },
  { value: "code", label: "Code" },
  { value: "passive-house", label: "Passive House" },
];

const VENTILATION_OPTIONS: { value: Ventilation; label: string }[] = [
  { value: null, label: "None" },
  { value: "exhaust-only", label: "Exhaust Only" },
  { value: "supply-only", label: "Supply Only" },
  { value: "balanced", label: "Balanced" },
];

const WINDOWS_OPTIONS: { value: WindowsFreshAir; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

interface ScoreRow {
  airTightness: AirTightness;
  ventilation: Ventilation;
  windowsFreshAir: WindowsFreshAir;
  health: number;
  efficiency: number;
  quadrant: string;
}

function generateAllScores(): ScoreRow[] {
  const rows: ScoreRow[] = [];
  for (const at of AIR_TIGHTNESS_OPTIONS) {
    for (const v of VENTILATION_OPTIONS) {
      for (const w of WINDOWS_OPTIONS) {
        const state: SurveyState = {
          airTightness: at.value,
          ventilation: v.value,
          windowsFreshAir: w.value,
        };
        const score = computeScore(state);
        let quadrant: string;
        if (score.health >= 0 && score.efficiency >= 0)
          quadrant = "Healthy & Efficient";
        else if (score.health >= 0 && score.efficiency < 0)
          quadrant = "Healthy / Inefficient";
        else if (score.health < 0 && score.efficiency >= 0)
          quadrant = "Efficient / Less Healthy";
        else quadrant = "Needs Improvement";
        rows.push({
          airTightness: at.value,
          ventilation: v.value,
          windowsFreshAir: w.value,
          health: score.health,
          efficiency: score.efficiency,
          quadrant,
        });
      }
    }
  }
  return rows;
}

function ScoreTable({ currentState }: { currentState: SurveyState }) {
  const [open, setOpen] = useState(false);
  const rows = useMemo(() => generateAllScores(), []);

  function isCurrentRow(row: ScoreRow): boolean {
    return (
      row.airTightness === currentState.airTightness &&
      row.ventilation === currentState.ventilation &&
      row.windowsFreshAir === currentState.windowsFreshAir
    );
  }

  const quadrantColor = (q: string) => {
    if (q === "Healthy & Efficient") return "var(--green)";
    if (q === "Needs Improvement") return "var(--red)";
    return "var(--yellow)";
  };

  return (
    <div className="mt-8 mb-12">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-60 hover:opacity-100 transition-opacity"
      >
        <span
          style={{
            display: "inline-block",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▶
        </span>
        All Scoring Variations
      </button>

      {open && (
        <div
          className="mt-4 overflow-x-auto rounded-xl"
          style={{ border: "1px solid var(--midground)" }}
        >
          <table
            className="w-full text-xs"
            style={{ minWidth: 600, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ backgroundColor: "var(--farground)" }}>
                <th
                  className="text-left p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Air Tightness
                </th>
                <th
                  className="text-left p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Ventilation
                </th>
                <th
                  className="text-center p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Windows
                </th>
                <th
                  className="text-right p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Health
                </th>
                <th
                  className="text-right p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Efficiency
                </th>
                <th
                  className="text-left p-2 font-semibold"
                  style={{ borderBottom: "2px solid var(--midground)" }}
                >
                  Quadrant
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isCurrent = isCurrentRow(row);
                return (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: isCurrent
                        ? "var(--green-light)"
                        : i % 2 === 0
                        ? "transparent"
                        : "var(--farground)",
                      fontWeight: isCurrent ? 700 : 400,
                      borderBottom: "1px solid var(--midground)",
                    }}
                  >
                    <td className="p-2">
                      {
                        AIR_TIGHTNESS_OPTIONS.find(
                          (o) => o.value === row.airTightness
                        )?.label
                      }
                    </td>
                    <td className="p-2">
                      {
                        VENTILATION_OPTIONS.find(
                          (o) => o.value === row.ventilation
                        )?.label
                      }
                    </td>
                    <td className="p-2 text-center">
                      {row.windowsFreshAir === "yes" ? "Yes" : "No"}
                    </td>
                    <td
                      className="p-2 text-right"
                      style={{
                        color: row.health >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {row.health > 0 ? "+" : ""}
                      {row.health}
                    </td>
                    <td
                      className="p-2 text-right"
                      style={{
                        color:
                          row.efficiency >= 0 ? "var(--green)" : "var(--red)",
                      }}
                    >
                      {row.efficiency > 0 ? "+" : ""}
                      {row.efficiency}
                    </td>
                    <td
                      className="p-2"
                      style={{ color: quadrantColor(row.quadrant) }}
                    >
                      {row.quadrant}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BuildingEnvelope() {
  const [state, setState] = useState<SurveyState>({ ...INITIAL_STATE });

  const setAirTightness = useCallback((v: string) => {
    setState((prev) => ({ ...prev, airTightness: v as AirTightness }));
  }, []);

  const setVentilation = useCallback((v: string) => {
    setState((prev) => ({ ...prev, ventilation: v as Ventilation }));
  }, []);

  const setWindowsFreshAir = useCallback((v: string) => {
    setState((prev) => ({ ...prev, windowsFreshAir: v as WindowsFreshAir }));
  }, []);

  const score = useMemo(() => computeScore(state), [state]);
  const selected = hasAnySelection(state);

  const handleReset = useCallback(() => {
    setState({ ...INITIAL_STATE });
  }, []);

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <h1 className="purple-light-text text-4xl mt-12">
            Building Envelope
          </h1>
          <p className="text-lg mt-2 mb-6" style={{ maxWidth: 600 }}>
            Choose your building's characteristics on the left and watch where
            your home lands on the health vs. efficiency quadrant.
          </p>

          {/* Main two-column layout */}
          <div
            className="flex flex-col lg:flex-row gap-6 mb-12"
            style={{ minHeight: 520 }}
          >
            {/* ---- LEFT SIDEBAR: Options ---- */}
            <div
              className="lg:w-[340px] shrink-0 rounded-xl p-4 overflow-y-auto"
              style={{
                backgroundColor: "var(--farground)",
                border: "1px solid var(--midground)",
                maxHeight: "calc(100vh - 200px)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Building</h2>
                {selected && (
                  <button
                    onClick={handleReset}
                    className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                    style={{
                      color: "var(--text-subtle)",
                      border: "1px solid var(--midground)",
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Air Tightness */}
              <SectionHeading>Air Tightness</SectionHeading>
              <SectionDescription>
                How well the envelope prevents uncontrolled air leakage.
              </SectionDescription>
              <div className="space-y-1.5 mb-4">
                <RadioOption
                  name="airTightness"
                  value="old-and-leaky"
                  checked={state.airTightness === "old-and-leaky"}
                  onChange={setAirTightness}
                  label="Old & Leaky"
                  description="Noticeable drafts, gaps around windows/doors."
                />
                <RadioOption
                  name="airTightness"
                  value="code"
                  checked={state.airTightness === "code"}
                  onChange={setAirTightness}
                  label="Code"
                  description="Built to current energy code standards."
                />
                <RadioOption
                  name="airTightness"
                  value="passive-house"
                  checked={state.airTightness === "passive-house"}
                  onChange={setAirTightness}
                  label="Passive House"
                  description="Extremely airtight, blower door tested (≤ 0.6 ACH50)."
                />
              </div>

              {/* Divider */}
              <hr
                style={{ borderColor: "var(--midground)" }}
                className="my-4"
              />

              {/* Ventilation */}
              <SectionHeading>Ventilation</SectionHeading>
              <SectionDescription>
                How is fresh air managed in the building?
              </SectionDescription>
              <div className="space-y-1.5 mb-4">
                <RadioOption
                  name="ventilation"
                  value="none"
                  checked={state.ventilation === null}
                  onChange={() =>
                    setState((prev) => ({ ...prev, ventilation: null }))
                  }
                  label="None"
                  description="No mechanical ventilation system."
                />
                <RadioOption
                  name="ventilation"
                  value="exhaust-only"
                  checked={state.ventilation === "exhaust-only"}
                  onChange={setVentilation}
                  label="Exhaust Only"
                  description="Bath fans, range hoods — air exits but replacement is uncontrolled."
                />
                <RadioOption
                  name="ventilation"
                  value="supply-only"
                  checked={state.ventilation === "supply-only"}
                  onChange={setVentilation}
                  label="Supply Only"
                  description="Fresh air is pushed in, but outgoing air is not recovered."
                />
                <RadioOption
                  name="ventilation"
                  value="balanced"
                  checked={state.ventilation === "balanced"}
                  onChange={setVentilation}
                  label="Balanced (ERV / HRV)"
                  description="Fresh air in, stale air out — with heat/energy recovery."
                />
              </div>

              {/* Divider */}
              <hr
                style={{ borderColor: "var(--midground)" }}
                className="my-4"
              />

              {/* Windows */}
              <SectionHeading>Windows for Fresh Air?</SectionHeading>
              <SectionDescription>
                Do you open windows as a ventilation strategy?
              </SectionDescription>
              <div className="space-y-1.5">
                <RadioOption
                  name="windowsFreshAir"
                  value="yes"
                  checked={state.windowsFreshAir === "yes"}
                  onChange={setWindowsFreshAir}
                  label="Yes"
                  description="I regularly open windows for fresh air."
                />
                <RadioOption
                  name="windowsFreshAir"
                  value="no"
                  checked={state.windowsFreshAir === "no"}
                  onChange={setWindowsFreshAir}
                  label="No"
                  description="I rely on mechanical systems."
                />
              </div>
            </div>

            {/* ---- RIGHT: Quadrant + Insights ---- */}
            <div className="flex-1 flex flex-col items-center min-w-0">
              <QuadrantChart score={score} hasSelection={selected} />
            </div>
          </div>

          {/* Score Reference Table */}
          <ScoreTable currentState={state} />
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
