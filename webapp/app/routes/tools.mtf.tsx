import { useState, useMemo } from "react";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Breadcrumb } from "../components/Breadcrumb";
import { VisualPreviewer } from "../features/ViewFinder/VisualPreviewer";
import {
  buildMTFPostGeometry,
  DEFAULT_MTF_PARAMS,
} from "../features/ViewFinder/MTFGeo";
import type { MTFParams } from "../features/ViewFinder/MTFGeo";
import CutStockOptimizer from "../calculators/CutStockOptimizer";
import { NumberInput } from "../components/NumberInput";
import type { MetaFunction } from "react-router";
import { Link } from "react-router";

export const meta: MetaFunction = () => [
  { title: "MTF | Nopal Tools" },
  {
    name: "description",
    content: "Tool helping understand MTF",
  },
];

// ── Constants ────────────────────────────────────────────────────────────────

const NEW_STOCK = [
  { size: 8, unit: "ft" as const },
  { size: 10, unit: "ft" as const },
  { size: 12, unit: "ft" as const },
  { size: 16, unit: "ft" as const },
];

const KERF = { size: 0.125, unit: "in" as const }; // 1/8" blade kerf

// ── Piece colour palette ──────────────────────────────────────────────────────

const PIECE_COLORS: Record<string, string> = {
  Stud: "#6366f1", // indigo
  "Sill Tenon": "#10b981", // emerald
  "Mid Tenon": "#0891b2", // cyan-600
  "Top Tenon": "#7c3aed", // violet-600
  "Lower Bridging": "#ea580c", // orange-600
  "Upper Bridging": "#d97706", // amber-600
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format an inch value as "X″" or "X′ (Y″)" when evenly divisible by 12. */
function fmtIn(inches: number): string {
  if (inches % 12 === 0) return `${inches / 12}′ (${inches}″)`;
  return `${inches}″`;
}

/** Group an array of Measurements by their "sizeunit" key and count occurrences. */
function countByKey(
  items: { size: number; unit: string }[],
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, m) => {
    const key = `${m.size}${m.unit}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

/** Convert any Measurement to inches. */
function toInches(m: { size: number; unit: string }): number {
  const factors: Record<string, number> = {
    in: 1,
    ft: 12,
    mm: 1 / 25.4,
    cm: 1 / 2.54,
    m: 39.3701,
  };
  return m.size * (factors[m.unit] ?? 1);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function MTFCalc() {
  // ── Dimension state (all in inches) ──────────────────────────────────────
  const [studLength, setStudLength] = useState(DEFAULT_MTF_PARAMS.studLength);
  const [sillTenonLength, setSillTenonLength] = useState(
    DEFAULT_MTF_PARAMS.sillTenonLength,
  );
  const [midTenonLength, setMidTenonLength] = useState(
    DEFAULT_MTF_PARAMS.midTenonLength,
  );
  const [topTenonLength, setTopTenonLength] = useState(
    DEFAULT_MTF_PARAMS.topTenonLength,
  );
  const [topTenonOverlap, setTopTenonOverlap] = useState(
    DEFAULT_MTF_PARAMS.topTenonOverlap,
  );
  const [lowerBridgingLength, setLowerBridgingLength] = useState(
    DEFAULT_MTF_PARAMS.lowerBridgingLength,
  );
  const [upperBridgingLength, setUpperBridgingLength] = useState(
    DEFAULT_MTF_PARAMS.upperBridgingLength,
  );

  // ── Takeoff state ─────────────────────────────────────────────────────────
  const [postCount, setPostCount] = useState(1);

  // ── Available stock state ─────────────────────────────────────────────────
  type StockUnit = "in" | "ft" | "mm" | "cm" | "m";
  const [availableStock, setAvailableStock] =
    useState<{ size: number; unit: StockUnit }[]>(NEW_STOCK);
  const [addSize, setAddSize] = useState(14);
  const [addUnit, setAddUnit] = useState<StockUnit>("ft");

  // ── Geometry (rebuilds only when dimensions change) ───────────────────────
  const params: MTFParams = useMemo(
    () => ({
      studLength,
      sillTenonLength,
      midTenonLength,
      topTenonLength,
      topTenonOverlap,
      lowerBridgingLength,
      upperBridgingLength,
    }),
    [
      studLength,
      sillTenonLength,
      midTenonLength,
      topTenonLength,
      topTenonOverlap,
      lowerBridgingLength,
      upperBridgingLength,
    ],
  );

  const geo = useMemo(() => buildMTFPostGeometry(params), [params]);

  // ── Cuts per post ─────────────────────────────────────────────────────────
  //
  // isPaired = false → cut from individual boards (studs)
  // isPaired = true  → boards are glued face-to-face BEFORE cutting, so each
  //                    physical saw-pass through the 2-ply blank yields both
  //                    pieces simultaneously.  The optimizer therefore works
  //                    on 1 cut per piece per post (count 2 comes for free),
  //                    and each "board" in the result represents 2 physicals.
  const cutPieces = useMemo(
    () => [
      { label: "Stud", length: studLength, count: 2, isPaired: false },
      {
        label: "Sill Tenon",
        length: sillTenonLength,
        count: 2,
        isPaired: true,
      },
      { label: "Mid Tenon", length: midTenonLength, count: 2, isPaired: true },
      { label: "Top Tenon", length: topTenonLength, count: 2, isPaired: true },
      {
        label: "Lower Bridging",
        length: lowerBridgingLength,
        count: 2,
        isPaired: true,
      },
      {
        label: "Upper Bridging",
        length: upperBridgingLength,
        count: 2,
        isPaired: true,
      },
    ],
    [
      studLength,
      sillTenonLength,
      midTenonLength,
      topTenonLength,
      lowerBridgingLength,
      upperBridgingLength,
    ],
  );

  // ── Stud optimizer — individual boards ───────────────────────────────────
  const studOptimizer = useMemo(() => {
    const cuts = cutPieces
      .filter((p) => !p.isPaired)
      .flatMap(({ label, length, count }) =>
        Array.from({ length: count * postCount }, () => ({
          size: length,
          unit: "in" as const,
          label,
        })),
      );

    const result = CutStockOptimizer({
      cuts,
      kerf: KERF,
      newStock: availableStock,
      onHandStock: [],
    });

    const stockCounts = countByKey(result.usedStock);
    const nonZeroOffCuts = result.offCuts.filter((o) => toInches(o) > 0);
    const totalOffCutIn = nonZeroOffCuts.reduce(
      (sum, m) => sum + toInches(m),
      0,
    );

    return { ...result, stockCounts, nonZeroOffCuts, totalOffCutIn };
  }, [cutPieces, postCount, availableStock]);

  // ── Paired optimizer — tenons + bridging from glued board pairs ───────────
  //
  // We feed 1 cut per piece per post (not 2) because both boards in the glued
  // pair are sawn at the same time, so one optimizer "slot" already accounts
  // for both physical boards.  Each board that comes out of this optimizer
  // represents TWO physical 2×6s that will be glued and cut together.
  const pairedOptimizer = useMemo(() => {
    const cuts = cutPieces
      .filter((p) => p.isPaired)
      .flatMap(({ label, length }) =>
        Array.from({ length: postCount }, () => ({
          size: length,
          unit: "in" as const,
          label,
        })),
      );

    const result = CutStockOptimizer({
      cuts,
      kerf: KERF,
      newStock: availableStock,
      onHandStock: [],
    });

    const stockCounts = countByKey(result.usedStock);
    const nonZeroOffCuts = result.offCuts.filter((o) => toInches(o) > 0);
    const totalOffCutIn = nonZeroOffCuts.reduce(
      (sum, m) => sum + toInches(m),
      0,
    );

    return { ...result, stockCounts, nonZeroOffCuts, totalOffCutIn };
  }, [cutPieces, postCount, availableStock]);

  // ── Combined stock counts ─────────────────────────────────────────────────
  // Paired boards × 2 because each optimizer "board" = 2 physical boards.
  const combinedStockCounts = useMemo(() => {
    const counts: Record<string, number> = { ...studOptimizer.stockCounts };
    for (const [key, cnt] of Object.entries(pairedOptimizer.stockCounts)) {
      counts[key] = (counts[key] ?? 0) + cnt * 2;
    }
    return counts;
  }, [studOptimizer.stockCounts, pairedOptimizer.stockCounts]);

  const totalPhysicalBoards =
    studOptimizer.boards.length + pairedOptimizer.boards.length * 2;

  const totalOffCutIn =
    studOptimizer.totalOffCutIn + pairedOptimizer.totalOffCutIn * 2;

  const midCenter = studLength / 2;

  // ── Board-layout visualization ────────────────────────────────────────────
  /**
   * Renders one physical board (or one board of a pair) as a proportional
   * horizontal bar.  Each cut gets a colour-coded segment; the off-cut tail
   * is shown in grey.  Pass isPair=true to show the "×2 boards" badge.
   */
  function BoardBar({
    board,
    index,
    isPair = false,
  }: {
    board: {
      stock: { size: number; unit: string };
      cuts: { size: number; unit: string; label?: string }[];
      offCutMM: number;
    };
    index: number;
    isPair?: boolean;
  }) {
    const stockIn = toInches(board.stock as { size: number; unit: string });
    const offCutIn = board.offCutMM / 25.4;
    const usedIn = stockIn - offCutIn;
    const wastePercent = ((offCutIn / stockIn) * 100).toFixed(1);

    return (
      <div className="flex items-center gap-3">
        {/* Board label */}
        <div className="shrink-0 text-right" style={{ width: "2.5rem" }}>
          <span className="text-xs font-mono opacity-40">#{index + 1}</span>
        </div>
        <div className="shrink-0" style={{ width: "2.5rem" }}>
          <span className="text-xs opacity-50">
            {board.stock.size}
            {board.stock.unit}
          </span>
        </div>

        {/* Bar */}
        <div className="flex-1 flex rounded overflow-hidden h-7 text-xs font-medium">
          {board.cuts.map((cut, ci) => {
            const cutIn = toInches(cut as { size: number; unit: string });
            const pct = (cutIn / stockIn) * 100;
            const color = PIECE_COLORS[cut.label ?? ""] ?? "#94a3b8";
            const showLabel = pct > 8;
            return (
              <div
                key={ci}
                style={{ width: `${pct}%`, backgroundColor: color }}
                className="flex items-center justify-center text-white overflow-hidden whitespace-nowrap border-r border-black/20 last:border-r-0"
                title={`${cut.label ?? "Cut"}: ${cutIn}″`}
              >
                {showLabel && (
                  <span
                    className="px-1 truncate leading-none"
                    style={{ fontSize: "0.65rem" }}
                  >
                    {cut.label}
                  </span>
                )}
              </div>
            );
          })}
          {offCutIn > 0 && (
            <div
              style={{ width: `${(offCutIn / stockIn) * 100}%` }}
              className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 overflow-hidden whitespace-nowrap"
              title={`Off-cut: ${offCutIn.toFixed(2)}″`}
            >
              {(offCutIn / stockIn) * 100 > 5 && (
                <span className="px-1 truncate" style={{ fontSize: "0.65rem" }}>
                  {offCutIn.toFixed(1)}″
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pair badge or waste % */}
        <div
          className="shrink-0 flex items-center justify-end gap-2"
          style={{ width: "5rem" }}
        >
          {isPair && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium leading-none">
              ×2
            </span>
          )}
          <span
            className={`text-xs tabular-nums ${
              parseFloat(wastePercent) > 20
                ? "text-orange-500 dark:text-orange-400"
                : "opacity-40"
            }`}
          >
            {wastePercent}%
          </span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <Breadcrumb>
            <Link to="/tools">All Tools</Link>
          </Breadcrumb>

          <h1 className="text-4xl font-bold mt-8">MTF</h1>

          {/* ── Dimension Controls ──────────────────────────────────────────── */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Post Dimensions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Stud Length (in)
                </label>
                <NumberInput
                  value={studLength}
                  onChange={setStudLength}
                  min={24}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Sill Tenon (in)
                </label>
                <NumberInput
                  value={sillTenonLength}
                  onChange={setSillTenonLength}
                  min={1}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Mid Tenon (in)
                </label>
                <NumberInput
                  value={midTenonLength}
                  onChange={setMidTenonLength}
                  min={1}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Top Tenon (in)
                </label>
                <NumberInput
                  value={topTenonLength}
                  onChange={setTopTenonLength}
                  min={1}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Top Tenon Overlap (in)
                </label>
                <NumberInput
                  value={topTenonOverlap}
                  onChange={setTopTenonOverlap}
                  min={0}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Lower Bridging (in)
                </label>
                <NumberInput
                  value={lowerBridgingLength}
                  onChange={setLowerBridgingLength}
                  min={1}
                  step={0.5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">
                  Upper Bridging (in)
                </label>
                <NumberInput
                  value={upperBridgingLength}
                  onChange={setUpperBridgingLength}
                  min={1}
                  step={0.5}
                />
              </div>
            </div>
          </section>

          {/* ── 3-D Preview ─────────────────────────────────────────────────── */}
          <VisualPreviewer geometry={geo} />

          {/* ── Post Spec Summary ───────────────────────────────────────────── */}
          <div className="mt-10 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Studs</p>
              <p className="opacity-70">
                2× 2×6 @ {fmtIn(studLength)} — 1.5″ × 5.5″ actual
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Tenon / Bridging block</p>
              <p className="opacity-70">
                2× 2×6 laminated — 3″ × 5.5″ cross-section
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Top Tenon</p>
              <p className="opacity-70">
                {topTenonLength}″ vertical · inserts {topTenonOverlap}″ below
                stud top
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Upper Bridging</p>
              <p className="opacity-70">
                {upperBridgingLength}″ vertical · centred between mid &amp; top
                tenons
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Mid Tenon</p>
              <p className="opacity-70">
                {midTenonLength}″ horizontal · centred at {fmtIn(midCenter)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="font-semibold mb-1">Lower Bridging</p>
              <p className="opacity-70">
                {lowerBridgingLength}″ vertical · centred between sill &amp; mid
                tenons
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 sm:col-span-2">
              <p className="font-semibold mb-1">Sill Tenon</p>
              <p className="opacity-70">
                {sillTenonLength}″ horizontal · at base (0″)
              </p>
            </div>
          </div>

          {/* ── Takeoffs ────────────────────────────────────────────────────── */}
          <section className="mt-10 mb-12">
            <h2 className="text-lg font-semibold mb-4">Takeoffs</h2>

            {/* Post count */}
            <div className="flex items-center gap-4 mb-8">
              <label className="text-sm font-medium opacity-70 whitespace-nowrap">
                Number of Posts
              </label>
              <NumberInput
                value={postCount}
                onChange={setPostCount}
                min={1}
                step={1}
                className="w-44"
              />
            </div>

            {/* Cuts per post table */}
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Cuts per Post
            </h3>

            {/* Pairing callout */}
            <div className="mb-4 flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
              <span className="mt-0.5 shrink-0">💡</span>
              <span>
                <strong>Board pairing:</strong> Tenons and bridging are cut from
                boards that have been glued face-to-face first. One saw-pass
                through the 2-ply blank yields both pieces at once, so the cut
                layout below optimises <em>pairs</em> of boards — each row
                marked <span className="font-semibold">×2</span> represents two
                physical boards glued together.
              </span>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left pb-2 font-medium opacity-60 pr-6">
                      Piece
                    </th>
                    <th className="text-right pb-2 font-medium opacity-60 pr-6">
                      Length
                    </th>
                    <th className="text-right pb-2 font-medium opacity-60 pr-6">
                      Qty / post
                    </th>
                    <th className="text-right pb-2 font-medium opacity-60 pr-6">
                      Total ({postCount} {postCount === 1 ? "post" : "posts"})
                    </th>
                    <th className="text-right pb-2 font-medium opacity-60">
                      Method
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cutPieces.map(({ label, length, count, isPaired }) => (
                    <tr
                      key={label}
                      className="border-b border-gray-100 dark:border-gray-800/60"
                    >
                      <td className="py-2 pr-6">{label}</td>
                      <td className="py-2 pr-6 text-right tabular-nums">
                        {length}″
                      </td>
                      <td className="py-2 pr-6 text-right tabular-nums">
                        {count}
                      </td>
                      <td className="py-2 pr-6 text-right tabular-nums font-medium">
                        {count * postCount}
                      </td>
                      <td className="py-2 text-right">
                        {isPaired ? (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            glued pair
                          </span>
                        ) : (
                          <span className="text-xs opacity-35">individual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-3 pr-6">Total pieces</td>
                    <td />
                    <td className="pt-3 pr-6 text-right tabular-nums">
                      {cutPieces.reduce((s, p) => s + p.count, 0)}
                    </td>
                    <td className="pt-3 pr-6 text-right tabular-nums">
                      {cutPieces.reduce((s, p) => s + p.count, 0) * postCount}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── Available Stock ──────────────────────────────────────────── */}
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Available Stock
            </h3>
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-3">
                {availableStock.map((s, i) => (
                  <div
                    key={`${s.size}${s.unit}-${i}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-100 dark:bg-gray-800"
                  >
                    <span className="font-medium tabular-nums">
                      {s.size}
                      {s.unit}
                    </span>
                    <span className="opacity-40 text-xs">2×6</span>
                    <button
                      onClick={() =>
                        setAvailableStock((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                      disabled={availableStock.length === 1}
                      className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full opacity-40 hover:opacity-90 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:cursor-not-allowed transition-opacity leading-none"
                      aria-label={`Remove ${s.size}${s.unit}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={addSize}
                  onChange={setAddSize}
                  min={1}
                  step={1}
                  className="w-40"
                />
                <select
                  value={addUnit}
                  onChange={(e) => setAddUnit(e.target.value as StockUnit)}
                  className="text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5"
                  style={{ color: "var(--purple)" }}
                >
                  <option value="ft">ft</option>
                  <option value="in">in</option>
                </select>
                <button
                  onClick={() => {
                    const key = `${addSize}${addUnit}`;
                    if (
                      !availableStock.some((s) => `${s.size}${s.unit}` === key)
                    ) {
                      setAvailableStock((prev) =>
                        [...prev, { size: addSize, unit: addUnit }].sort(
                          (a, b) => toInches(a) - toInches(b),
                        ),
                      );
                    }
                  }}
                  className="text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
            </div>

            {/* ── Board Layout ────────────────────────────────────────────── */}
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-4">
              Board Layout
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-5">
              {Object.entries(PIECE_COLORS).map(([label, color]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs opacity-60">{label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm shrink-0 bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs opacity-60">Off-cut</span>
              </div>
            </div>

            {/* ── Stud boards (individual) */}
            <p className="text-xs font-semibold opacity-40 mb-2 mt-1 uppercase tracking-widest">
              Stud boards — individual
            </p>
            {studOptimizer.boards.length > 0 ? (
              <div className="space-y-1.5 mb-6">
                {studOptimizer.boards.map((board, i) => (
                  <BoardBar key={i} board={board} index={i} isPair={false} />
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-40 mb-6">No stud boards.</p>
            )}

            {/* ── Tenon + bridging board pairs */}
            <p className="text-xs font-semibold opacity-40 mb-1 mt-4 uppercase tracking-widest">
              Tenon &amp; bridging — glued board pairs
            </p>
            <p className="text-xs opacity-40 mb-3">
              Each row represents two boards glued face-to-face. One layout
              serves both boards in the pair.
            </p>
            {pairedOptimizer.boards.length > 0 ? (
              <div className="space-y-1.5 mb-8">
                {pairedOptimizer.boards.map((board, i) => (
                  <BoardBar key={i} board={board} index={i} isPair={true} />
                ))}
              </div>
            ) : (
              <p className="text-sm opacity-40 mb-8">No paired boards.</p>
            )}

            {/* Material list */}
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Stock Required — 2×6 (⅛″ kerf)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {availableStock.map((s) => {
                const key = `${s.size}${s.unit}`;
                const count = combinedStockCounts[key] ?? 0;
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-lg text-center transition-opacity ${
                      count > 0
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                        : "bg-gray-50 dark:bg-gray-800 opacity-30"
                    }`}
                  >
                    <p className="text-3xl font-bold tabular-nums">{count}</p>
                    <p className="text-sm mt-0.5 opacity-70">
                      × {s.size}′&nbsp;2×6
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="text-sm opacity-60 space-y-1">
              <p>
                {totalPhysicalBoards} board
                {totalPhysicalBoards !== 1 ? "s" : ""} total (
                {studOptimizer.boards.length} stud
                {studOptimizer.boards.length !== 1 ? "s" : ""} +{" "}
                {pairedOptimizer.boards.length * 2} paired) · ~
                {totalOffCutIn.toFixed(1)}″ combined off-cuts
              </p>

              {/* Off-cut details */}
              {(studOptimizer.nonZeroOffCuts.length > 0 ||
                pairedOptimizer.nonZeroOffCuts.length > 0) && (
                <details className="mt-1 group">
                  <summary className="cursor-pointer select-none w-fit hover:opacity-80 transition-opacity list-none flex items-center gap-1.5">
                    <span className="text-xs transition-transform group-open:rotate-90 inline-block">
                      ▶
                    </span>
                    <span>
                      {studOptimizer.nonZeroOffCuts.length +
                        pairedOptimizer.nonZeroOffCuts.length}{" "}
                      off-cut
                      {studOptimizer.nonZeroOffCuts.length +
                        pairedOptimizer.nonZeroOffCuts.length !==
                      1
                        ? "s"
                        : ""}
                    </span>
                  </summary>
                  <ul className="mt-2 ml-4 space-y-0.5 tabular-nums font-mono text-xs">
                    {[
                      ...studOptimizer.nonZeroOffCuts.map((o) => ({
                        m: o,
                        tag: "",
                      })),
                      ...pairedOptimizer.nonZeroOffCuts.map((o) => ({
                        m: o,
                        tag: "×2",
                      })),
                    ]
                      .sort((a, b) => toInches(b.m) - toInches(a.m))
                      .map(({ m, tag }, i) => {
                        const inches = toInches(m);
                        const feet = Math.floor(inches / 12);
                        const remainIn = inches - feet * 12;
                        const label =
                          feet > 0
                            ? `${feet}′ ${remainIn > 0 ? remainIn.toFixed(2) + "″" : ""}`.trim()
                            : `${inches.toFixed(2)}″`;
                        return (
                          <li key={i} className="flex items-center gap-2">
                            <span className="opacity-40 w-5 text-right">
                              {i + 1}.
                            </span>
                            <span>{label}</span>
                            {tag && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                {tag}
                              </span>
                            )}
                          </li>
                        );
                      })}
                  </ul>
                </details>
              )}

              {(studOptimizer.missingStock.length > 0 ||
                pairedOptimizer.missingStock.length > 0) && (
                <p className="text-red-500 dark:text-red-400 font-medium">
                  ⚠{" "}
                  {studOptimizer.missingStock.length +
                    pairedOptimizer.missingStock.length}{" "}
                  cut
                  {studOptimizer.missingStock.length +
                    pairedOptimizer.missingStock.length !==
                  1
                    ? "s"
                    : ""}{" "}
                  could not be fulfilled — check that no single piece exceeds
                  16′ (192″).
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </Layout>
  );
}
