import test from "node:test";
import assert from "node:assert/strict";
import { drawWaterFieldFallback } from "./water-field-fallback.js";
import { createWaterSurface } from "./water-surface.js";
import { addRipple, createSimulation } from "./scene-model.js";

const identity = { scale: 1, x: 0, y: 0 };

function recorder() {
  const strokes = [];
  const stack = [];
  let path = [];
  let point = null;
  return {
    strokes,
    globalAlpha: 0,
    globalCompositeOperation: "multiply",
    strokeStyle: "#abcdef",
    lineWidth: 12,
    lineCap: "butt",
    lineJoin: "bevel",
    save() {
      stack.push({
        globalAlpha: this.globalAlpha, globalCompositeOperation: this.globalCompositeOperation,
        strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, lineCap: this.lineCap, lineJoin: this.lineJoin,
      });
    },
    restore() { Object.assign(this, stack.pop()); },
    beginPath() { path = []; },
    moveTo(x, y) { point = [x, y]; },
    quadraticCurveTo(cx, cy, x, y) {
      path.push({ from: point, control: [cx, cy], to: [x, y] });
      point = [x, y];
    },
    stroke() {
      strokes.push({
        segments: path, alpha: this.globalAlpha, composite: this.globalCompositeOperation,
        width: this.lineWidth, color: this.strokeStyle,
      });
    },
  };
}

function field(width = 5, height = 5) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) data.set([128, 128, 128, 255], i * 4);
  return { data, width, height, left: 40, top: 300, spanWidth: width * 20, spanHeight: height * 10, revision: 0 };
}

function slopeRamp(f) {
  for (let y = 0; y < f.height; y++) {
    for (let x = 0; x < f.width; x++) f.data[(y * f.width + x) * 4] = Math.round(98 + x * 60 / (f.width - 1));
  }
  f.revision++;
  return f;
}

function points(ctx) {
  return ctx.strokes.flatMap((stroke) => stroke.segments.flatMap((s) => [s.from, s.control, s.to]));
}

test("calm RG=128 produces no strokes, regardless of height bytes or dry-cell values", () => {
  const f = field();
  for (let i = 0; i < f.width * f.height; i++) f.data[i * 4 + 2] = i % 2 ? 255 : 1;
  const calm = recorder();
  drawWaterFieldFallback(calm, f, identity, 0);
  assert.equal(calm.strokes.length, 0);
  for (let i = 0; i < f.width * f.height; i++) {
    f.data[i * 4] = i % 2 ? 255 : 1;
    f.data[i * 4 + 3] = 0;
  }
  f.revision++;
  drawWaterFieldFallback(calm, f, identity, 1);
  assert.equal(calm.strokes.length, 0);
});

test("smooth contour pieces connect at shared edges and map cell-center CSS coordinates into world space", () => {
  const f = slopeRamp(field());
  const baseline = recorder();
  const mapped = recorder();
  const layout = { scale: 0.4, x: -87, y: 196 };
  drawWaterFieldFallback(baseline, f, identity, 0);
  drawWaterFieldFallback(mapped, f, layout, 0);
  assert.equal(baseline.strokes.length, 4);
  assert.equal(mapped.strokes.length, baseline.strokes.length);
  for (const stroke of baseline.strokes) {
    assert.equal(stroke.segments.length, f.height - 1);
    stroke.segments.slice(1).forEach((segment, i) => {
      assert.deepEqual(segment.from, stroke.segments[i].to, "neighboring cells must meet without gaps");
    });
    assert.equal(stroke.segments[0].from[1], f.top + 0.5 * f.spanHeight / f.height);
    assert.equal(stroke.segments.at(-1).to[1], f.top + (f.height - 0.5) * f.spanHeight / f.height);
  }
  const a = points(baseline);
  const b = points(mapped);
  a.forEach(([x, y], i) => {
    assert.ok(Math.abs(b[i][0] * layout.scale + layout.x - x) < 1e-9);
    assert.ok(Math.abs(b[i][1] * layout.scale + layout.y - y) < 1e-9);
  });
  mapped.strokes.forEach((stroke, i) => assert.ok(Math.abs(stroke.width * layout.scale - baseline.strokes[i].width) < 1e-9));
});

test("masked corners cannot create a false bank contour or draw across dry cells", () => {
  const f = slopeRamp(field(3, 3));
  f.data[(1 * f.width + 1) * 4 + 3] = 0;
  const ctx = recorder();
  drawWaterFieldFallback(ctx, f, identity, 0);
  assert.equal(ctx.strokes.length, 0, "all four adjacent squares touch the dry center");
  f.data[(1 * f.width + 1) * 4 + 3] = 255;
  for (let y = 0; y < 3; y++) f.data[(y * f.width + 2) * 4 + 3] = 0;
  f.revision++;
  drawWaterFieldFallback(ctx, f, identity, 0);
  assert.ok(ctx.strokes.length > 0);
  assert.ok(points(ctx).every(([x]) => x <= f.left + 1.5 * f.spanWidth / f.width));
});

test("saddle contours are finite and their curves remain within the wet cell", () => {
  const f = field(2, 2);
  [108, 148, 148, 108].forEach((r, i) => { f.data[i * 4] = r; });
  const ctx = recorder();
  drawWaterFieldFallback(ctx, f, identity, 0.5);
  assert.equal(ctx.strokes.length, 2);
  assert.ok(ctx.strokes.every((stroke) => stroke.segments.length === 2));
  for (const [x, y] of points(ctx)) {
    assert.ok(Number.isFinite(x) && Number.isFinite(y));
    assert.ok(x >= f.left + 10 && x <= f.left + 30);
    assert.ok(y >= f.top + 5 && y <= f.top + 15);
  }
});

test("day and night strokes remain visible despite inherited zero alpha and restore caller state", () => {
  const f = slopeRamp(field());
  for (const night of [0, 1]) {
    const ctx = recorder();
    drawWaterFieldFallback(ctx, f, identity, night);
    assert.ok(ctx.strokes.some((stroke) => stroke.color === "#eee9cf"));
    assert.ok(ctx.strokes.some((stroke) => stroke.color === "#123b40"));
    assert.ok(ctx.strokes.every((stroke) => stroke.alpha > 0 && stroke.alpha < 0.4 && stroke.composite === "source-over"));
    assert.equal(ctx.globalAlpha, 0);
    assert.equal(ctx.globalCompositeOperation, "multiply");
    assert.equal(ctx.strokeStyle, "#abcdef");
    assert.equal(ctx.lineWidth, 12);
    assert.equal(ctx.lineCap, "butt");
    assert.equal(ctx.lineJoin, "bevel");
  }
});

test("mutable field revisions refresh slopes while theme and layout changes apply without a new revision", () => {
  const f = field();
  drawWaterFieldFallback(recorder(), f, identity, 0);
  slopeRamp(f);
  const day = recorder();
  const night = recorder();
  drawWaterFieldFallback(day, f, identity, 0);
  drawWaterFieldFallback(night, f, { scale: 0.5, x: 0, y: 0 }, 1);
  assert.ok(day.strokes.length > 0);
  assert.ok(night.strokes[0].alpha > day.strokes[0].alpha);
  assert.equal(night.strokes[0].segments[0].from[0], day.strokes[0].segments[0].from[0] * 2);
  const newData = f.data.slice();
  for (let i = 0; i < f.width * f.height; i++) { newData[i * 4] = 128; newData[i * 4 + 1] = 128; }
  f.data = newData;
  const resized = recorder();
  drawWaterFieldFallback(resized, f, identity, 0);
  assert.equal(resized.strokes.length, 0);
});

test("real ambient and tap waves produce contours that move outward with the shared solver", () => {
  const sim = createSimulation();
  const surface = createWaterSurface();
  surface.resize({ width: 1536, height: 1024, layout: identity });
  const update = (time, reduced) => surface.update({ time, reduced, ripples: sim.ripples, rippleCursor: sim.rippleCursor });
  update(0, false);
  for (let i = 1; i <= 48; i++) update(i / 60, false);
  const ambient = recorder();
  drawWaterFieldFallback(ambient, surface.frame, identity, 0);
  assert.ok(ambient.strokes.length > 0, "an unclicked scene must show the actual ambient wave");
  surface.resize({ width: 1536, height: 1024, layout: identity });
  addRipple(sim, 780, 950);
  update(1, true);
  const initial = recorder();
  drawWaterFieldFallback(initial, surface.frame, identity, 0);
  for (let i = 1; i <= 36; i++) update(1 + i / 60, true);
  const travelling = recorder();
  drawWaterFieldFallback(travelling, surface.frame, identity, 0);
  const initialXs = points(initial).map(([x]) => x);
  const travelledXs = points(travelling).map(([x]) => x);
  assert.ok(Math.min(...travelledXs) < Math.min(...initialXs) - 20);
  assert.ok(Math.max(...travelledXs) > Math.max(...initialXs) + 20);
});
