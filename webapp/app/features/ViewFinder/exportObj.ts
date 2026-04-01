import type { PearGeo } from "./PearGeo";

/**
 * Converts a FrameGeometry into a Wavefront .obj file string.
 *
 * OBJ format notes:
 *   - All indices are 1-based.
 *   - Faces use the `v//vn` form (vertex + normal, no texture coordinates).
 *   - Because framesToGeometry duplicates vertices per face for flat normals,
 *     each vertex has exactly one normal — so vertex index === normal index
 *     for every face entry. This means the output is unambiguous and correct
 *     for any OBJ importer (Blender, Maya, MeshLab, etc.).
 *   - Coordinate system is right-handed, Y-up (matching the geometry output):
 *       X → along the path (feet)
 *       Y → up (feet)
 *       Z → lateral (feet)
 *   - Smoothing is disabled (`s off`) since normals are already flat per face.
 */
export function geometryToOBJ(geo: PearGeo, objectName = "frames"): string {
  if (geo.vertexCount === 0 || geo.triangleCount === 0) {
    return `# Nopal – empty geometry\no ${objectName}\n`;
  }

  const lines: string[] = [];

  // ── Header ───────────────────────────────────────────────────────────────
  lines.push("# Nopal – Wavefront OBJ export");
  lines.push(`# Vertices : ${geo.vertexCount}`);
  lines.push(`# Triangles: ${geo.triangleCount}`);
  lines.push(`# Units    : feet`);
  lines.push("");
  lines.push(`o ${objectName}`);
  lines.push("");

  // ── Vertex positions ─────────────────────────────────────────────────────
  for (let i = 0; i < geo.vertexCount; i++) {
    const o = i * 3;
    lines.push(
      `v ${geo.positions[o].toFixed(6)} ${geo.positions[o + 1].toFixed(
        6
      )} ${geo.positions[o + 2].toFixed(6)}`
    );
  }

  lines.push("");

  // ── Vertex normals ────────────────────────────────────────────────────────
  for (let i = 0; i < geo.vertexCount; i++) {
    const o = i * 3;
    lines.push(
      `vn ${geo.normals[o].toFixed(6)} ${geo.normals[o + 1].toFixed(
        6
      )} ${geo.normals[o + 2].toFixed(6)}`
    );
  }

  lines.push("");

  // Flat shading — no smoothing groups
  lines.push("s off");
  lines.push("");

  // ── Faces ────────────────────────────────────────────────────────────────
  // f v1//vn1 v2//vn2 v3//vn3  (1-based; vertex idx === normal idx)
  for (let i = 0; i < geo.triangleCount; i++) {
    const o = i * 3;
    const a = geo.indices[o] + 1;
    const b = geo.indices[o + 1] + 1;
    const c = geo.indices[o + 2] + 1;
    lines.push(`f ${a}//${a} ${b}//${b} ${c}//${c}`);
  }

  return lines.join("\n") + "\n";
}

// ── Browser download helpers ─────────────────────────────────────────────────

/**
 * Triggers a browser file-save dialog for the given OBJ string.
 */
export function triggerObjDownload(obj: string, filename = "frames.obj"): void {
  const blob = new Blob([obj], { type: "model/obj" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Copies the OBJ string to the system clipboard.
 */
export function copyObjToClipboard(obj: string): Promise<void> {
  return navigator.clipboard.writeText(obj);
}
