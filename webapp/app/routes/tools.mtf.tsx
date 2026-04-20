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
  const [lowerBridgingLength, setLowerBridgingLength] = useState(
    DEFAULT_MTF_PARAMS.lowerBridgingLength,
  );
  const [upperBridgingLength, setUpperBridgingLength] = useState(
    DEFAULT_MTF_PARAMS.upperBridgingLength,
  );

  // ── Takeoff state ─────────────────────────────────────────────────────────
  const [postCount, setPostCount] = useState(1);

  // ── Geometry (rebuilds only when dimensions change) ───────────────────────
  const params: MTFParams = useMemo(
    () => ({
      studLength,
      sillTenonLength,
      midTenonLength,
      topTenonLength,
      lowerBridgingLength,
      upperBridgingLength,
    }),
    [
      studLength,
      sillTenonLength,
      midTenonLength,
      topTenonLength,
      lowerBridgingLength,
      upperBridgingLength,
    ],
  );

  const geo = useMemo(() => buildMTFPostGeometry(params), [params]);

  // ── Cuts per post (2 boards per component — front + back lamination) ──────
  const cutPieces = useMemo(
    () => [
      { label: "Stud", length: studLength, count: 2 },
      { label: "Sill Tenon", length: sillTenonLength, count: 2 },
      { label: "Mid Tenon", length: midTenonLength, count: 2 },
      { label: "Top Tenon", length: topTenonLength, count: 2 },
      { label: "Lower Bridging", length: lowerBridgingLength, count: 2 },
      { label: "Upper Bridging", length: upperBridgingLength, count: 2 },
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

  // ── Optimizer results ─────────────────────────────────────────────────────
  const optimizer = useMemo(() => {
    const cuts = cutPieces.flatMap(({ length, count }) =>
      Array.from({ length: count * postCount }, () => ({
        size: length,
        unit: "in" as const,
      })),
    );

    const result = CutStockOptimizer({
      cuts,
      kerf: KERF,
      newStock: NEW_STOCK,
      onHandStock: [],
    });

    const stockCounts = countByKey(result.usedStock);
    const nonZeroOffCuts = result.offCuts.filter((o) => toInches(o) > 0);
    const totalOffCutIn = nonZeroOffCuts.reduce(
      (sum, m) => sum + toInches(m),
      0,
    );

    return { ...result, stockCounts, nonZeroOffCuts, totalOffCutIn };
  }, [cutPieces, postCount]);

  const midCenter = studLength / 2;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="scene1">
        <div className="simple-container p-4">
          <Breadcrumb>
            <Link to="/tools">All Tools</Link>
          </Breadcrumb>

          <h1 className="text-4xl font-bold mt-8">MTF</h1>
          <p className="mt-4 mb-8 text-lg">Calculate the MTF</p>

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
                {topTenonLength}″ vertical · inserts 8″ below stud top
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
                    <th className="text-right pb-2 font-medium opacity-60">
                      Total ({postCount} {postCount === 1 ? "post" : "posts"})
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cutPieces.map(({ label, length, count }) => (
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
                      <td className="py-2 text-right tabular-nums font-medium">
                        {count * postCount}
                      </td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-3 pr-6">Total pieces</td>
                    <td />
                    <td className="pt-3 pr-6 text-right tabular-nums">
                      {cutPieces.reduce((s, p) => s + p.count, 0)}
                    </td>
                    <td className="pt-3 text-right tabular-nums">
                      {cutPieces.reduce((s, p) => s + p.count, 0) * postCount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Material list */}
            <h3 className="text-xs font-semibold uppercase tracking-widest opacity-50 mb-3">
              Stock Required — 2×6 (⅛″ kerf)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {NEW_STOCK.map((s) => {
                const key = `${s.size}${s.unit}`;
                const count = optimizer.stockCounts[key] ?? 0;
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
                {optimizer.usedStock.length} board
                {optimizer.usedStock.length !== 1 ? "s" : ""} total · ~
                {optimizer.totalOffCutIn.toFixed(1)}″ combined off-cuts
              </p>

              {optimizer.nonZeroOffCuts.length > 0 && (
                <details className="mt-1 group">
                  <summary className="cursor-pointer select-none w-fit hover:opacity-80 transition-opacity list-none flex items-center gap-1.5">
                    <span className="text-xs transition-transform group-open:rotate-90 inline-block">
                      ▶
                    </span>
                    <span>
                      {optimizer.nonZeroOffCuts.length} off-cut
                      {optimizer.nonZeroOffCuts.length !== 1 ? "s" : ""}
                    </span>
                  </summary>
                  <ul className="mt-2 ml-4 space-y-0.5 tabular-nums font-mono text-xs">
                    {[...optimizer.nonZeroOffCuts]
                      .sort((a, b) => toInches(b) - toInches(a))
                      .map((offcut, i) => {
                        const inches = toInches(offcut);
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
                          </li>
                        );
                      })}
                  </ul>
                </details>
              )}

              {optimizer.missingStock.length > 0 && (
                <p className="text-red-500 dark:text-red-400 font-medium">
                  ⚠ {optimizer.missingStock.length} cut
                  {optimizer.missingStock.length !== 1 ? "s" : ""} could not be
                  fulfilled — check that no single piece exceeds 16′ (192″).
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
