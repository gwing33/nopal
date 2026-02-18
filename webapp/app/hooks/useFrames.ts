import { useState, useMemo } from "react";

// ── WebGPU 3D Geometry Types ────────────────────────────────────────────────

export interface FrameGeometry {
  /** Flat Float32Array of vertex positions [x,y,z, x,y,z, ...] in feet */
  positions: Float32Array;
  /** Flat Float32Array of per-vertex normals [nx,ny,nz, ...] */
  normals: Float32Array;
  /** Triangle index buffer (3 indices per triangle) */
  indices: Uint32Array;
  /** Total number of vertices */
  vertexCount: number;
  /** Total number of triangles */
  triangleCount: number;
}

/**
 * Generates WebGPU-ready 3D geometry from a list of frames.
 *
 * Each frame is treated as a rectangular cross-section in the Y-Z plane,
 * positioned along the X axis according to cumulative `distanceToNext` values.
 * Adjacent frames are connected to form a watertight solid (prismatoid).
 *
 * Coordinate system (all output in feet, right-handed):
 *   X → along the path (accumulated distance)
 *   Y → up (frame height)
 *   Z → lateral (frame depth, centered on 0)
 *
 * Winding order is counter-clockwise when viewed from outside (standard for
 * front-face culling in WebGPU).
 */
export function framesToGeometry(frames: Frame[]): FrameGeometry {
  if (frames.length < 2) {
    return {
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      indices: new Uint32Array(0),
      vertexCount: 0,
      triangleCount: 0,
    };
  }

  // We duplicate vertices per-face so each face gets its own flat normal.
  // Per segment (pair of adjacent frames):
  //   4 side quads × 4 verts = 16 verts, 4 side quads × 2 tris = 8 tris
  // Plus 2 cap faces (front & back):
  //   1 quad × 4 verts each = 8 verts, 2 × 2 tris = 4 tris
  const segCount = frames.length - 1;
  const vertsPerSegment = 16; // 4 quads × 4 verts
  const trisPerSegment = 8; // 4 quads × 2 tris
  const capVerts = 8; // 2 caps × 4 verts
  const capTris = 4; // 2 caps × 2 tris

  const totalVerts = segCount * vertsPerSegment + capVerts;
  const totalTris = segCount * trisPerSegment + capTris;

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const indices = new Uint32Array(totalTris * 3);

  let vi = 0; // vertex index cursor
  let ii = 0; // index cursor

  // Helper: push a vertex (position + normal), return its index
  function pushVert(
    px: number,
    py: number,
    pz: number,
    nx: number,
    ny: number,
    nz: number
  ): number {
    const idx = vi;
    const off = vi * 3;
    positions[off] = px;
    positions[off + 1] = py;
    positions[off + 2] = pz;
    normals[off] = nx;
    normals[off + 1] = ny;
    normals[off + 2] = nz;
    vi++;
    return idx;
  }

  // Helper: push two CCW triangles for a quad (v0-v1-v2-v3)
  function pushQuad(a: number, b: number, c: number, d: number) {
    indices[ii++] = a;
    indices[ii++] = b;
    indices[ii++] = c;
    indices[ii++] = a;
    indices[ii++] = c;
    indices[ii++] = d;
  }

  // Convert frame dimensions to feet and compute X positions
  const inToFt = 1 / 12;
  const xPositions: number[] = [0];
  for (let i = 0; i < frames.length - 1; i++) {
    xPositions.push(xPositions[i] + frames[i].distanceToNext);
  }

  // Corner order per frame (in Y-Z plane):
  //   0: bottom-left  (y=0,        z=-depth/2)
  //   1: bottom-right  (y=0,        z=+depth/2)
  //   2: top-right     (y=height,   z=+depth/2)
  //   3: top-left      (y=height,   z=-depth/2)
  function frameCorners(f: Frame, x: number): [number, number, number][] {
    const h = f.height * inToFt;
    const halfD = (f.depth * inToFt) / 2;
    return [
      [x, 0, -halfD],
      [x, 0, halfD],
      [x, h, halfD],
      [x, h, -halfD],
    ];
  }

  // ── Front cap (first frame, normal pointing -X) ──
  {
    const c = frameCorners(frames[0], xPositions[0]);
    const nx = -1,
      ny = 0,
      nz = 0;
    const a = pushVert(c[0][0], c[0][1], c[0][2], nx, ny, nz);
    const b = pushVert(c[3][0], c[3][1], c[3][2], nx, ny, nz);
    const cc2 = pushVert(c[2][0], c[2][1], c[2][2], nx, ny, nz);
    const d = pushVert(c[1][0], c[1][1], c[1][2], nx, ny, nz);
    pushQuad(a, b, cc2, d);
  }

  // ── Segment side faces ──
  for (let i = 0; i < segCount; i++) {
    const cA = frameCorners(frames[i], xPositions[i]);
    const cB = frameCorners(frames[i + 1], xPositions[i + 1]);

    // Bottom face (normal -Y)
    {
      const n: [number, number, number] = [0, -1, 0];
      const a = pushVert(cA[0][0], cA[0][1], cA[0][2], ...n);
      const b = pushVert(cA[1][0], cA[1][1], cA[1][2], ...n);
      const c = pushVert(cB[1][0], cB[1][1], cB[1][2], ...n);
      const d = pushVert(cB[0][0], cB[0][1], cB[0][2], ...n);
      pushQuad(a, b, c, d);
    }

    // Right face (normal +Z)
    {
      const n: [number, number, number] = [0, 0, 1];
      const a = pushVert(cA[1][0], cA[1][1], cA[1][2], ...n);
      const b = pushVert(cA[2][0], cA[2][1], cA[2][2], ...n);
      const c = pushVert(cB[2][0], cB[2][1], cB[2][2], ...n);
      const d = pushVert(cB[1][0], cB[1][1], cB[1][2], ...n);
      pushQuad(a, b, c, d);
    }

    // Top face (normal +Y)
    {
      const n: [number, number, number] = [0, 1, 0];
      const a = pushVert(cA[2][0], cA[2][1], cA[2][2], ...n);
      const b = pushVert(cA[3][0], cA[3][1], cA[3][2], ...n);
      const c = pushVert(cB[3][0], cB[3][1], cB[3][2], ...n);
      const d = pushVert(cB[2][0], cB[2][1], cB[2][2], ...n);
      pushQuad(a, b, c, d);
    }

    // Left face (normal -Z)
    {
      const n: [number, number, number] = [0, 0, -1];
      const a = pushVert(cA[3][0], cA[3][1], cA[3][2], ...n);
      const b = pushVert(cA[0][0], cA[0][1], cA[0][2], ...n);
      const c = pushVert(cB[0][0], cB[0][1], cB[0][2], ...n);
      const d = pushVert(cB[3][0], cB[3][1], cB[3][2], ...n);
      pushQuad(a, b, c, d);
    }
  }

  // ── Back cap (last frame, normal pointing +X) ──
  {
    const last = frames.length - 1;
    const c = frameCorners(frames[last], xPositions[last]);
    const nx = 1,
      ny = 0,
      nz = 0;
    const a = pushVert(c[0][0], c[0][1], c[0][2], nx, ny, nz);
    const b = pushVert(c[1][0], c[1][1], c[1][2], nx, ny, nz);
    const cc2 = pushVert(c[2][0], c[2][1], c[2][2], nx, ny, nz);
    const d = pushVert(c[3][0], c[3][1], c[3][2], nx, ny, nz);
    pushQuad(a, b, cc2, d);
  }

  return {
    positions,
    normals,
    indices,
    vertexCount: totalVerts,
    triangleCount: totalTris,
  };
}

export interface Frame {
  id: number;
  height: number; // in inches
  depth: number; // in inches
  distanceToNext: number; // in feet
}

export interface SegmentVolume {
  from: number;
  to: number;
  volume: number;
}

export interface FormattedVolume {
  cubicFeet: number;
  cubicYards: number;
  cubicFeetStr: string;
  cubicYardsStr: string;
}

export interface FormattedWeight {
  pounds: string;
  tons: string;
}

export function formatVolume(cubicInches: number): FormattedVolume {
  const cubicFeet = cubicInches / 1728; // 12^3
  const cubicYards = cubicFeet / 27; // 3^3
  return {
    cubicFeet,
    cubicYards,
    cubicFeetStr: cubicFeet.toFixed(2),
    cubicYardsStr: cubicYards.toFixed(2),
  };
}

export function formatWeight(pounds: number): FormattedWeight {
  return {
    pounds: pounds.toFixed(0),
    tons: (pounds / 2000).toFixed(2),
  };
}

function calculateSegmentVolume(
  frame1: Frame,
  frame2: Frame,
  distance: number
): number {
  const area1 = frame1.height * frame1.depth;
  const area2 = frame2.height * frame2.depth;
  const avgArea = (area1 + area2) / 2;
  const distanceInches = distance * 12;
  return avgArea * distanceInches;
}

const DEFAULT_FRAMES: Frame[] = [
  { id: 1, height: 12, depth: 12, distanceToNext: 4 },
  { id: 2, height: 12, depth: 12, distanceToNext: 4 },
];

export function useFrames(initialFrames: Frame[] = DEFAULT_FRAMES) {
  const [frames, setFrames] = useState<Frame[]>(initialFrames);

  const addFrame = () => {
    const newId = Math.max(...frames.map((f) => f.id)) + 1;
    setFrames([
      ...frames,
      { id: newId, height: 12, depth: 12, distanceToNext: 4 },
    ]);
  };

  const removeFrame = (id: number) => {
    if (frames.length > 1) {
      setFrames(frames.filter((f) => f.id !== id));
    }
  };

  const updateFrame = (id: number, field: keyof Frame, value: number) => {
    setFrames(frames.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const { totalVolume, segmentVolumes } = useMemo(() => {
    if (frames.length < 2) {
      return { totalVolume: 0, segmentVolumes: [] as SegmentVolume[] };
    }

    const segments: SegmentVolume[] = [];
    let total = 0;

    for (let i = 0; i < frames.length - 1; i++) {
      const volume = calculateSegmentVolume(
        frames[i],
        frames[i + 1],
        frames[i].distanceToNext
      );
      segments.push({
        from: frames[i].id,
        to: frames[i + 1].id,
        volume,
      });
      total += volume;
    }

    return { totalVolume: total, segmentVolumes: segments };
  }, [frames]);

  return {
    frames,
    addFrame,
    removeFrame,
    updateFrame,
    totalVolume,
    segmentVolumes,
  };
}
