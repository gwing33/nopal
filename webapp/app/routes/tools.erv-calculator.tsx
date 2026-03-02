import { useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Breadcrumb } from "../components/Breadcrumb";
import { NumberInput } from "../components/NumberInput";
import { Link } from "@remix-run/react";
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: "ERV Calculator | Nopal Tools" },
  {
    name: "description",
    content:
      "Size your ERV/HRV system based on occupancy. Calculate supply and exhaust tube counts, design base flow, boost flow, and get unit recommendations from Zehnder and Brink.",
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type KitchenHood = "recirculating" | "outside" | "outside-makeup" | "none";

interface Inputs {
  bedrooms: number;
  fullBathrooms: number;
  halfBathrooms: number;
  hasLaundry: boolean;
  kitchenHood: KitchenHood;
  fullTimePeople: number;
  maxPeople: number;
}

interface RoomTubes {
  room: string;
  type: "supply" | "exhaust";
  count: number;
  tubes: number;
  totalTubes: number;
}

interface UnitRecommendation {
  brand: string;
  model: string;
  maxCFM: number;
  note: string;
}

interface Calculations {
  roomBreakdown: RoomTubes[];
  totalSupplyTubes: number;
  totalExhaustTubes: number;
  designBaseFlow: number;
  cfmPerTubeBase: number;
  maxBoostFlow: number;
  maxBoostFlowQuiet: number;
  cfmPerTubeBoost: number;
  cfmPerTubeBoostQuiet: number;
  recommendations: UnitRecommendation[];
  sizeUpNote: string;
}

// ---------------------------------------------------------------------------
// Constants — ERV/HRV unit catalog
// ---------------------------------------------------------------------------

const UNITS: UnitRecommendation[] = [
  {
    brand: "Zehnder",
    model: "ComfoAir Q350",
    maxCFM: 206,
    note: "350 m³/h — good for small-to-medium homes",
  },
  {
    brand: "Zehnder",
    model: "ComfoAir Q450",
    maxCFM: 265,
    note: "450 m³/h — medium homes",
  },
  {
    brand: "Zehnder",
    model: "ComfoAir Q600",
    maxCFM: 353,
    note: "600 m³/h — large homes or high occupancy",
  },
  {
    brand: "Brink",
    model: "Flair 225",
    maxCFM: 132,
    note: "225 m³/h — small homes or apartments",
  },
  {
    brand: "Brink",
    model: "Flair 300",
    maxCFM: 177,
    note: "300 m³/h — small-to-medium homes",
  },
  {
    brand: "Brink",
    model: "Flair 325",
    maxCFM: 191,
    note: "325 m³/h — medium homes",
  },
  {
    brand: "Brink",
    model: "Flair 400",
    maxCFM: 235,
    note: "400 m³/h — medium-to-large homes",
  },
];

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_INPUTS: Inputs = {
  bedrooms: 3,
  fullBathrooms: 2,
  halfBathrooms: 1,
  hasLaundry: true,
  kitchenHood: "recirculating",
  fullTimePeople: 2,
  maxPeople: 6,
};

// ---------------------------------------------------------------------------
// Calculation engine
// ---------------------------------------------------------------------------

function compute(inputs: Inputs): Calculations {
  const {
    bedrooms,
    fullBathrooms,
    halfBathrooms,
    hasLaundry,
    fullTimePeople,
    maxPeople,
  } = inputs;

  // ---- Room-by-room tube counts ----

  const rooms: RoomTubes[] = [];

  // Supply rooms
  // Bedrooms: 3 tubes each
  if (bedrooms > 0) {
    rooms.push({
      room: bedrooms === 1 ? "Bedroom" : "Bedrooms",
      type: "supply",
      count: bedrooms,
      tubes: 3,
      totalTubes: bedrooms * 3,
    });
  }

  // Main living spaces: 3-6 tubes based on home size
  const mainTubes =
    bedrooms <= 1
      ? 3
      : bedrooms === 2
      ? 4
      : bedrooms === 3
      ? 4
      : bedrooms === 4
      ? 5
      : 6;

  rooms.push({
    room: "Main Living Space",
    type: "supply",
    count: 1,
    tubes: mainTubes,
    totalTubes: mainTubes,
  });

  // Exhaust rooms
  // Full bathrooms: 3-4 tubes each (4 for larger homes with more bathrooms)
  if (fullBathrooms > 0) {
    const bathTubes = fullBathrooms >= 3 || bedrooms >= 4 ? 4 : 3;
    rooms.push({
      room: fullBathrooms === 1 ? "Full Bathroom" : "Full Bathrooms",
      type: "exhaust",
      count: fullBathrooms,
      tubes: bathTubes,
      totalTubes: fullBathrooms * bathTubes,
    });
  }

  // Half bathrooms: 2 tubes each
  if (halfBathrooms > 0) {
    rooms.push({
      room: halfBathrooms === 1 ? "Half Bathroom" : "Half Bathrooms",
      type: "exhaust",
      count: halfBathrooms,
      tubes: 2,
      totalTubes: halfBathrooms * 2,
    });
  }

  // Kitchen: 3 tubes (exhaust)
  rooms.push({
    room: "Kitchen",
    type: "exhaust",
    count: 1,
    tubes: 3,
    totalTubes: 3,
  });

  // Laundry room: 2-3 tubes (exhaust)
  if (hasLaundry) {
    const laundryTubes = bedrooms >= 4 ? 3 : 2;
    rooms.push({
      room: "Laundry Room",
      type: "exhaust",
      count: 1,
      tubes: laundryTubes,
      totalTubes: laundryTubes,
    });
  }

  // ---- Totals ----
  const totalSupplyTubes = rooms
    .filter((r) => r.type === "supply")
    .reduce((sum, r) => sum + r.totalTubes, 0);

  const totalExhaustTubes = rooms
    .filter((r) => r.type === "exhaust")
    .reduce((sum, r) => sum + r.totalTubes, 0);

  const totalTubes = Math.max(totalSupplyTubes, totalExhaustTubes);

  // ---- Design base flow ----
  // Target ~10 CFM per tube, sized by occupants: ~25 CFM/person at night
  const occupantBaseFlow = fullTimePeople * 25;
  const tubeBaseFlow = totalTubes * 10;
  const designBaseFlow = Math.max(occupantBaseFlow, tubeBaseFlow);
  const cfmPerTubeBase = Math.round((designBaseFlow / totalTubes) * 10) / 10;

  // ---- Max boost flow ----
  // 35-50 CFM per person at max occupancy
  const maxBoostFlow = maxPeople * 50;
  const maxBoostFlowQuiet = maxPeople * 35;
  const cfmPerTubeBoost = Math.round((maxBoostFlow / totalTubes) * 10) / 10;
  const cfmPerTubeBoostQuiet =
    Math.round((maxBoostFlowQuiet / totalTubes) * 10) / 10;

  // ---- Unit recommendations ----
  // Find the smallest unit that can handle the max boost flow, then include the next size up
  const sortedUnits = [...UNITS].sort((a, b) => a.maxCFM - b.maxCFM);

  const recommendations: UnitRecommendation[] = [];

  // Find minimum viable Zehnder
  const zehnderUnits = sortedUnits.filter((u) => u.brand === "Zehnder");
  const minZehnder = zehnderUnits.find((u) => u.maxCFM >= maxBoostFlowQuiet);
  const sizeUpZehnder = minZehnder
    ? zehnderUnits.find((u) => u.maxCFM > minZehnder.maxCFM)
    : null;

  if (minZehnder) recommendations.push(minZehnder);
  if (sizeUpZehnder) recommendations.push(sizeUpZehnder);

  // Find minimum viable Brink
  const brinkUnits = sortedUnits.filter((u) => u.brand === "Brink");
  const minBrink = brinkUnits.find((u) => u.maxCFM >= maxBoostFlowQuiet);
  const sizeUpBrink = minBrink
    ? brinkUnits.find((u) => u.maxCFM > minBrink.maxCFM)
    : null;

  if (minBrink) recommendations.push(minBrink);
  if (sizeUpBrink) recommendations.push(sizeUpBrink);

  // If nothing meets the minimum, recommend the largest from each brand
  if (!minZehnder) {
    const largest = zehnderUnits[zehnderUnits.length - 1];
    if (largest)
      recommendations.push({
        ...largest,
        note: largest.note + " ⚠️ May need multiple units",
      });
  }
  if (!minBrink) {
    const largest = brinkUnits[brinkUnits.length - 1];
    if (largest)
      recommendations.push({
        ...largest,
        note: largest.note + " ⚠️ May need multiple units",
      });
  }

  let sizeUpNote = "";
  if (cfmPerTubeBoost > 25) {
    sizeUpNote =
      "⚠️ At max boost, CFM per tube exceeds 25. Consider adding more tubes or reducing max occupancy expectations. CO₂-controlled boost will modulate automatically.";
  } else if (cfmPerTubeBoost > 18) {
    sizeUpNote =
      "At max boost, CFM per tube exceeds 18 (the quietest threshold) but stays under 25. Acceptable for periodic boost events.";
  }

  return {
    roomBreakdown: rooms,
    totalSupplyTubes,
    totalExhaustTubes,
    designBaseFlow,
    cfmPerTubeBase,
    maxBoostFlow,
    maxBoostFlowQuiet,
    cfmPerTubeBoost,
    cfmPerTubeBoostQuiet,
    recommendations,
    sizeUpNote,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold mb-1">{children}</h3>;
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-xs purple-light-text mb-2">{children}</p>;
}

const KITCHEN_HOOD_OPTIONS: { value: KitchenHood; label: string }[] = [
  { value: "none", label: "None" },
  { value: "recirculating", label: "Recirculating" },
  { value: "outside", label: "Vented Outside" },
  { value: "outside-makeup", label: "Outside + Make-Up Air" },
];

function InputGroup({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <SectionHeading>{label}</SectionHeading>
      {description && <SectionDescription>{description}</SectionDescription>}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Output Display
// ---------------------------------------------------------------------------

function ResultCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="good-box p-4 mb-4">
      <h3 className="text-base font-bold mb-3 purple-light-text">{title}</h3>
      {children}
    </div>
  );
}

function TubeIcon({ type }: { type: "supply" | "exhaust" }) {
  return (
    <span
      title={
        type === "supply" ? "Supply (fresh air in)" : "Exhaust (stale air out)"
      }
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        backgroundColor: type === "supply" ? "var(--green)" : "var(--pink)",
        marginRight: 4,
        verticalAlign: "middle",
      }}
    />
  );
}

function OutputPanel({ calc }: { calc: Calculations }) {
  return (
    <div>
      {/* Tube Breakdown */}
      <ResultCard title="Duct Tubes by Room">
        <div className="flex gap-4 mb-3 text-xs">
          <span className="flex items-center gap-1">
            <TubeIcon type="supply" /> Supply (fresh air in)
          </span>
          <span className="flex items-center gap-1">
            <TubeIcon type="exhaust" /> Exhaust (stale air out)
          </span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              className="text-xs purple-light-text"
              style={{ borderBottom: "1px solid var(--foreground)" }}
            >
              <th style={{ textAlign: "left", padding: "4px 8px 4px 0" }}>
                Room
              </th>
              <th style={{ textAlign: "center", padding: "4px 8px" }}>Type</th>
              <th style={{ textAlign: "center", padding: "4px 8px" }}>Qty</th>
              <th style={{ textAlign: "center", padding: "4px 8px" }}>
                Tubes Each
              </th>
              <th style={{ textAlign: "right", padding: "4px 0 4px 8px" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {calc.roomBreakdown.map((r, i) => (
              <tr
                key={i}
                style={{
                  borderBottom:
                    i < calc.roomBreakdown.length - 1
                      ? "1px solid var(--foreground)"
                      : "none",
                }}
              >
                <td style={{ padding: "6px 8px 6px 0", fontSize: 14 }}>
                  <TubeIcon type={r.type} />
                  {r.room}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  {r.type}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    fontSize: 14,
                  }}
                >
                  ×{r.count}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "6px 8px",
                    fontSize: 14,
                  }}
                >
                  {r.tubes}
                </td>
                <td
                  style={{
                    textAlign: "right",
                    padding: "6px 0 6px 8px",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {r.totalTubes}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: "2px solid var(--foreground)" }}>
              <td
                colSpan={4}
                style={{
                  padding: "8px 8px 4px 0",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Total Supply Tubes
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "8px 0 4px 8px",
                  fontSize: 16,
                  fontWeight: 700,
                }}
                className="green-text"
              >
                {calc.totalSupplyTubes}
              </td>
            </tr>
            <tr>
              <td
                colSpan={4}
                style={{
                  padding: "0 8px 4px 0",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Total Exhaust Tubes
              </td>
              <td
                style={{
                  textAlign: "right",
                  padding: "0 0 4px 8px",
                  fontSize: 16,
                  fontWeight: 700,
                }}
                className="pink-text"
              >
                {calc.totalExhaustTubes}
              </td>
            </tr>
          </tfoot>
        </table>
        <p className="text-xs mt-3 opacity-70">
          Using 3″ flexible ducts (Zehnder/Brink ComfoPipe). Each register
          connects 1–3 tubes.
        </p>
      </ResultCard>

      {/* Design Base Flow */}
      <ResultCard title="Design Base Flow">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            style={{ fontSize: 28, fontWeight: 700 }}
            className="green-text"
          >
            {calc.designBaseFlow}
          </span>
          <span className="text-sm opacity-70">CFM</span>
        </div>
        <p className="text-xs opacity-70 mb-2">
          Based on {calc.cfmPerTubeBase} CFM per tube (target ~10 CFM/tube).
        </p>
        <p className="text-xs opacity-70">
          This is your continuous ventilation rate — enough to maintain
          excellent air quality for{" "}
          {calc.roomBreakdown.find((r) => r.room.includes("Bedroom"))?.count ??
            0}{" "}
          bedrooms with normal overnight occupancy.
        </p>
      </ResultCard>

      {/* Max Boost Flow */}
      <ResultCard title="Max Boost Flow">
        <div className="flex flex-wrap gap-6 mb-2">
          <div>
            <div className="text-xs opacity-70 mb-1">
              Standard Boost (50 CFM/person)
            </div>
            <div className="flex items-baseline gap-2">
              <span
                style={{ fontSize: 28, fontWeight: 700 }}
                className="purple-light-text"
              >
                {calc.maxBoostFlow}
              </span>
              <span className="text-sm opacity-70">CFM</span>
            </div>
            <div className="text-xs opacity-70">
              {calc.cfmPerTubeBoost} CFM/tube
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70 mb-1">
              Quiet Boost (35 CFM/person)
            </div>
            <div className="flex items-baseline gap-2">
              <span
                style={{ fontSize: 28, fontWeight: 700 }}
                className="purple-light-text"
              >
                {calc.maxBoostFlowQuiet}
              </span>
              <span className="text-sm opacity-70">CFM</span>
            </div>
            <div className="text-xs opacity-70">
              {calc.cfmPerTubeBoostQuiet} CFM/tube
            </div>
          </div>
        </div>
        <p className="text-xs opacity-70 mb-1">
          Boost is CO₂-controlled — the unit ramps up automatically when
          occupancy rises. Target under 25 CFM/tube (18 CFM/tube for the
          quietest operation).
        </p>
        {calc.sizeUpNote && (
          <p
            className="text-xs mt-2"
            style={{
              color: calc.sizeUpNote.startsWith("⚠️")
                ? "var(--red-light)"
                : "var(--green)",
            }}
          >
            {calc.sizeUpNote}
          </p>
        )}
      </ResultCard>

      {/* Unit Recommendations */}
      <ResultCard title="Unit Recommendations">
        <p className="text-xs opacity-70 mb-3">
          Larger units use less power and make less noise at a given flow rate.
          Sizing up is often a good idea. Flow rates can be set at 3–4 speeds.
        </p>
        <div className="space-y-3">
          {calc.recommendations.map((unit, i) => {
            const isMinSize =
              i === 0 ||
              (calc.recommendations[i - 1] &&
                calc.recommendations[i - 1].brand !== unit.brand &&
                !calc.recommendations
                  .slice(0, i)
                  .some((u) => u.brand === unit.brand));
            return (
              <div
                key={`${unit.brand}-${unit.model}`}
                className="good-box-boarder"
                style={{
                  padding: "10px 12px",
                  borderColor: isMinSize ? "var(--green)" : undefined,
                }}
              >
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <div>
                    <span className="text-sm font-bold">{unit.brand}</span>{" "}
                    <span className="text-sm font-semibold green-text">
                      {unit.model}
                    </span>
                    {isMinSize && (
                      <span
                        className="text-xs ml-2"
                        style={{
                          background: "var(--green)",
                          color: "white",
                          padding: "1px 6px",
                          borderRadius: 3,
                          fontWeight: 600,
                        }}
                      >
                        min. size
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold">
                    {unit.maxCFM} CFM max
                  </span>
                </div>
                <p className="text-xs opacity-70 mt-1">{unit.note}</p>
                {isMinSize && unit.maxCFM < calc.maxBoostFlow && (
                  <p className="text-xs mt-1" style={{ color: "var(--green)" }}>
                    Handles quiet boost ({calc.maxBoostFlowQuiet} CFM). Standard
                    boost ({calc.maxBoostFlow} CFM)
                    {unit.maxCFM >= calc.maxBoostFlow
                      ? " ✓"
                      : " may push near max capacity — consider sizing up."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </ResultCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Kitchen Hood Info
// ---------------------------------------------------------------------------

function KitchenHoodNote({ hood }: { hood: KitchenHood }) {
  switch (hood) {
    case "outside":
      return (
        <p className="text-xs mt-1" style={{ color: "var(--pink)" }}>
          An externally vented hood creates negative pressure. The ERV's
          balanced airflow helps, but during heavy cooking the home
          depressurizes slightly. Ensure adequate make-up air path.
        </p>
      );
    case "outside-makeup":
      return (
        <p className="text-xs mt-1" style={{ color: "var(--green)" }}>
          Great setup. Dedicated make-up air keeps the home balanced even during
          heavy cooking. The ERV system is not affected.
        </p>
      );
    case "recirculating":
      return (
        <p className="text-xs mt-1 opacity-70">
          Recirculating hoods filter grease and some odors but don't remove
          moisture or combustion byproducts. The ERV's kitchen exhaust tubes
          handle moisture removal.
        </p>
      );
    default:
      return (
        <p className="text-xs mt-1 opacity-70">
          Without a range hood, the ERV's kitchen exhaust does the heavy
          lifting. Consider adding at least a recirculating hood for grease
          capture.
        </p>
      );
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ERVCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ ...INITIAL_INPUTS });

  const calc = useMemo(() => compute(inputs), [inputs]);

  const update = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setInputs({ ...INITIAL_INPUTS });
  };

  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4" style={{ maxWidth: 960 }}>
          <div className="mt-4 mb-6">
            <Breadcrumb>
              <Link
                to="/tools"
                className="hover:underline purple-light-text text-sm"
              >
                Tools
              </Link>
            </Breadcrumb>
          </div>

          <h1 className="purple-light-text text-4xl mt-4">ERV Calculator</h1>
          <p className="text-lg mt-2 mb-2">
            Size your balanced ventilation system based on occupancy, not
            building size.
          </p>
          <p className="text-xs opacity-70 mb-6" style={{ maxWidth: 620 }}>
            Our data shows interior CO₂ should stay under 800–1,000 ppm. That
            takes ~25 CFM per person at night and 35–50 during the day. VOCs and
            other contaminants follow a similar pattern. Boost control should
            always be CO₂-driven (bonus for VOC sensing too).
          </p>

          {/* Main two-column layout */}
          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            {/* ---- LEFT SIDEBAR: Inputs ---- */}
            <div>
              <div className="good-box sm:w-[280px] shrink-0 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-bold">Your Home</h2>
                  <button
                    onClick={handleReset}
                    className="btn-outline rounded px-2 py-1 text-xs purple-text"
                  >
                    Reset
                  </button>
                </div>

                {/* Bedrooms */}
                <InputGroup label="Bedrooms">
                  <NumberInput
                    value={inputs.bedrooms}
                    onChange={(v) => update("bedrooms", v)}
                    min={1}
                    max={12}
                    step={1}
                  />
                </InputGroup>

                {/* Full Bathrooms */}
                <InputGroup label="Full Bathrooms">
                  <NumberInput
                    value={inputs.fullBathrooms}
                    onChange={(v) => update("fullBathrooms", v)}
                    min={0}
                    max={10}
                    step={1}
                  />
                </InputGroup>

                {/* Half Bathrooms */}
                <InputGroup label="Half Bathrooms">
                  <NumberInput
                    value={inputs.halfBathrooms}
                    onChange={(v) => update("halfBathrooms", v)}
                    min={0}
                    max={6}
                    step={1}
                  />
                </InputGroup>

                {/* Laundry */}
                <InputGroup label="Dedicated Laundry Room?">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => update("hasLaundry", true)}
                      className={`text-xs px-3 py-1.5 rounded ${
                        inputs.hasLaundry
                          ? "purple-light-text"
                          : "purple-text opacity-60"
                      }`}
                      style={{
                        border: inputs.hasLaundry
                          ? "2px solid var(--purple-light)"
                          : "1px solid var(--foreground)",
                        fontWeight: inputs.hasLaundry ? 700 : 400,
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => update("hasLaundry", false)}
                      className={`text-xs px-3 py-1.5 rounded ${
                        !inputs.hasLaundry
                          ? "purple-light-text"
                          : "purple-text opacity-60"
                      }`}
                      style={{
                        border: !inputs.hasLaundry
                          ? "2px solid var(--purple-light)"
                          : "1px solid var(--foreground)",
                        fontWeight: !inputs.hasLaundry ? 700 : 400,
                        background: "none",
                        cursor: "pointer",
                      }}
                    >
                      No
                    </button>
                  </div>
                </InputGroup>

                {/* Kitchen Hood */}
                <InputGroup
                  label="Kitchen Hood"
                  description="How is cooking exhaust handled?"
                >
                  <div className="flex flex-col gap-1.5">
                    {KITCHEN_HOOD_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update("kitchenHood", opt.value)}
                        className={`text-left text-xs px-3 py-1.5 rounded ${
                          inputs.kitchenHood === opt.value
                            ? "purple-light-text"
                            : "purple-text opacity-70"
                        }`}
                        style={{
                          border:
                            inputs.kitchenHood === opt.value
                              ? "2px solid var(--purple-light)"
                              : "1px solid var(--foreground)",
                          fontWeight:
                            inputs.kitchenHood === opt.value ? 700 : 400,
                          background: "none",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <KitchenHoodNote hood={inputs.kitchenHood} />
                </InputGroup>

                <hr className="my-4" />

                {/* Occupancy */}
                <InputGroup
                  label="Full-Time Residents"
                  description="People living in the home day-to-day."
                >
                  <NumberInput
                    value={inputs.fullTimePeople}
                    onChange={(v) => update("fullTimePeople", v)}
                    min={1}
                    max={20}
                    step={1}
                  />
                </InputGroup>

                <InputGroup
                  label="Max Periodic Occupancy"
                  description="Largest gathering you regularly host (e.g. weekly family dinner, group events)."
                >
                  <NumberInput
                    value={inputs.maxPeople}
                    onChange={(v) => update("maxPeople", v)}
                    min={1}
                    max={50}
                    step={1}
                  />
                </InputGroup>
              </div>
            </div>
            {/* ---- RIGHT: Output Panel ---- */}
            <div className="flex-1 min-w-0">
              <OutputPanel calc={calc} />

              {/* Design philosophy note */}
              <div className="good-box p-4 mb-4">
                <h3 className="text-base font-bold mb-2 purple-light-text">
                  Why Size by Occupancy?
                </h3>
                <p className="text-xs opacity-80 mb-2">
                  Industry standards typically size ventilation by building
                  square footage. Our collected data shows this is wrong — CO₂
                  and VOC levels are driven by <em>people</em>, not floor area.
                </p>
                <p className="text-xs opacity-80 mb-2">
                  Balanced ventilation through dedicated small-diameter ductwork
                  (3″ flex tubes from Zehnder or Brink) gives precise control to
                  each room. This matters because the flows are low and every
                  room needs the right amount — not too much, not too little.
                </p>
                <p className="text-xs opacity-80">
                  Boost control should always be CO₂-driven, with VOC sensing as
                  a bonus. The unit automatically ramps up when a dinner party
                  fills the living room and scales back at night when everyone's
                  asleep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
