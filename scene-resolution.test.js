import test from "node:test";
import assert from "node:assert/strict";
import { createSceneResolution } from "./scene-resolution.js";

function viewport(width = 623, height = 734, dpr = 2) {
  const resolution = createSceneResolution();
  let now = 0;
  let ratio = resolution.resize({ width, height, dpr }, now);
  return {
    resolution,
    get now() {
      return now;
    },
    get ratio() {
      return ratio;
    },
    frames(duration, interval) {
      const end = now + duration;
      while (now < end) ratio = resolution.sample((now += interval));
      return ratio;
    },
  };
}

test("uses native DPR 3 on phones while retaining desktop density and the six-million-pixel budget", () => {
  assert.equal(viewport().ratio, 2);
  const phone = viewport(390, 844, 3);
  assert.equal(phone.ratio, 3);
  assert.deepEqual([390 * phone.ratio, 844 * phone.ratio], [1170, 2532]);
  assert.equal(viewport(390, 844, 4).ratio, 3);
  assert.equal(viewport(1440, 900, 2).ratio, 2);
  assert.equal(viewport(1440, 900, 1).ratio, 1);
  for (const [width, height, dpr] of [
    [768, 1024, 3],
    [1920, 1080, 2],
    [1920, 1080, 3],
    [6000, 4000, 3],
  ]) {
    const { ratio } = viewport(width, height, dpr);
    assert.ok(width * height * ratio ** 2 <= 6_000_000 + 1e-6);
    assert.equal(ratio, Math.sqrt(6_000_000 / (width * height)));
  }
});

test("warmup, isolated stalls and a short slowdown do not lower resolution", () => {
  const run = viewport();
  assert.equal(run.frames(1800, 34), 2);
  run.frames(2200, 16);
  run.frames(500, 500);
  assert.equal(run.frames(900, 34), 2);
  assert.equal(run.frames(3000, 16), 2);
  for (let i = 0; i < 6; i++) {
    run.frames(400, 400);
    assert.equal(run.frames(2500, 16), 2);
  }
});

test("sustained slow cadence lowers one step and healthy cadence restores it", () => {
  const run = viewport();
  run.frames(2100, 16);
  assert.equal(run.frames(2200, 34), 1.75);
  assert.equal(run.frames(1700, 34), 1.75);
  assert.equal(run.frames(9500, 16), 2);
});

test("DPR 3 retains warmup and adapts gradually back to native density", () => {
  const run = viewport(390, 844, 3);
  assert.equal(run.frames(1800, 34), 3);
  run.frames(2200, 16);
  assert.equal(run.frames(2200, 34), 2.75);
  assert.equal(run.frames(1700, 34), 2.75);
  assert.equal(run.frames(9500, 16), 3);
});

test("continued load respects the retina floor and can recover every step", () => {
  const run = viewport();
  assert.equal(run.frames(20000, 34), 1.25);
  assert.equal(run.frames(36000, 16), 2);
  const native = viewport(1440, 900, 1);
  assert.equal(native.frames(20000, 34), 1);
  const budgeted = viewport(6000, 4000, 2);
  assert.equal(budgeted.frames(20000, 34), 0.5);
});

test("repeated long frames still count as sustained load", () => {
  const run = viewport();
  assert.ok(run.frames(18000, 150) < 2);
});

test("resume discards hidden time and starts a fresh warmup", () => {
  const run = viewport();
  run.frames(2100, 16);
  run.frames(1500, 34);
  const resumed = run.now + 60000;
  run.resolution.resume(resumed);
  for (let now = resumed; now < resumed + 1900; now += 34)
    assert.equal(run.resolution.sample(now), 2);
  assert.equal(run.resolution.sample(resumed + 2100), 2);
});

test("viewport and DPR changes recompute the ceiling and restart warmup", () => {
  const run = viewport();
  run.frames(4400, 34);
  assert.equal(run.ratio, 1.75);
  const now = run.now;
  assert.equal(
    run.resolution.resize({ width: 623, height: 734, dpr: 2 }, now),
    1.75,
  );
  assert.equal(
    run.resolution.resize({ width: 714, height: 734, dpr: 2 }, now),
    2,
  );
  assert.equal(
    run.resolution.resize({ width: 714, height: 734, dpr: 1 }, now),
    1,
  );
  assert.equal(
    run.resolution.resize({ width: 714, height: 734, dpr: 3 }, now),
    3,
  );
  const budgeted = run.resolution.resize(
    { width: 1920, height: 1080, dpr: 2 },
    now,
  );
  assert.equal(budgeted, Math.sqrt(6_000_000 / (1920 * 1080)));
  for (let time = now; time < now + 1900; time += 34)
    assert.equal(run.resolution.sample(time), budgeted);
});
