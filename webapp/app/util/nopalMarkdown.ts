/**
 * nopalMarkdown.ts
 *
 * Shared parsing and display utilities for the Nopal markdown format.
 * Used by both MdxEditorClient (live preview) and the daily-log route
 * (past-entry display) so both surfaces render identically.
 *
 * Nopal document format
 * ─────────────────────
 * [user content — paragraphs of prose + optional [nopal-image][N] tokens]
 *
 * # Nopal Markdown
 * Files
 * [1] https://cdn.example.com/photo.jpg
 * [2] Uploading 1 of 2…
 *
 * The file registry is stripped from the rendered output; placement tokens
 * are resolved to real markdown image / link syntax.
 */

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;
const NOPAL_MARKER = "\n\n# Nopal Markdown\nFiles";
const FILE_LINE_RE = /^\[(\d+)\]\s+(.+)$/;
/** Matches a whole paragraph that is purely a placement token (new or legacy format). */
const PLACEMENT_RE = /^\[nopal-image\]\[(\d+)\]$|^\[(\d+)\]$/;

// ── Types ────────────────────────────────────────────────────────────────────

export interface NopalFileEntry {
  index: number;
  url: string | null;
  name: string;
  isImage: boolean;
}

export interface NopalImagePlacement {
  fileIndex: number;
  afterParagraphIndex: number;
}

// ── Parsing ──────────────────────────────────────────────────────────────────

export function parseNopalDocument(raw: string): {
  userContent: string;
  files: NopalFileEntry[];
} {
  const idx = raw.indexOf(NOPAL_MARKER);
  if (idx === -1) return { userContent: raw, files: [] };

  const userContent = raw.slice(0, idx);
  const registrySection = raw.slice(idx + NOPAL_MARKER.length);
  const files: NopalFileEntry[] = [];

  for (const line of registrySection.split("\n")) {
    const m = line.match(FILE_LINE_RE);
    if (!m) continue;
    const index = parseInt(m[1]);
    const value = m[2].trim();
    const isUrl = value.startsWith("http");
    files.push({
      index,
      url: isUrl ? value : null,
      name: value,
      isImage: isUrl ? IMAGE_EXT.test(value) : false,
    });
  }

  return { userContent, files };
}

export function parseNopalUserContent(content: string): {
  editorText: string;
  placements: NopalImagePlacement[];
} {
  const paras = content.split("\n\n");
  const clean: string[] = [];
  const placements: NopalImagePlacement[] = [];

  for (const para of paras) {
    const m = para.trim().match(PLACEMENT_RE);
    if (m) {
      placements.push({
        fileIndex: parseInt(m[1] ?? m[2]),
        afterParagraphIndex: clean.length,
      });
    } else {
      clean.push(para);
    }
  }

  return { editorText: clean.join("\n\n"), placements };
}

// ── Display rendering ─────────────────────────────────────────────────────────

/**
 * Builds a display-ready markdown string from pre-parsed editor state.
 * Placement tokens are replaced with real `![name](url)` or `[name](url)` refs.
 * Used directly by MdxEditorClient which already has live parsed state.
 */
export function buildDisplayMarkdown(
  editorText: string,
  placements: NopalImagePlacement[],
  files: NopalFileEntry[],
): string {
  const paras = editorText.split("\n\n").filter((p) => p.trim() !== "");
  const result = [...paras];

  // Insert from the end so earlier indices don't shift
  const sorted = [...placements].sort(
    (a, b) => b.afterParagraphIndex - a.afterParagraphIndex,
  );
  for (const { fileIndex, afterParagraphIndex } of sorted) {
    const file = files.find((f) => f.index === fileIndex);
    if (!file?.url) continue;
    const mdRef = file.isImage
      ? `![${file.name}](${file.url})`
      : `[${file.name}](${file.url})`;
    result.splice(Math.min(afterParagraphIndex, result.length), 0, mdRef);
  }

  return result.join("\n\n");
}

/**
 * Fully resolves a raw stored Nopal markdown string into display-ready markdown:
 * strips the `# Nopal Markdown` registry section and replaces all
 * `[nopal-image][N]` placement tokens with real image / file link syntax.
 *
 * Use this wherever you display saved content without an interactive editor
 * (e.g. past log entries, read-only views).
 */
export function resolveNopalMarkdown(raw: string): string {
  const { userContent, files } = parseNopalDocument(raw);
  const { editorText, placements } = parseNopalUserContent(userContent);
  return buildDisplayMarkdown(editorText, placements, files);
}
