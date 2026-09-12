import test from "node:test";
import assert from "node:assert/strict";
import { createWaterSurface } from "./water-surface.js";
import { addRipple, createSimulation, inWaterSurface, sceneLayout } from "./scene-model.js";

const identity = { scale: 1, x: 0, y: 0 };

function fixture(width = 1536, height = 1024, layout = identity, initiallyReduced = true) {
  const surface = createWaterSurface();
  const sim = createSimulation();
  surface.resize({ width, height, layout });
  const update = (time, reduced = true) => surface.update({
    time, reduced, ripples: sim.ripples, rippleCursor: sim.rippleCursor,
  });
  update(0, initiallyReduced);
  return { surface, sim, update, layout };
}

function advance(update, from, to, reduced = true, rate = 60) {
  const frames = Math.round((to - from) * rate);
  for (let n = 1; n <= frames; n++) update(from + n / rate, reduced);
}

function energy(frame, channel = 2) {
  let sum = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    if (frame.data[i + 3]) sum += Math.abs(frame.data[i + channel] - 128);
  }
  return sum;
}

function location(frame, x, y, layout = identity) {
  return {
    x: (x * layout.scale + layout.x) * frame.width / frame.spanWidth - 0.5,
    y: (y * layout.scale + layout.y - frame.top) * frame.height / frame.spanHeight - 0.5,
  };
}

function outerEnergy(frame, origin, radius) {
  let sum = 0;
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const p = (y * frame.width + x) * 4;
      if (Math.hypot(x - origin.x, y - origin.y) > radius && frame.data[p + 3]) {
        sum += Math.abs(frame.data[p + 2] - 128);
      }
    }
  }
  return sum;
}

test("a tap creates visible normals and a wave that travels beyond its origin, then decays", () => {
  const { surface, sim, update } = fixture();
  addRipple(sim, 780, 950);
  update(0, false);
  const origin = location(surface.frame, 780, 950);
  const initial = energy(surface.frame);
  assert.ok(initial > 500, "tap must be clearly represented in the byte texture");
  assert.ok(energy(surface.frame, 0) > 300, "horizontal normals must displace the photograph");
  assert.ok(energy(surface.frame, 1) > 300, "vertical normals must displace the photograph");
  assert.equal(outerEnergy(surface.frame, origin, 8), 0);
  advance(update, 0, 0.6);
  assert.ok(outerEnergy(surface.frame, origin, 8) > 150, "the wave must propagate, not just fade in place");
  const travelling = energy(surface.frame);
  advance(update, 0.6, 3);
  let normalPeak = 0;
  for (let p = 0; p < surface.frame.data.length; p += 4) {
    normalPeak = Math.max(normalPeak, Math.abs(surface.frame.data[p] - 128), Math.abs(surface.frame.data[p + 1] - 128));
  }
  assert.ok(normalPeak >= 3, "tap waves must retain measurable slopes near three seconds");
  advance(update, 3, 12);
  assert.ok(energy(surface.frame) < travelling * 0.1, "unforced ripples must settle");
});

test("overlapping taps superpose without replacing the earlier disturbance", () => {
  const a = fixture();
  const b = fixture();
  const combined = fixture();
  addRipple(a.sim, 700, 950);
  addRipple(b.sim, 860, 950);
  addRipple(combined.sim, 700, 950);
  addRipple(combined.sim, 860, 950);
  for (const f of [a, b, combined]) {
    f.update(0, false);
    advance(f.update, 0, 0.6);
  }
  let overlapCells = 0;
  for (let p = 2; p < combined.surface.frame.data.length; p += 4) {
    const av = a.surface.frame.data[p] - 128;
    const bv = b.surface.frame.data[p] - 128;
    if (Math.abs(av) <= 3 || Math.abs(bv) <= 3) continue;
    overlapCells++;
    assert.ok(Math.abs(combined.surface.frame.data[p] - 128 - av - bv) <= 2);
  }
  assert.ok(overlapCells > 10, "the two travelling fronts should physically overlap");
});

test("serial consumption ignores event age and consumes a wrapped ring burst once", () => {
  const actual = fixture();
  const expected = fixture();
  for (let i = 0; i < 29; i++) addRipple(actual.sim, 660 + (i % 6) * 40, 950);
  for (let i = 17; i < 29; i++) addRipple(expected.sim, 660 + (i % 6) * 40, 950);
  for (const ripple of actual.sim.ripples) ripple.age = 0.8;
  actual.update(0, false);
  expected.update(0, false);
  assert.deepEqual(actual.surface.frame.data, expected.surface.frame.data);
  const snapshot = actual.surface.frame.data.slice();
  const revision = actual.surface.frame.revision;
  actual.update(0, false);
  assert.deepEqual(actual.surface.frame.data, snapshot);
  assert.equal(actual.surface.frame.revision, revision);
});

test("resize resets the field without replaying active taps and maps a new tap through its layout", () => {
  const f = fixture();
  addRipple(f.sim, 780, 950);
  f.update(0, false);
  const previousData = f.surface.frame.data;
  const layout = sceneLayout(390, 844);
  f.surface.resize({ width: 390, height: 844, layout });
  f.update(1, false);
  assert.notEqual(f.surface.frame.data, previousData);
  assert.equal(energy(f.surface.frame), 0);
  addRipple(f.sim, 780, 950);
  f.update(1, false);
  const origin = location(f.surface.frame, 780, 950, layout);
  let peak = -1;
  let peakX = 0;
  let peakY = 0;
  const frame = f.surface.frame;
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const value = frame.data[(y * frame.width + x) * 4 + 2];
      if (value > peak) { peak = value; peakX = x; peakY = y; }
    }
  }
  assert.ok(peak > 220);
  assert.ok(Math.abs(peakX - origin.x) <= 1 && Math.abs(peakY - origin.y) <= 1);
});

test("mask respects the river and ignores taps on land or outside the viewport", () => {
  const f = fixture(390, 844, sceneLayout(390, 844));
  const frame = f.surface.frame;
  assert.ok(frame.width >= 128 && frame.width <= 192);
  assert.ok(frame.height <= 256);
  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const worldX = ((x + 0.5) * frame.spanWidth / frame.width - f.layout.x) / f.layout.scale;
      const worldY = (frame.top + (y + 0.5) * frame.spanHeight / frame.height - f.layout.y) / f.layout.scale;
      assert.equal(frame.data[(y * frame.width + x) * 4 + 3] > 0, inWaterSurface(worldX, worldY));
    }
  }
  addRipple(f.sim, 780, 400);
  addRipple(f.sim, 780, 3000);
  f.update(0, false);
  assert.equal(energy(frame), 0);
  const empty = fixture(400, 200, identity);
  assert.equal(empty.surface.frame.spanHeight, 0);
  assert.equal(empty.surface.frame.data.some((v, i) => i % 4 === 3 && v > 0), false);
});

test("resize retains a pending tap in the extended phone river below the source photograph", () => {
  const f = fixture();
  addRipple(f.sim, 780, 950);
  f.update(0, false);
  addRipple(f.sim, 780, 1200);
  const layout = sceneLayout(390, 844);
  f.surface.resize({ width: 390, height: 844, layout });
  f.update(0, false);
  const frame = f.surface.frame;
  const oldPoint = location(frame, 780, 950, layout);
  const newPoint = location(frame, 780, 1200, layout);
  const sample = (point) => frame.data[(Math.round(point.y) * frame.width + Math.round(point.x)) * 4 + 2];
  assert.equal(sample(oldPoint), 128, "a consumed event remains retired");
  assert.ok(sample(newPoint) > 220, "a pending event survives resize and reaches the phone extension");
});

test("ambient ripples start within a second, then settle into a slower cadence, including after resize", () => {
  const f = fixture(1536, 1024, identity, false);
  const arrivals = [];
  let wasStrong = false;
  for (let tick = 1; tick <= 300; tick++) {
    const time = tick / 60;
    f.update(time, false);
    let peak = 0;
    for (let p = 2; p < f.surface.frame.data.length; p += 4) {
      peak = Math.max(peak, f.surface.frame.data[p] - 128);
    }
    const strong = peak >= 20;
    if (strong && !wasStrong) arrivals.push(time);
    wasStrong = strong;
  }
  assert.ok(arrivals.length >= 3 && arrivals.length <= 4, "ambient waves should recur visibly without becoming a constant shower");
  assert.ok(arrivals[0] >= 0.6 && arrivals[0] <= 0.9 + 1 / 60);
  arrivals.slice(1).forEach((time, i) => {
    assert.ok(time - arrivals[i] >= 1.2 && time - arrivals[i] <= 2.2 + 1 / 60);
  });
  f.surface.resize({ width: 390, height: 844, layout: sceneLayout(390, 844) });
  f.update(10, false);
  advance(f.update, 10, 10.5, false);
  assert.equal(energy(f.surface.frame), 0, "resize schedules a new arrival rather than replaying one");
  advance(f.update, 10.5, 11, false);
  assert.ok(energy(f.surface.frame) > 20, "resized water should also become visibly active promptly");
});

test("reduced motion suppresses automatic drops and softens manual taps", () => {
  const quiet = fixture();
  const active = fixture();
  advance(quiet.update, 0, 4, true);
  advance(active.update, 0, 4, false);
  assert.equal(energy(quiet.surface.frame), 0);
  assert.ok(energy(active.surface.frame) > 20, "ambient drops must disturb visible water");
  const manual = fixture();
  addRipple(quiet.sim, 780, 950);
  addRipple(manual.sim, 780, 950);
  quiet.update(4, true);
  manual.update(0, false);
  const ratio = energy(quiet.surface.frame) / energy(manual.surface.frame);
  assert.ok(ratio > 0.2 && ratio < 0.4, "reduced taps should remain visible at a gentler strength");
});

test("30Hz and 60Hz input cadence agree, and pauses do not cause catch-up explosions", () => {
  const a = fixture();
  const b = fixture();
  for (const f of [a, b]) { addRipple(f.sim, 780, 950); f.update(0, false); }
  advance(a.update, 0, 0.5, true, 60);
  advance(b.update, 0, 0.5, true, 30);
  assert.deepEqual(a.surface.frame.data, b.surface.frame.data);
  const data = a.surface.frame.data;
  const stable = data.slice();
  const frame = a.surface.frame;
  a.update(3600, false);
  assert.deepEqual(data, stable, "a long pause must not simulate the missing hour");
  assert.equal(a.surface.frame, frame);
  a.update(3600 + 1 / 60, true);
  assert.equal(a.surface.frame.data, data, "normal updates must reuse the byte buffer");
  assert.notDeepEqual(data, stable);
  assert.ok(data.every((value, i) => i % 4 === 3 || value >= 1), "encoded finite components remain in range");
});
