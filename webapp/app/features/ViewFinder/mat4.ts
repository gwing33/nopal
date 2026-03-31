// ── Minimal mat4 math (column-major, WebGPU clip-space Z ∈ [0,1]) ──────────

export type Mat4 = Float32Array; // always length 16

export function mat4Identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

export function mat4Perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number
): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const rangeInv = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = far * rangeInv;
  m[11] = -1;
  m[14] = near * far * rangeInv;
  return m;
}

export function mat4LookAt(
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number]
): Mat4 {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  const m = new Float32Array(16);
  // column 0
  m[0] = xx;
  m[1] = yx;
  m[2] = zx;
  m[3] = 0;
  // column 1
  m[4] = xy;
  m[5] = yy;
  m[6] = zy;
  m[7] = 0;
  // column 2
  m[8] = xz;
  m[9] = yz;
  m[10] = zz;
  m[11] = 0;
  // column 3
  m[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  m[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  m[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  m[15] = 1;
  return m;
}

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      out[col * 4 + row] =
        a[row] * b[col * 4] +
        a[4 + row] * b[col * 4 + 1] +
        a[8 + row] * b[col * 4 + 2] +
        a[12 + row] * b[col * 4 + 3];
    }
  }
  return out;
}

// ── Project a world-space point through an MVP matrix ───────────────────────

export function projectPoint(
  mvp: Mat4,
  x: number,
  y: number,
  z: number
): { clipX: number; clipY: number; clipZ: number; clipW: number } {
  // Column-major mat4 × vec4(x, y, z, 1)
  return {
    clipX: mvp[0] * x + mvp[4] * y + mvp[8] * z + mvp[12],
    clipY: mvp[1] * x + mvp[5] * y + mvp[9] * z + mvp[13],
    clipZ: mvp[2] * x + mvp[6] * y + mvp[10] * z + mvp[14],
    clipW: mvp[3] * x + mvp[7] * y + mvp[11] * z + mvp[15],
  };
}
