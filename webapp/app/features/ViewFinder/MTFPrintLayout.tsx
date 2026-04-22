import { PIECE_COLORS } from "./MTFColors";
import { MTFElevationDiagram } from "./MTFElevationDiagram";
import type { MTFParams } from "./MTFGeo";

// ── Types ─────────────────────────────────────────────────────────────────────

type Measurement = { size: number; unit: string };

type Board = {
  stock: Measurement;
  cuts: (Measurement & { label?: string })[];
  offCutMM: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInches(m: Measurement): number {
  const f: Record<string, number> = { in: 1, ft: 12, mm: 1/25.4, cm: 1/2.54, m: 39.3701 };
  return m.size * (f[m.unit] ?? 1);
}

function fmtIn(inches: number): string {
  if (inches % 12 === 0) return `${inches / 12}′ (${inches}″)`;
  const ft = Math.floor(inches / 12);
  const rem = inches - ft * 12;
  if (ft > 0 && rem > 0) return `${ft}′ ${rem}″`;
  if (ft > 0) return `${ft}′`;
  return `${inches}″`;
}

// ── Board Layout SVG ──────────────────────────────────────────────────────────

function BoardLayoutSVG({ boards, isPaired }: { boards: Board[]; isPaired: boolean }) {
  if (boards.length === 0) {
    return <p style={{ fontSize: 9, opacity: 0.5, margin: 0 }}>No boards.</p>;
  }

  const BAR_H  = 18;
  const GAP    = 5;
  const LPAD   = 60;   // left label area
  const RPAD   = 44;   // right (waste % + ×2 badge)
  const BAR_W  = 440;  // inner bar width
  const SVG_W  = LPAD + BAR_W + RPAD;
  const SVG_H  = boards.length * (BAR_H + GAP) + GAP;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      style={{ display: "block" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {boards.map((board, i) => {
        const stockIn  = toInches(board.stock);
        const offCutIn = board.offCutMM / 25.4;
        const y = GAP + i * (BAR_H + GAP);

        // Pre-compute cut segments
        let xCursor = LPAD;
        const segs = board.cuts.map((cut) => {
          const cutIn = toInches(cut as Measurement);
          const w = Math.max(0, (cutIn / stockIn) * BAR_W);
          const x = xCursor;
          xCursor += w;
          return { cut, w, x, cutIn, pct: (cutIn / stockIn) * 100 };
        });

        const offW = Math.max(0, (offCutIn / stockIn) * BAR_W);
        const wasteStr = ((offCutIn / stockIn) * 100).toFixed(1) + "%";

        return (
          <g key={i}>
            {/* Left label: index + stock size */}
            <text
              x={LPAD - 4} y={y + BAR_H * 0.72}
              textAnchor="end" fontSize={8} fill="#444" fontFamily="monospace"
            >
              #{i + 1} {board.stock.size}{board.stock.unit}
            </text>

            {/* Cut segments */}
            {segs.map(({ cut, w, x, pct }, ci) => (
              <g key={ci}>
                <rect
                  x={x} y={y} width={w} height={BAR_H}
                  fill={PIECE_COLORS[cut.label ?? ""] ?? "#94a3b8"}
                />
                {/* Separator */}
                {ci > 0 && (
                  <line x1={x} y1={y} x2={x} y2={y + BAR_H}
                    stroke="rgba(0,0,0,0.25)" strokeWidth={0.75} />
                )}
                {/* Label inside segment if wide enough */}
                {pct > 8 && (
                  <text
                    x={x + w / 2} y={y + BAR_H * 0.72}
                    textAnchor="middle" fontSize={7} fill="white"
                    fontFamily="system-ui, sans-serif" fontWeight="600"
                    style={{ pointerEvents: "none" }}
                  >
                    {cut.label}
                  </text>
                )}
              </g>
            ))}

            {/* Off-cut (grey) */}
            {offW > 0 && (
              <rect x={xCursor} y={y} width={offW} height={BAR_H} fill="#d1d5db" />
            )}

            {/* Right: ×2 badge + waste % */}
            <text
              x={LPAD + BAR_W + 3} y={y + BAR_H * 0.72}
              fontSize={8} fill="#888" fontFamily="monospace"
            >
              {isPaired ? "×2 " : ""}{wasteStr}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Spec Table ────────────────────────────────────────────────────────────────

function SpecTable({ params }: { params: MTFParams }) {
  const items = [
    { label: "Stud",           value: `2× 2×6 @ ${fmtIn(params.studLength)} — 1.5″ × 5.5″ actual` },
    { label: "Sill Tenon",     value: `${params.sillTenonLength}″ horizontal · at base (0″)` },
    { label: "Mid Tenon",      value: `${params.midTenonLength}″ horizontal · centred at ${fmtIn(params.studLength / 2)}` },
    { label: "Top Tenon",      value: `${params.topTenonLength}″ vertical · inserts ${params.topTenonOverlap}″ below stud top` },
    { label: "Lower Bridging", value: `${params.lowerBridgingLength}″ vertical` },
    { label: "Upper Bridging", value: `${params.upperBridgingLength}″ vertical` },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2pt 12pt" }}>
      {items.map(({ label, value }) => (
        <div key={label}>
          <span style={{ fontWeight: 700, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {label}:{" "}
          </span>
          <span style={{ fontSize: 8.5, fontFamily: "monospace" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4pt 12pt" }}>
      {Object.entries(PIECE_COLORS).map(([label, color]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, background: color, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 8 }}>{label}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 10, height: 10, background: "#d1d5db", borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 8 }}>Off-cut</span>
      </div>
    </div>
  );
}

// ── Section heading helper ────────────────────────────────────────────────────

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: "#1e3a5f",
      margin: "0 0 4pt 0", borderBottom: "0.5pt solid #1e3a5f", paddingBottom: "2pt",
    }}>
      {children}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface MTFPrintLayoutProps {
  params: MTFParams;
  postCount: number;
  cutPieces: Array<{ label: string; length: number; count: number; isPaired: boolean }>;
  studBoards:  Board[];
  pairedBoards: Board[];
  combinedStockCounts: Record<string, number>;
  availableStock: Array<{ size: number; unit: string }>;
  totalPhysicalBoards: number;
  totalOffCutIn: number;
}

// ── Main component ────────────────────────────────────────────────────────────

export function MTFPrintLayout({
  params,
  postCount,
  cutPieces,
  studBoards,
  pairedBoards,
  combinedStockCounts,
  availableStock,
  totalPhysicalBoards,
  totalOffCutIn,
}: MTFPrintLayoutProps) {
  const NAVY = "#1e3a5f";

  // Inline style constants
  const dividerLine = { borderTop: `0.75pt solid ${NAVY}` } as const;
  const sectionPad  = { padding: "0.1in 0.18in" } as const;

  return (
    <div
      className="hidden print:block"
      style={{
        width: "11in",
        minHeight: "17in",
        background: "white",
        padding: "0.25in",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        color: NAVY,
        boxSizing: "border-box",
        fontSize: 10,
      }}
    >
      {/* ── Outer border frame ─────────────────────────────────────────────── */}
      <div style={{
        border: `2.5pt solid ${NAVY}`,
        minHeight: "calc(17in - 0.5in)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Title block ──────────────────────────────────────────────────── */}
        <div style={{
          background: NAVY,
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.12in 0.18in",
          gap: "0.2in",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "0.06em" }}>
              MTF POST — CONSTRUCTION LAYOUT
            </div>
            <div style={{ fontSize: 9, marginTop: 2, opacity: 0.75, fontFamily: "monospace" }}>
              Modified Timber Frame · 2×6 lumber throughout
            </div>
          </div>
          <div style={{ textAlign: "right", fontFamily: "monospace", fontSize: 10 }}>
            <div>STUD: {fmtIn(params.studLength)}</div>
            <div>POSTS: {postCount}</div>
            <div style={{ fontSize: 8, opacity: 0.7, marginTop: 2 }}>SCALE: N.T.S.</div>
          </div>
        </div>

        {/* ── Main body ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, borderTop: `0.75pt solid ${NAVY}` }}>

          {/* Left column — elevation diagrams */}
          <div style={{
            width: "42%",
            borderRight: `0.75pt solid ${NAVY}`,
            display: "flex",
            flexDirection: "column",
            ...sectionPad,
          }}>
            <SectionHead>Elevation Views</SectionHead>
            <MTFElevationDiagram params={params} diagramHeight={340} />
          </div>

          {/* Right column — board cut layout */}
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            ...sectionPad,
          }}>
            <SectionHead>
              Board Cut Layout — {postCount} Post{postCount !== 1 ? "s" : ""} · ⅛″ Kerf
            </SectionHead>

            {/* Pairing note */}
            <p style={{ fontSize: 8, margin: "0 0 6pt 0", opacity: 0.7 }}>
              Rows marked ×2 represent two boards glued face-to-face; one cut layout serves both.
            </p>

            {/* Color legend for bars */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2pt 10pt", marginBottom: "6pt" }}>
              {Object.entries(PIECE_COLORS).map(([label, color]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 8, height: 8, background: color, borderRadius: 1.5, flexShrink: 0 }} />
                  <span style={{ fontSize: 7 }}>{label}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 8, height: 8, background: "#d1d5db", borderRadius: 1.5, flexShrink: 0 }} />
                <span style={{ fontSize: 7 }}>Off-cut</span>
              </div>
            </div>

            {/* Stud boards */}
            <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "2pt 0", opacity: 0.7 }}>
              Stud Boards (individual)
            </p>
            <BoardLayoutSVG boards={studBoards} isPaired={false} />

            {/* Paired boards */}
            <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "8pt 0 2pt 0", opacity: 0.7 }}>
              Tenon &amp; Bridging (glued pairs)
            </p>
            <BoardLayoutSVG boards={pairedBoards} isPaired={true} />

            {/* Material summary */}
            <div style={{ marginTop: "auto", paddingTop: "0.08in", ...dividerLine }}>
              <p style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", margin: "4pt 0 4pt 0" }}>
                Stock Required — 2×6
              </p>
              <div style={{ display: "flex", gap: "0.12in", flexWrap: "wrap" }}>
                {availableStock.map((s) => {
                  const key = `${s.size}${s.unit}`;
                  const cnt = combinedStockCounts[key] ?? 0;
                  return (
                    <div key={key} style={{
                      textAlign: "center",
                      padding: "3pt 8pt",
                      border: `0.75pt solid ${cnt > 0 ? "#10b981" : "#ccc"}`,
                      borderRadius: 3,
                      opacity: cnt > 0 ? 1 : 0.35,
                      minWidth: "0.5in",
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", lineHeight: 1 }}>{cnt}</div>
                      <div style={{ fontSize: 7, marginTop: 1 }}>× {s.size}′ 2×6</div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 8, margin: "4pt 0 0 0", opacity: 0.65, fontFamily: "monospace" }}>
                {totalPhysicalBoards} board{totalPhysicalBoards !== 1 ? "s" : ""} total
                ({studBoards.length} stud{studBoards.length !== 1 ? "s" : ""} + {pairedBoards.length * 2} paired) ·
                ~{totalOffCutIn.toFixed(1)}″ combined off-cuts
              </p>
            </div>

          </div>
        </div>{/* end main body */}

        {/* ── Cut list table ────────────────────────────────────────────────── */}
        <div style={{ ...dividerLine, ...sectionPad }}>
          <SectionHead>Cuts Per Post</SectionHead>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 8.5 }}>
            <thead>
              <tr style={{ borderBottom: `0.75pt solid ${NAVY}` }}>
                {["Piece", "Length", "Qty / post", `Total (${postCount} post${postCount !== 1 ? "s" : ""})`, "Method"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "2pt 6pt 2pt 0", fontWeight: 700, fontSize: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cutPieces.map(({ label, length, count, isPaired }) => (
                <tr key={label} style={{ borderBottom: "0.5pt solid #ddd" }}>
                  <td style={{ padding: "2pt 6pt 2pt 0" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 8, height: 8, background: PIECE_COLORS[label] ?? "#94a3b8", borderRadius: 1.5, display: "inline-block", flexShrink: 0 }} />
                      {label}
                    </span>
                  </td>
                  <td style={{ padding: "2pt 6pt 2pt 0", fontFamily: "monospace" }}>{length}″</td>
                  <td style={{ padding: "2pt 6pt 2pt 0", fontFamily: "monospace" }}>{count}</td>
                  <td style={{ padding: "2pt 6pt 2pt 0", fontFamily: "monospace", fontWeight: 700 }}>{count * postCount}</td>
                  <td style={{ padding: "2pt 0 2pt 0", fontSize: 7.5, opacity: 0.7 }}>{isPaired ? "glued pair" : "individual"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Post specification ────────────────────────────────────────────── */}
        <div style={{ ...dividerLine, ...sectionPad }}>
          <SectionHead>Post Specification</SectionHead>
          <SpecTable params={params} />
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <div style={{
          ...dividerLine,
          padding: "0.06in 0.18in",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#f0f4f8",
          fontSize: 8,
          fontFamily: "monospace",
        }}>
          <span>Nopal Tools · tools.nopal.app/tools/mtf</span>
          <span>SCALE: N.T.S. · SHEET 1 OF 1</span>
        </div>

      </div>{/* end border frame */}
    </div>
  );
}
