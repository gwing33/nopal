// ── WebGPU 3D Geometry Types ────────────────────────────────────────────────

export interface PearGeo {
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
