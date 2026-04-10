type Measurement = {
  size: number;
  unit: "in" | "ft" | "mm" | "cm" | "m";
};

type Options = {
  cuts: Measurement[];
  kerf: Measurement;
  newStock: Measurement[];
  onHandStock: Measurement[];
};

type Result = {
  missingStock: Measurement[];
  remainingStock: Measurement[];
  usedStock: Measurement[];
  offCuts: Measurement[];
};

/**
 * A bin represents one physical stock piece that has been opened for cutting.
 * As cuts are assigned to it, `remainingMM` shrinks by (cutSize + kerf) per cut.
 */
type Bin = {
  stock: Measurement;
  cuts: Measurement[];
  remainingMM: number;
};

function CutStockOptimizer({
  cuts,
  kerf,
  newStock,
  onHandStock,
}: Options): Result {
  // ── Unit helpers ─────────────────────────────────────────────────────────────

  const MM_PER_UNIT: Record<Measurement["unit"], number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    in: 25.4,
    ft: 304.8,
  };

  const toMM = (m: Measurement): number => m.size * MM_PER_UNIT[m.unit];

  const fromMM = (mm: number, unit: Measurement["unit"]): Measurement => ({
    size: mm / MM_PER_UNIT[unit],
    unit,
  });

  // ── Setup ─────────────────────────────────────────────────────────────────────

  const kerfMM = toMM(kerf);

  /**
   * Best Fit Decreasing (BFD):
   * Process cuts from longest to shortest so the hardest-to-place pieces are
   * handled first, leaving flexible gaps for shorter cuts.
   */
  const sortedCuts = [...cuts].sort((a, b) => toMM(b) - toMM(a));

  // On-hand stock is finite — we remove pieces as they are consumed.
  const availableOnHand = [...onHandStock];

  // New stock is infinite per length option; sort smallest → largest so we
  // always pick the most material-efficient length when opening a new piece.
  const sortedNewStock = [...newStock].sort((a, b) => toMM(a) - toMM(b));

  const bins: Bin[] = [];
  const missingStock: Measurement[] = [];

  // ── Main loop ─────────────────────────────────────────────────────────────────

  for (const cut of sortedCuts) {
    const cutMM = toMM(cut);

    /**
     * Each cut consumes its own length PLUS one kerf — the material the blade
     * removes making that cross-cut.
     */
    const spaceNeeded = cutMM + kerfMM;

    // 1. Best Fit: find the open bin with the least remaining space that still
    //    accommodates this cut. Minimises off-cut waste.
    let bestBin: Bin | null = null;
    let bestRemainingAfter = Infinity;

    for (const bin of bins) {
      if (bin.remainingMM >= spaceNeeded) {
        const remainingAfter = bin.remainingMM - spaceNeeded;
        if (remainingAfter < bestRemainingAfter) {
          bestBin = bin;
          bestRemainingAfter = remainingAfter;
        }
      }
    }

    if (bestBin !== null) {
      bestBin.cuts.push(cut);
      bestBin.remainingMM -= spaceNeeded;
      continue;
    }

    // 2. No open bin fits — try to open a new one from on-hand stock first.
    //    Pick the smallest on-hand piece that can still accommodate the cut so
    //    larger pieces are preserved for longer cuts still to be placed.
    let bestOnHandIdx = -1;
    let bestOnHandMM = Infinity;

    for (let i = 0; i < availableOnHand.length; i++) {
      const stockMM = toMM(availableOnHand[i]);
      if (stockMM >= spaceNeeded && stockMM < bestOnHandMM) {
        bestOnHandIdx = i;
        bestOnHandMM = stockMM;
      }
    }

    if (bestOnHandIdx >= 0) {
      const [stock] = availableOnHand.splice(bestOnHandIdx, 1);
      bins.push({
        stock,
        cuts: [cut],
        remainingMM: toMM(stock) - spaceNeeded,
      });
      continue;
    }

    // 3. No on-hand stock fits — fall back to new stock (infinite supply).
    //    Again pick the smallest available length that fits.
    const newPiece = sortedNewStock.find((s) => toMM(s) >= spaceNeeded);

    if (newPiece !== undefined) {
      bins.push({
        stock: newPiece,
        cuts: [cut],
        remainingMM: toMM(newPiece) - spaceNeeded,
      });
      continue;
    }

    // 4. No stock option — anywhere — can fulfil this cut.
    missingStock.push(cut);
  }

  // ── Compile results ───────────────────────────────────────────────────────────

  return {
    /** Cuts that could not be fulfilled by any available stock. */
    missingStock,

    /** On-hand pieces that were never opened — still available for future use. */
    remainingStock: availableOnHand,

    /** Stock pieces that were opened (both on-hand and new stock). */
    usedStock: bins.map((b) => b.stock),

    /**
     * Leftover material from each opened stock piece after all assigned cuts.
     * Expressed in the same unit as the originating stock piece for readability.
     * Bins with zero remainder are perfect fits and produce no off-cut entry.
     */
    offCuts: bins
      .filter((b) => b.remainingMM > 0)
      .map((b) => fromMM(b.remainingMM, b.stock.unit)),
  };
}

export default CutStockOptimizer;
