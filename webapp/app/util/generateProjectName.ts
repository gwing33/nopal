/**
 * Generates a random two-word project codename drawn from prickly pear cactus
 * vocabulary — fitting for an app called Nopal.
 *
 * Format: [Adjective] [Noun]
 */

// ── Word lists ────────────────────────────────────────────────────────────────

/**
 * Colours, textures, and qualities drawn from the prickly pear world:
 * the waxy bloom on a pad, the lurid dye made from cochineal scale insects,
 * the dusty greens and ochres of the desert.
 */
const ADJECTIVES: string[] = [
  // colours from the fruit (tuna) and flower
  "Scarlet",
  "Crimson",
  "Magenta",
  "Carmine",
  "Vermillion",
  "Coral",
  "Amber",
  "Golden",
  "Russet",
  "Ochre",
  "Sienna",
  "Tawny",
  // colours from the pad (cladode) and landscape
  "Jade",
  "Sage",
  "Olive",
  "Verde",
  "Azure",
  "Violet",
  "Dusty",
  // tactile / botanical qualities
  "Spiny",
  "Thorny",
  "Prickly",
  "Waxy",
  "Hardy",
  "Arid",
  "Wild",
  "Ancient",
  "Sunlit",
  "Desert",
];

/**
 * Nouns covering cactus anatomy, ecology, and desert geography — every term
 * has a direct connection to the prickly pear / nopal world.
 */
const NOUNS: string[] = [
  // ── cactus anatomy ──
  /** the flattened stem segment */
  "Pad",
  /** wider, paddle-shaped cladode variety */
  "Paddle",
  /** small raised cushion bearing spines */
  "Areole",
  /** hair-like, barbed micro-spine */
  "Glochid",
  /** stiff, primary spine */
  "Spine",
  /** segmented stem; same as pad */
  "Cladode",
  /** vertical ridge running down a pad */
  "Rib",
  /** apex growth point */
  "Crown",
  /** collective cluster of pads */
  "Cluster",
  /** multi-trunk natural stand */
  "Stand",
  /** shallow, wide-spreading root system */
  "Root",
  // ── fruit & products ──
  /** the prickly pear fruit (Spanish/Náhuatl) */
  "Tuna",
  /** the sour, xeric fruit variety */
  "Xoconostle",
  /** red dye insect that lives on nopal */
  "Cochineal",
  /** the cactus pad used as vegetable (Spanish) */
  "Nopal",
  // ── growth & cultivation ──
  /** the showy flower */
  "Bloom",
  /** grafting a cultivar onto rootstock */
  "Graft",
  /** small grove of nopal */
  "Grove",
  // ── desert landscape ──
  /** flat-topped hill */
  "Mesa",
  /** dry desert watercourse */
  "Arroyo",
  /** alluvial slope at mountain base */
  "Bajada",
  /** flat open plain */
  "Llano",
  /** dense scrub habitat */
  "Chaparral",
  /** carved rock feature */
  "Canyon",
  /** high flat land */
  "Plateau",
  /** narrow elevated landform */
  "Ridge",
  /** small valley / dry creek */
  "Draw",
];

// ── Generator ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random project codename such as "Scarlet Areole" or "Jade Mesa".
 *
 * @example
 * generateProjectName() // => "Dusty Bajada"
 * generateProjectName() // => "Crimson Glochid"
 */
export function generateProjectName(): string {
  // Prevent awkward repetition like "Thorny Spine" sounding odd — retry once
  // if the adjective and noun share the same root word.
  let adjective = pick(ADJECTIVES);
  let noun = pick(NOUNS);

  const adj = adjective.toLowerCase();
  const n = noun.toLowerCase();
  if (adj === n || adj.startsWith(n) || n.startsWith(adj)) {
    adjective = pick(ADJECTIVES);
    noun = pick(NOUNS);
  }

  return `${adjective} ${noun}`;
}
