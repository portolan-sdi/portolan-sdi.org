/**
 * Draws the hero point cloud on a canvas.
 *
 * WebGL is the main path. It uploads both states once and moves every point
 * in the vertex shader, so a frame costs one draw call. Canvas 2D is the
 * fallback for a browser with no WebGL. Both read the same `Scene`.
 */
import { STAGGER, computeFrame, type Scene } from "./hero-points";

export interface Renderer {
  kind: "webgl" | "2d";
  /** Load a scene. Call again after a resize. */
  setScene(scene: Scene, palette: Uint8Array, dpr: number): void;
  /** Draw one frame. `morph` is 0 on the map and 1 on the files. */
  draw(morph: number): void;
  destroy(): void;
}

/** Point opacity. A little under 1 lets dense land build up darker. */
const ALPHA = 0.9;

const VERTEX = `
attribute vec2 aFrom;
attribute vec2 aTo;
attribute vec4 aMove;
attribute vec3 aToneFrom;
attribute vec3 aToneTo;
uniform vec2 uSize;
uniform float uMorph;
uniform float uDpr;
uniform float uStagger;
varying vec3 vTone;
void main() {
  float local = clamp((uMorph - aMove.x * uStagger) / (1.0 - uStagger), 0.0, 1.0);
  float e = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);
  vec2 d = aTo - aFrom;
  float swing = sin(e * 3.14159265) * aMove.y;
  vec2 p = aFrom + d * e + vec2(-d.y, d.x) * swing;
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(1.0, mix(aMove.z, aMove.w, e) * uDpr);
  vTone = mix(aToneFrom, aToneTo, e);
}`;

const FRAGMENT = `
precision mediump float;
uniform float uAlpha;
varying vec3 vTone;
void main() {
  gl_FragColor = vec4(vTone * uAlpha, uAlpha);
}`;

function sizeCanvas(canvas: HTMLCanvasElement, scene: Scene, dpr: number) {
  const w = Math.max(1, Math.round(scene.width * dpr));
  const h = Math.max(1, Math.round(scene.height * dpr));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

function createWebgl(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let floats: WebGLBuffer | null = null;
  let bytes: WebGLBuffer | null = null;
  let uMorph: WebGLUniformLocation | null = null;
  let count = 0;
  let last: { scene: Scene; palette: Uint8Array; dpr: number } | null = null;
  let lastMorph = 0;

  function compile(type: number, source: string): WebGLShader | null {
    const shader = gl!.createShader(type);
    if (!shader) return null;
    gl!.shaderSource(shader, source);
    gl!.compileShader(shader);
    if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
      gl!.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function link(): boolean {
    const vs = compile(gl!.VERTEX_SHADER, VERTEX);
    const fs = compile(gl!.FRAGMENT_SHADER, FRAGMENT);
    const prog = gl!.createProgram();
    if (!vs || !fs || !prog) return false;
    gl!.attachShader(prog, vs);
    gl!.attachShader(prog, fs);
    gl!.linkProgram(prog);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(prog, gl!.LINK_STATUS)) {
      gl!.deleteProgram(prog);
      return false;
    }
    program = prog;
    floats = gl!.createBuffer();
    bytes = gl!.createBuffer();
    return true;
  }

  if (!link()) return null;

  function upload(scene: Scene, palette: Uint8Array, dpr: number) {
    if (!program) return;
    sizeCanvas(canvas, scene, dpr);
    count = scene.count;

    // Eight floats per point: both positions, then delay, bend, two sizes.
    const f = new Float32Array(count * 8);
    // Eight bytes per point: both tones as RGB, padded to four bytes each.
    const b = new Uint8Array(count * 8);
    for (let i = 0; i < count; i++) {
      const o = i * 8;
      f[o] = scene.ax[i];
      f[o + 1] = scene.ay[i];
      f[o + 2] = scene.bx[i];
      f[o + 3] = scene.by[i];
      f[o + 4] = scene.delay[i];
      f[o + 5] = scene.bend[i];
      f[o + 6] = scene.sizeA[i];
      f[o + 7] = scene.sizeB[i];
      const ta = scene.toneA[i] * 3;
      const tb = scene.toneB[i] * 3;
      b[o] = palette[ta];
      b[o + 1] = palette[ta + 1];
      b[o + 2] = palette[ta + 2];
      b[o + 4] = palette[tb];
      b[o + 5] = palette[tb + 1];
      b[o + 6] = palette[tb + 2];
    }

    gl!.useProgram(program);
    const attr = (name: string) => gl!.getAttribLocation(program!, name);

    gl!.bindBuffer(gl!.ARRAY_BUFFER, floats);
    gl!.bufferData(gl!.ARRAY_BUFFER, f, gl!.STATIC_DRAW);
    const from = attr("aFrom");
    const to = attr("aTo");
    const move = attr("aMove");
    gl!.enableVertexAttribArray(from);
    gl!.vertexAttribPointer(from, 2, gl!.FLOAT, false, 32, 0);
    gl!.enableVertexAttribArray(to);
    gl!.vertexAttribPointer(to, 2, gl!.FLOAT, false, 32, 8);
    gl!.enableVertexAttribArray(move);
    gl!.vertexAttribPointer(move, 4, gl!.FLOAT, false, 32, 16);

    gl!.bindBuffer(gl!.ARRAY_BUFFER, bytes);
    gl!.bufferData(gl!.ARRAY_BUFFER, b, gl!.STATIC_DRAW);
    const toneFrom = attr("aToneFrom");
    const toneTo = attr("aToneTo");
    gl!.enableVertexAttribArray(toneFrom);
    gl!.vertexAttribPointer(toneFrom, 3, gl!.UNSIGNED_BYTE, true, 8, 0);
    gl!.enableVertexAttribArray(toneTo);
    gl!.vertexAttribPointer(toneTo, 3, gl!.UNSIGNED_BYTE, true, 8, 4);

    const uniform = (name: string) => gl!.getUniformLocation(program!, name);
    gl!.uniform2f(uniform("uSize"), scene.width, scene.height);
    gl!.uniform1f(uniform("uDpr"), dpr);
    gl!.uniform1f(uniform("uStagger"), STAGGER);
    gl!.uniform1f(uniform("uAlpha"), ALPHA);
    uMorph = uniform("uMorph");

    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.disable(gl!.DEPTH_TEST);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.clearColor(0, 0, 0, 0);
  }

  function draw(morph: number) {
    lastMorph = morph;
    if (!program || gl!.isContextLost()) return;
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    if (count === 0) return;
    gl!.uniform1f(uMorph, morph);
    gl!.drawArrays(gl!.POINTS, 0, count);
  }

  // A lost context drops every buffer. Rebuild from the last scene.
  const onLost = (event: Event) => {
    event.preventDefault();
    program = null;
  };
  const onRestored = () => {
    if (!link() || !last) return;
    upload(last.scene, last.palette, last.dpr);
    draw(lastMorph);
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  return {
    kind: "webgl",
    setScene(scene, palette, dpr) {
      last = { scene, palette, dpr };
      upload(scene, palette, dpr);
    },
    draw,
    destroy() {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (!gl.isContextLost()) {
        gl.deleteBuffer(floats);
        gl.deleteBuffer(bytes);
        gl.deleteProgram(program);
      }
      last = null;
      count = 0;
    },
  };
}

function create2d(canvas: HTMLCanvasElement): Renderer | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let scene: Scene | null = null;
  let dpr = 1;
  let colors: string[] = [];
  let xy = new Float32Array(0);
  let ease = new Float32Array(0);
  // Point indexes grouped by tone, so each tone sets the fill style once.
  let byToneA: Uint32Array[] = [];
  let byToneB: Uint32Array[] = [];

  function group(tones: Uint8Array, count: number, size: number) {
    const lists: number[][] = Array.from({ length: size }, () => []);
    for (let i = 0; i < count; i++) lists[tones[i]].push(i);
    return lists.map((list) => Uint32Array.from(list));
  }

  return {
    kind: "2d",
    setScene(next, palette, nextDpr) {
      scene = next;
      dpr = nextDpr;
      sizeCanvas(canvas, next, dpr);
      const size = palette.length / 3;
      colors = [];
      for (let i = 0; i < size; i++) {
        colors.push(
          `rgb(${palette[i * 3]},${palette[i * 3 + 1]},${palette[i * 3 + 2]})`,
        );
      }
      xy = new Float32Array(next.count * 2);
      ease = new Float32Array(next.count);
      byToneA = group(next.toneA, next.count, size);
      byToneB = group(next.toneB, next.count, size);
    },
    draw(morph) {
      if (!scene) return;
      const { sizeA, sizeB } = scene;
      computeFrame(scene, morph, xy, ease);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, scene.width, scene.height);
      ctx.globalAlpha = ALPHA;
      // A point shows its map tone for the first half of its flight and its
      // file tone for the second half.
      for (let pass = 0; pass < 2; pass++) {
        const lists = pass === 0 ? byToneA : byToneB;
        for (let t = 0; t < lists.length; t++) {
          const list = lists[t];
          if (list.length === 0) continue;
          ctx.fillStyle = colors[t];
          for (let k = 0; k < list.length; k++) {
            const i = list[k];
            const e = ease[i];
            if (pass === 0 ? e >= 0.5 : e < 0.5) continue;
            const s = sizeA[i] + (sizeB[i] - sizeA[i]) * e;
            ctx.fillRect(xy[i * 2] - s / 2, xy[i * 2 + 1] - s / 2, s, s);
          }
        }
      }
    },
    destroy() {
      scene = null;
    },
  };
}

/** Make a renderer for the canvas. Returns null when neither path works. */
export function createRenderer(
  canvas: HTMLCanvasElement,
  prefer: "webgl" | "2d" = "webgl",
): Renderer | null {
  if (prefer === "webgl") {
    const webgl = createWebgl(canvas);
    if (webgl) return webgl;
  }
  return create2d(canvas);
}
