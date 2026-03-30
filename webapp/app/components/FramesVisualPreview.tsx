import { useRef, useEffect, useState, useCallback } from "react";
import type { Frame } from "../hooks/useFrames";
import { framesToGeometry } from "../hooks/useFrames";

// Cast typed arrays to satisfy @webgpu/types expecting ArrayBuffer (not ArrayBufferLike)
function gpuBuf(data: Float32Array | Uint32Array): BufferSource {
  return data as unknown as BufferSource;
}

// ── Minimal mat4 math (column-major, WebGPU clip-space Z ∈ [0,1]) ──────────

type Mat4 = Float32Array; // always length 16

function mat4Identity(): Mat4 {
  const m = new Float32Array(16);
  m[0] = 1;
  m[5] = 1;
  m[10] = 1;
  m[15] = 1;
  return m;
}

function mat4Perspective(
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

function mat4LookAt(
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

function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
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

// ── WGSL Shaders ────────────────────────────────────────────────────────────

const SHADER_SOURCE = /* wgsl */ `
struct Uniforms {
  mvp      : mat4x4<f32>,
  eyePos   : vec4<f32>,
  viewport : vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VSIn {
  @location(0) position : vec3<f32>,
  @location(1) normal   : vec3<f32>,
};
struct VSOut {
  @builtin(position) clipPos : vec4<f32>,
  @location(0) normal : vec3<f32>,
};

@vertex fn vs_main(input : VSIn) -> VSOut {
  var out : VSOut;
  out.clipPos = uniforms.mvp * vec4<f32>(input.position, 1.0);
  out.normal  = input.normal;
  return out;
}

@fragment fn fs_main(input : VSOut) -> @location(0) vec4<f32> {
  let lightDir = normalize(vec3<f32>(0.4, 0.9, 0.7));
  let n        = normalize(input.normal);
  let ndotl    = max(dot(n, lightDir), 0.0);
  let ambient  = 0.5;
  let diffuse  = ndotl * 0.32;
  let base     = vec3<f32>(0.36, 0.62, 0.42);
  return vec4<f32>(base * (ambient + diffuse), 1.0);
}

// ── Wireframe (drawn as instanced screen-space quads) ──

struct WireVSOut {
  @builtin(position) clipPos : vec4<f32>,
  @location(0) facing : f32,
};

@vertex fn vs_wire(
  @builtin(vertex_index) vid : u32,
  @location(0) posA      : vec3<f32>,
  @location(1) posB      : vec3<f32>,
  @location(2) edgeNormal : vec3<f32>,
) -> WireVSOut {
  // Determine quad corner from vertex index (6 verts = 2 triangles per instance)
  let ci = vid % 6u;
  var side : f32 = -1.0;
  var endT : f32 = 0.0;
  if (ci == 1u || ci == 3u || ci == 4u) { side = 1.0; }
  if (ci == 2u || ci == 4u || ci == 5u) { endT = 1.0; }

  // Transform both endpoints to clip space
  let clipA = uniforms.mvp * vec4<f32>(posA, 1.0);
  let clipB = uniforms.mvp * vec4<f32>(posB, 1.0);

  // Screen-space positions (in pixels)
  let screenA = (clipA.xy / clipA.w) * uniforms.viewport.xy * 0.5;
  let screenB = (clipB.xy / clipB.w) * uniforms.viewport.xy * 0.5;

  // Direction and perpendicular in screen space
  let lineDir = screenB - screenA;
  let lineLen = length(lineDir);
  var perp = vec2<f32>(0.0, 1.0);
  if (lineLen > 0.001) {
    let dir = lineDir / lineLen;
    perp = vec2<f32>(-dir.y, dir.x);
  }

  // Compute facing factor from averaged edge normal
  let midPos = (posA + posB) * 0.5;
  let viewDir = normalize(uniforms.eyePos.xyz - midPos);
  let n = normalize(edgeNormal);
  let facing = dot(n, viewDir);

  // Width in pixels: thicker for front-facing, thinner for back-facing
  let t = smoothstep(0.15, 0.55, facing);
  let widthPx = mix(2, 1, t);

  // Pick the interpolated clip position for this vertex
  let clipP = mix(clipA, clipB, endT);

  // Offset in screen-space pixels, then convert back to clip space
  let offsetPx = perp * side * widthPx * 0.5;
  let ndcOffset = offsetPx * 2.0 / uniforms.viewport.xy;

  var out : WireVSOut;
  out.clipPos = clipP;
  out.clipPos.x = out.clipPos.x + ndcOffset.x * clipP.w;
  out.clipPos.y = out.clipPos.y + ndcOffset.y * clipP.w;
  // Slight depth bias so edges draw on top of faces
  out.clipPos.z = out.clipPos.z - 0.0005;
  out.facing = facing;
  return out;
}

@fragment fn fs_wire(input : WireVSOut) -> @location(0) vec4<f32> {
  let t = smoothstep(0.15, 0.55, input.facing);
  let color = vec3<f32>(0.63, 0.89, 0.68); // extra light Green
  // let color = vec3<f32>(0.89, 0.83, 0.77);
  // let color = vec3<f32>(1, 0.97, 0.94), vec3<f32>(0.89, 0.83, 0.77), t);
  return vec4<f32>(color, 1.0);
}
`;

// ── Grid Shader ─────────────────────────────────────────────────────────────

const GRID_SHADER_SOURCE = /* wgsl */ `
struct Uniforms {
  mvp      : mat4x4<f32>,
  eyePos   : vec4<f32>,
  viewport : vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VSIn {
  @location(0) position : vec3<f32>,
};
struct VSOut {
  @builtin(position) clipPos : vec4<f32>,
};

@vertex fn vs_grid(input : VSIn) -> VSOut {
  var out : VSOut;
  out.clipPos = uniforms.mvp * vec4<f32>(input.position, 1.0);
  return out;
}

@fragment fn fs_grid() -> @location(0) vec4<f32> {
  return vec4<f32>(0.78, 0.78, 0.78, 1.0);
}
`;

// ── WebGPU GPU state held in a ref ──────────────────────────────────────────

interface GpuState {
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;
  pipeline: GPURenderPipeline;
  wirePipeline: GPURenderPipeline;
  gridPipeline: GPURenderPipeline;
  uniformBuffer: GPUBuffer;
  uniformBindGroup: GPUBindGroup;
  depthTexture: GPUTexture | null;
  depthTextureView: GPUTextureView | null;
  msaaTexture: GPUTexture | null;
  msaaTextureView: GPUTextureView | null;
  positionBuffer: GPUBuffer | null;
  normalBuffer: GPUBuffer | null;
  indexBuffer: GPUBuffer | null;
  wireBuffer: GPUBuffer | null;
  wireVertCount: number;
  gridBuffer: GPUBuffer | null;
  gridVertCount: number;
  indexCount: number;
  canvasWidth: number;
  canvasHeight: number;
}

// ── Helper: generate wireframe line-list vertices from triangles ────────────

function buildWireframeBuffer(
  positions: Float32Array,
  indices: Uint32Array
): Float32Array {
  // Build a map from each edge to the triangle indices that share it
  const edgeTriMap = new Map<string, number[]>();
  for (let i = 0; i < indices.length; i += 3) {
    const triIdx = i / 3;
    const tri = [indices[i], indices[i + 1], indices[i + 2]];
    for (let e = 0; e < 3; e++) {
      const a = tri[e];
      const b = tri[(e + 1) % 3];
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      let list = edgeTriMap.get(key);
      if (!list) {
        list = [];
        edgeTriMap.set(key, list);
      }
      list.push(triIdx);
    }
  }

  // Helper: compute triangle normal (unnormalized)
  function triNormal(triIdx: number): [number, number, number] {
    const i0 = indices[triIdx * 3];
    const i1 = indices[triIdx * 3 + 1];
    const i2 = indices[triIdx * 3 + 2];
    const ax = positions[i1 * 3] - positions[i0 * 3];
    const ay = positions[i1 * 3 + 1] - positions[i0 * 3 + 1];
    const az = positions[i1 * 3 + 2] - positions[i0 * 3 + 2];
    const bx = positions[i2 * 3] - positions[i0 * 3];
    const by = positions[i2 * 3 + 1] - positions[i0 * 3 + 1];
    const bz = positions[i2 * 3 + 2] - positions[i0 * 3 + 2];
    return [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx];
  }

  // Collect edges (with averaged normals), skipping internal diagonals of coplanar quad faces
  const edgeList: {
    a: number;
    b: number;
    nx: number;
    ny: number;
    nz: number;
  }[] = [];
  for (const [key, tris] of edgeTriMap) {
    // Compute average normal from adjacent triangles
    let nx = 0,
      ny = 0,
      nz = 0;
    for (const t of tris) {
      const n = triNormal(t);
      nx += n[0];
      ny += n[1];
      nz += n[2];
    }
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      nx /= len;
      ny /= len;
      nz /= len;
    }

    if (tris.length === 2) {
      // Shared edge — check if the two triangles are coplanar
      const n1 = triNormal(tris[0]);
      const n2 = triNormal(tris[1]);
      const dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2];
      const len1 = Math.sqrt(n1[0] * n1[0] + n1[1] * n1[1] + n1[2] * n1[2]);
      const len2 = Math.sqrt(n2[0] * n2[0] + n2[1] * n2[1] + n2[2] * n2[2]);
      if (len1 > 0 && len2 > 0 && dot / (len1 * len2) > 0.999) {
        continue; // coplanar shared edge = quad diagonal, skip
      }
    }
    const parts = key.split("_");
    const a = parseInt(parts[0], 10);
    const b = parseInt(parts[1], 10);
    edgeList.push({ a, b, nx, ny, nz });
  }

  // Per-edge instance data: posA (vec3) + posB (vec3) + normal (vec3) = 9 floats
  const verts = new Float32Array(edgeList.length * 9);
  for (let i = 0; i < edgeList.length; i++) {
    const { a, b, nx, ny, nz } = edgeList[i];
    const off = i * 9;
    // Endpoint A
    verts[off] = positions[a * 3];
    verts[off + 1] = positions[a * 3 + 1];
    verts[off + 2] = positions[a * 3 + 2];
    // Endpoint B
    verts[off + 3] = positions[b * 3];
    verts[off + 4] = positions[b * 3 + 1];
    verts[off + 5] = positions[b * 3 + 2];
    // Edge normal
    verts[off + 6] = nx;
    verts[off + 7] = ny;
    verts[off + 8] = nz;
  }
  return verts;
}

// ── Helper: build grid lines on the ground plane (Y=0) ─────────────────────

function buildGridBuffer(
  centerX: number,
  centerZ: number,
  extent: number,
  step: number
): Float32Array {
  const lines: number[] = [];
  const halfExt = Math.ceil(extent / step) * step;
  const startX = centerX - halfExt;
  const endX = centerX + halfExt;
  const startZ = centerZ - halfExt;
  const endZ = centerZ + halfExt;

  // Lines parallel to Z
  for (let x = startX; x <= endX + 0.001; x += step) {
    lines.push(x, 0, startZ, x, 0, endZ);
  }
  // Lines parallel to X
  for (let z = startZ; z <= endZ + 0.001; z += step) {
    lines.push(startX, 0, z, endX, 0, z);
  }
  return new Float32Array(lines);
}

// ── SVG export helper ────────────────────────────────────────────────────────

function projectPoint(
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

// ── React component ─────────────────────────────────────────────────────────

interface FramesVisualPreviewProps {
  frames: Frame[];
}

export function FramesVisualPreview({ frames }: FramesVisualPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gpuRef = useRef<GpuState | null>(null);
  const rafRef = useRef<number>(0);
  // Counter that increments each time WebGPU init completes.
  // 0 = pending, -1 = not supported, >0 = ready (sequence number).
  // Using a counter instead of a boolean guarantees dependent effects
  // always re-fire — even after React Strict Mode double-mount.
  const [initSeq, setInitSeq] = useState(0);

  // Camera state (orbit camera)
  const cameraRef = useRef({
    theta: Math.PI * 0.25, // azimuth
    phi: Math.PI * 0.3, // elevation
    distance: 8,
    target: [0, 0, 0] as [number, number, number],
    needsRender: true,
  });

  // ── Compute bounding box center and good camera defaults ──
  const boundsRef = useRef({
    centerX: 0,
    centerY: 0,
    centerZ: 0,
    maxExtent: 4,
  });

  // ── Raw wireframe edge data for SVG export (CPU-side copy) ──
  const wireEdgesRef = useRef<Float32Array | null>(null);

  // ── Initialize WebGPU (runs once) ──
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navigator.gpu) {
      console.log("GPU INIT: No Navigator GPU");
      setInitSeq(-1);
      return;
    }

    async function init() {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.log("GPU INIT: No Adapter");
        setInitSeq(-1);
        return;
      }
      const device = await adapter.requestDevice();

      const context = canvas.getContext("webgpu");
      if (!context) {
        console.log("GPU INIT: No Context", context);
        setInitSeq(-1);
        return;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "premultiplied" });

      // ── Shader modules ──
      const shaderModule = device.createShaderModule({ code: SHADER_SOURCE });
      const gridShaderModule = device.createShaderModule({
        code: GRID_SHADER_SOURCE,
      });

      // ── Uniform buffer & bind group layout ──
      const uniformBuffer = device.createBuffer({
        size: 96, // mat4x4<f32> (64) + vec4<f32> eyePos (16) + vec4<f32> viewport (16)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: { type: "uniform" },
          },
        ],
      });

      const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      });

      const uniformBindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      });

      // ── Solid pipeline ──
      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: "vs_main",
          buffers: [
            {
              arrayStride: 12,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
              ],
            },
            {
              arrayStride: 12,
              attributes: [
                { shaderLocation: 1, offset: 0, format: "float32x3" },
              ],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_main",
          targets: [{ format }],
        },
        primitive: {
          topology: "triangle-list",
          cullMode: "back",
          frontFace: "ccw",
        },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less",
        },
        multisample: { count: 4 },
      });

      // ── Wire pipeline (instanced triangle quads) ──
      const wirePipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: "vs_wire",
          buffers: [
            {
              arrayStride: 36, // posA (12) + posB (12) + normal (12)
              stepMode: "instance",
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" }, // posA
                { shaderLocation: 1, offset: 12, format: "float32x3" }, // posB
                { shaderLocation: 2, offset: 24, format: "float32x3" }, // normal
              ],
            },
          ],
        },
        fragment: {
          module: shaderModule,
          entryPoint: "fs_wire",
          targets: [{ format }],
        },
        primitive: { topology: "triangle-list" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: true,
          depthCompare: "less",
        },
        multisample: { count: 4 },
      });

      // ── Grid pipeline (line-list) ──
      const gridPipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: gridShaderModule,
          entryPoint: "vs_grid",
          buffers: [
            {
              arrayStride: 12,
              attributes: [
                { shaderLocation: 0, offset: 0, format: "float32x3" },
              ],
            },
          ],
        },
        fragment: {
          module: gridShaderModule,
          entryPoint: "fs_grid",
          targets: [{ format }],
        },
        primitive: { topology: "line-list" },
        depthStencil: {
          format: "depth24plus",
          depthWriteEnabled: false,
          depthCompare: "less",
        },
        multisample: { count: 4 },
      });

      gpuRef.current = {
        device,
        context,
        format,
        pipeline,
        wirePipeline,
        gridPipeline,
        uniformBuffer,
        uniformBindGroup,
        depthTexture: null,
        depthTextureView: null,
        msaaTexture: null,
        msaaTextureView: null,
        positionBuffer: null,
        normalBuffer: null,
        indexBuffer: null,
        wireBuffer: null,
        wireVertCount: 0,
        gridBuffer: null,
        gridVertCount: 0,
        indexCount: 0,
        canvasWidth: 0,
        canvasHeight: 0,
      };

      setInitSeq((s) => Math.max(1, Math.abs(s) + 1));
      cameraRef.current.needsRender = true;
    }

    init();

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (gpuRef.current) {
        gpuRef.current.positionBuffer?.destroy();
        gpuRef.current.normalBuffer?.destroy();
        gpuRef.current.indexBuffer?.destroy();
        gpuRef.current.wireBuffer?.destroy();
        gpuRef.current.gridBuffer?.destroy();
        gpuRef.current.depthTexture?.destroy();
        gpuRef.current.device.destroy();
        gpuRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upload geometry when frames change or GPU (re-)initializes ──
  useEffect(() => {
    if (initSeq <= 0) return;
    const gpu = gpuRef.current;
    if (!gpu) return;

    const geo = framesToGeometry(frames);

    // Destroy old buffers
    gpu.positionBuffer?.destroy();
    gpu.normalBuffer?.destroy();
    gpu.indexBuffer?.destroy();
    gpu.wireBuffer?.destroy();
    gpu.gridBuffer?.destroy();

    if (geo.vertexCount === 0) {
      gpu.positionBuffer = null;
      gpu.normalBuffer = null;
      gpu.indexBuffer = null;
      gpu.wireBuffer = null;
      gpu.gridBuffer = null;
      gpu.indexCount = 0;
      gpu.wireVertCount = 0;
      gpu.gridVertCount = 0;
      cameraRef.current.needsRender = true;
      return;
    }

    const { device } = gpu;

    // Position buffer
    const posBuf = device.createBuffer({
      size: geo.positions.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(posBuf, 0, gpuBuf(geo.positions));

    // Normal buffer
    const normBuf = device.createBuffer({
      size: geo.normals.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(normBuf, 0, gpuBuf(geo.normals));

    // Index buffer
    const idxBuf = device.createBuffer({
      size: geo.indices.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(idxBuf, 0, gpuBuf(geo.indices));

    // Wireframe buffer
    const wireData = buildWireframeBuffer(geo.positions, geo.indices);
    wireEdgesRef.current = wireData; // keep a CPU-side copy for SVG export
    const wireBuf = device.createBuffer({
      size: wireData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(wireBuf, 0, gpuBuf(wireData));

    gpu.positionBuffer = posBuf;
    gpu.normalBuffer = normBuf;
    gpu.indexBuffer = idxBuf;
    gpu.wireBuffer = wireBuf;
    gpu.wireVertCount = wireData.length / 9; // edge count (instances)
    gpu.indexCount = geo.indices.length;

    // Compute actual bounding box from geometry positions
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < geo.vertexCount; i++) {
      const px = geo.positions[i * 3];
      const py = geo.positions[i * 3 + 1];
      const pz = geo.positions[i * 3 + 2];
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (pz < minZ) minZ = pz;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
      if (pz > maxZ) maxZ = pz;
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const extent = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 0.1);

    boundsRef.current = {
      centerX: cx,
      centerY: cy,
      centerZ: cz,
      maxExtent: extent,
    };
    cameraRef.current.target = [cx, cy, cz];
    // Pull camera back enough to fit the whole mesh; factor ~1.8 gives good padding
    cameraRef.current.distance = extent * 1.8;

    // Build grid centered under the mesh
    const gridExtent = Math.max(extent, 4);
    const gridData = buildGridBuffer(cx, cz, gridExtent, 1);
    const gridBuf = device.createBuffer({
      size: gridData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(gridBuf, 0, gpuBuf(gridData));
    gpu.gridBuffer = gridBuf;
    gpu.gridVertCount = gridData.length / 3;

    console.log(
      "[WebGPU] Geometry uploaded. indexCount:",
      gpu.indexCount,
      "wireVerts:",
      gpu.wireVertCount,
      "gridVerts:",
      gpu.gridVertCount
    );
    cameraRef.current.needsRender = true;
  }, [frames, initSeq]);

  // ── SVG export ──
  const [copiedSvg, setCopiedSvg] = useState(false);

  const buildSvg = useCallback((): string | null => {
    const edges = wireEdgesRef.current;
    const canvas = canvasRef.current;
    if (!edges || !canvas) return null;

    const svgW = Math.max(canvas.clientWidth, 400);
    const svgH = Math.max(canvas.clientHeight, 300);
    const aspect = svgW / svgH;

    const cam = cameraRef.current;
    const proj = mat4Perspective(Math.PI / 4, aspect, 0.01, 500);
    const eyeX =
      cam.target[0] + cam.distance * Math.cos(cam.phi) * Math.sin(cam.theta);
    const eyeY = cam.target[1] + cam.distance * Math.sin(cam.phi);
    const eyeZ =
      cam.target[2] + cam.distance * Math.cos(cam.phi) * Math.cos(cam.theta);
    const view = mat4LookAt([eyeX, eyeY, eyeZ], cam.target, [0, 1, 0]);
    const mvp = mat4Multiply(proj, view);

    const numEdges = edges.length / 9;
    const frontLines: string[] = [];
    const backLines: string[] = [];

    for (let i = 0; i < numEdges; i++) {
      const off = i * 9;
      const ax = edges[off],
        ay = edges[off + 1],
        az = edges[off + 2];
      const bx = edges[off + 3],
        by = edges[off + 4],
        bz = edges[off + 5];
      const nx = edges[off + 6],
        ny = edges[off + 7],
        nz = edges[off + 8];

      const pa = projectPoint(mvp, ax, ay, az);
      const pb = projectPoint(mvp, bx, by, bz);

      // Skip edges behind camera
      if (pa.clipW <= 0 || pb.clipW <= 0) continue;

      const sax = ((pa.clipX / pa.clipW) * 0.5 + 0.5) * svgW;
      const say = ((-pa.clipY / pa.clipW) * 0.5 + 0.5) * svgH;
      const sbx = ((pb.clipX / pb.clipW) * 0.5 + 0.5) * svgW;
      const sby = ((-pb.clipY / pb.clipW) * 0.5 + 0.5) * svgH;

      // Facing: dot(edgeNormal, normalize(eye - midpoint)) — same logic as shader
      const midX = (ax + bx) / 2,
        midY = (ay + by) / 2,
        midZ = (az + bz) / 2;
      const vx = eyeX - midX,
        vy = eyeY - midY,
        vz = eyeZ - midZ;
      const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      const facing = (nx * vx + ny * vy + nz * vz) / vLen;

      // smoothstep(0.15, 0.55, facing) — matches shader
      const t = Math.max(0, Math.min(1, (facing - 0.15) / 0.4));
      const strokeW = (0.8 + t * 1.2).toFixed(2);

      const line = `<line x1="${sax.toFixed(1)}" y1="${say.toFixed(
        1
      )}" x2="${sbx.toFixed(1)}" y2="${sby.toFixed(
        1
      )}" stroke-width="${strokeW}"/>`;

      if (facing > 0.15) {
        backLines.push(line);
      } else {
        frontLines.push(line);
      }
    }

    // ── Scale bar ────────────────────────────────────────────────────────────
    // Project two world-space points separated by `worldLen` feet at the
    // camera-target depth so we know how many SVG pixels equal that distance.
    const scaleTarget = cam.target;
    function scaleBarPixels(worldLen: number): number {
      const p1 = projectPoint(
        mvp,
        scaleTarget[0] - worldLen / 2,
        scaleTarget[1],
        scaleTarget[2]
      );
      const p2 = projectPoint(
        mvp,
        scaleTarget[0] + worldLen / 2,
        scaleTarget[1],
        scaleTarget[2]
      );
      if (p1.clipW <= 0 || p2.clipW <= 0) return 0;
      const sx1 = (p1.clipX / p1.clipW) * 0.5 * svgW + svgW * 0.5;
      const sx2 = (p2.clipX / p2.clipW) * 0.5 * svgW + svgW * 0.5;
      return Math.abs(sx2 - sx1);
    }

    // Pick the "nicest" world length that projects to roughly 50–180 px
    const scaleCandidates = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
    let scaleWorldLen = scaleCandidates[0];
    let scalePx = scaleBarPixels(scaleWorldLen);
    for (const c of scaleCandidates) {
      const px = scaleBarPixels(c);
      if (px >= 50 && px <= 180) {
        scaleWorldLen = c;
        scalePx = px;
        break;
      }
      // Keep the candidate closest to 100 px as a fallback
      if (Math.abs(px - 100) < Math.abs(scalePx - 100)) {
        scaleWorldLen = c;
        scalePx = px;
      }
    }

    // Format label: sub-foot values → inches, whole feet → feet notation
    let scaleLabel: string;
    if (scaleWorldLen < 1) {
      scaleLabel = `${Math.round(scaleWorldLen * 12)}"`;
    } else {
      scaleLabel = `${scaleWorldLen}'`;
    }

    // Build scale-bar SVG elements (bottom-right corner)
    const sbMargin = 24;
    const sbBarY = svgH - sbMargin;
    const sbBarX2 = svgW - sbMargin;
    const sbBarX1 = sbBarX2 - scalePx;
    const sbTickH = 6;
    const sbLabelY = sbBarY + sbTickH + 14;
    const sbMidX = (sbBarX1 + sbBarX2) / 2;

    const scaleBarSvg =
      scalePx > 0
        ? [
            `  <g stroke="#444444" stroke-width="1.5" fill="none" stroke-linecap="round">`,
            `    <line x1="${sbBarX1.toFixed(1)}" y1="${sbBarY.toFixed(
              1
            )}" x2="${sbBarX2.toFixed(1)}" y2="${sbBarY.toFixed(1)}"/>`,
            `    <line x1="${sbBarX1.toFixed(1)}" y1="${(
              sbBarY - sbTickH
            ).toFixed(1)}" x2="${sbBarX1.toFixed(1)}" y2="${(
              sbBarY + sbTickH
            ).toFixed(1)}"/>`,
            `    <line x1="${sbBarX2.toFixed(1)}" y1="${(
              sbBarY - sbTickH
            ).toFixed(1)}" x2="${sbBarX2.toFixed(1)}" y2="${(
              sbBarY + sbTickH
            ).toFixed(1)}"/>`,
            `  </g>`,
            `  <text x="${sbMidX.toFixed(1)}" y="${sbLabelY.toFixed(
              1
            )}" text-anchor="middle" font-family="monospace" font-size="11" fill="#444444">${scaleLabel}</text>`,
          ]
        : [];

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}">`,
      `  <rect width="${svgW}" height="${svgH}" fill="white"/>`,
      `  <g stroke="#222222" fill="none" opacity="0.2" stroke-dasharray="3 3">`,
      ...backLines.map((l) => `    ${l}`),
      `  </g>`,
      `  <g stroke="#222222" fill="none">`,
      ...frontLines.map((l) => `    ${l}`),
      `  </g>`,
      ...scaleBarSvg,
      `</svg>`,
    ].join("\n");
  }, []);

  const exportSvg = useCallback(() => {
    const svg = buildSvg();
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "frame-preview.svg";
    anchor.click();
    URL.revokeObjectURL(url);
  }, [buildSvg]);

  const copySvg = useCallback(() => {
    const svg = buildSvg();
    if (!svg) return;
    navigator.clipboard.writeText(svg).then(() => {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    });
  }, [buildSvg]);

  // ── Render function ──
  const renderCountRef = useRef(0);
  const render = useCallback(() => {
    const gpu = gpuRef.current;
    const canvas = canvasRef.current;
    if (!gpu || !canvas) {
      console.warn(
        "[WebGPU render] Skipped — gpu:",
        !!gpu,
        "canvas:",
        !!canvas
      );
      return;
    }

    // Resize the canvas drawing buffer to match its CSS layout size
    const dpr = window.devicePixelRatio || 1;
    const displayW = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const displayH = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== displayW || canvas.height !== displayH) {
      canvas.width = displayW;
      canvas.height = displayH;
    }

    // Get the color texture FIRST — its actual size is the source of truth
    let colorTexture: GPUTexture;
    try {
      colorTexture = gpu.context.getCurrentTexture();
    } catch {
      return; // context lost or canvas not visible
    }
    const tw = colorTexture.width;
    const th = colorTexture.height;
    const colorView = colorTexture.createView();

    // Recreate depth texture whenever the color texture size changes
    if (
      !gpu.depthTexture ||
      gpu.canvasWidth !== tw ||
      gpu.canvasHeight !== th
    ) {
      gpu.depthTexture?.destroy();
      gpu.depthTexture = gpu.device.createTexture({
        size: [tw, th],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: 4,
      });
      gpu.depthTextureView = gpu.depthTexture.createView();

      gpu.msaaTexture?.destroy();
      gpu.msaaTexture = gpu.device.createTexture({
        size: [tw, th],
        format: gpu.format,
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        sampleCount: 4,
      });
      gpu.msaaTextureView = gpu.msaaTexture.createView();

      gpu.canvasWidth = tw;
      gpu.canvasHeight = th;
    }

    if (!gpu.depthTextureView) {
      console.warn("[WebGPU render] No depth texture view");
      return;
    }

    renderCountRef.current++;
    if (renderCountRef.current <= 3) {
      console.log(
        `[WebGPU render #${renderCountRef.current}]`,
        `color: ${tw}x${th}`,
        `indexCount: ${gpu.indexCount}`,
        `wireVerts: ${gpu.wireVertCount}`,
        `gridVerts: ${gpu.gridVertCount}`
      );
    }

    // Compute MVP
    const cam = cameraRef.current;
    const aspect = tw / th;
    const proj = mat4Perspective(Math.PI / 4, aspect, 0.01, 500);

    const eyeX =
      cam.target[0] + cam.distance * Math.cos(cam.phi) * Math.sin(cam.theta);
    const eyeY = cam.target[1] + cam.distance * Math.sin(cam.phi);
    const eyeZ =
      cam.target[2] + cam.distance * Math.cos(cam.phi) * Math.cos(cam.theta);

    const view = mat4LookAt([eyeX, eyeY, eyeZ], cam.target, [0, 1, 0]);
    const mvp = mat4Multiply(proj, view);

    gpu.device.queue.writeBuffer(gpu.uniformBuffer, 0, gpuBuf(mvp));
    gpu.device.queue.writeBuffer(
      gpu.uniformBuffer,
      64,
      gpuBuf(new Float32Array([eyeX, eyeY, eyeZ, 0]))
    );
    gpu.device.queue.writeBuffer(
      gpu.uniformBuffer,
      80,
      gpuBuf(new Float32Array([tw, th, 0, 0]))
    );

    const encoder = gpu.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: gpu.msaaTextureView!,
          resolveTarget: colorView,
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: {
        view: gpu.depthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
      },
    });

    // Draw grid
    if (gpu.gridBuffer && gpu.gridVertCount > 0) {
      pass.setPipeline(gpu.gridPipeline);
      pass.setBindGroup(0, gpu.uniformBindGroup);
      pass.setVertexBuffer(0, gpu.gridBuffer);
      pass.draw(gpu.gridVertCount);
    }

    // Draw solid geometry
    if (gpu.positionBuffer && gpu.normalBuffer && gpu.indexBuffer) {
      pass.setPipeline(gpu.pipeline);
      pass.setBindGroup(0, gpu.uniformBindGroup);
      pass.setVertexBuffer(0, gpu.positionBuffer);
      pass.setVertexBuffer(1, gpu.normalBuffer);
      pass.setIndexBuffer(gpu.indexBuffer, "uint32");
      pass.drawIndexed(gpu.indexCount);
    }

    // Draw wireframe
    if (gpu.wireBuffer && gpu.wireVertCount > 0) {
      pass.setPipeline(gpu.wirePipeline);
      pass.setBindGroup(0, gpu.uniformBindGroup);
      pass.setVertexBuffer(0, gpu.wireBuffer);
      pass.draw(6, gpu.wireVertCount);
    }

    pass.end();
    gpu.device.queue.submit([encoder.finish()]);
  }, []);

  // ── Render loop (unconditional — checks gpuRef internally) ──
  useEffect(() => {
    function loop() {
      if (gpuRef.current && cameraRef.current.needsRender) {
        cameraRef.current.needsRender = false;
        render();
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // ── Mouse / touch interaction for orbit camera ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      const cam = cameraRef.current;
      cam.theta -= dx * 0.007;
      cam.phi += dy * 0.007;
      // Clamp phi to avoid flipping
      cam.phi = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, cam.phi));
      cam.needsRender = true;
    }

    function onPointerUp(e: PointerEvent) {
      dragging = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const cam = cameraRef.current;
      cam.distance *= 1 + e.deltaY * 0.001;
      cam.distance = Math.max(0.5, Math.min(200, cam.distance));
      cam.needsRender = true;
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  // ── Handle resize ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      cameraRef.current.needsRender = true;
    });
    observer.observe(canvas);

    return () => observer.disconnect();
  }, []);

  // ── Fallback 2D preview when WebGPU is not available ──
  if (initSeq < 0) {
    return <Fallback2DPreview frames={frames} />;
  }

  if (frames.length < 2) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">3D Preview (testing)</h3>
      <div className="relative w-full" style={{ height: "420px" }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-md cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        />
        {initSeq === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
            <span className="text-sm opacity-60">Initializing WebGPU…</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 mt-2">
        <p className="text-sm opacity-70">Drag to orbit · Scroll to zoom</p>
        <button
          onClick={copySvg}
          className="text-sm opacity-60 hover:opacity-100 underline underline-offset-2 transition-opacity"
        >
          {copiedSvg ? "Copied!" : "Copy SVG"}
        </button>
        <button
          onClick={exportSvg}
          className="text-sm opacity-60 hover:opacity-100 underline underline-offset-2 transition-opacity"
        >
          Export SVG
        </button>
      </div>
    </div>
  );
}

// ── Fallback 2D preview (when WebGPU is unavailable) ────────────────────────

function Fallback2DPreview({ frames }: { frames: Frame[] }) {
  if (frames.length < 2) {
    return null;
  }

  const maxHeight = Math.max(...frames.map((f) => f.width));
  const maxDepth = Math.max(...frames.map((f) => f.depth));

  return (
    <div className="mt-8 p-4 border border-gray-300 dark:border-gray-600 rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Visual Preview</h3>
      <p className="text-xs opacity-50 mb-2">
        WebGPU is not available — showing 2D fallback.
      </p>
      <div className="flex items-end gap-2 overflow-x-auto pb-4">
        {frames.map((frame, index) => {
          const scaledHeight =
            maxHeight > 0 ? (frame.width / maxHeight) * 100 : 30;
          const scaledWidth =
            maxDepth > 0 ? Math.max(20, (frame.depth / maxDepth) * 60) : 30;

          return (
            <div key={frame.id} className="flex items-end">
              <div className="flex flex-col items-center">
                <div
                  className="bg-green-500 dark:bg-green-600 border-2 border-green-700 dark:border-green-400 flex items-center justify-center text-xs font-bold text-white rounded-sm"
                  style={{
                    height: `${Math.max(30, scaledHeight)}px`,
                    width: `${scaledWidth}px`,
                    minWidth: "30px",
                  }}
                >
                  {index + 1}
                </div>
              </div>
              {index < frames.length - 1 && (
                <div className="flex flex-col items-center mx-1">
                  <div
                    className="bg-purple-300 dark:bg-purple-700 opacity-50"
                    style={{
                      height: "4px",
                      width: `${Math.max(30, frame.distanceToNext * 10)}px`,
                    }}
                  />
                  <span className="text-xs mt-1">
                    {frame.distanceToNext}&apos;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-sm opacity-70 mt-2">
        Frame heights and widths are scaled proportionally. Numbers indicate
        frame index.
      </p>
    </div>
  );
}
