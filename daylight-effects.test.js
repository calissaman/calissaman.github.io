import test from "node:test";
import assert from "node:assert/strict";
import { daylightAt, pathContains, glintStrength } from "./daylight-effects.js";

test("sunlight follows the selected daylight hours and fades through dawn and dusk", () => {
  for (const minute of [0, 300, 360, 1140, 1320, 1439])
    assert.equal(daylightAt(minute), 0);
  assert.ok(daylightAt(720) > 0.99);
  assert.ok(daylightAt(420) < daylightAt(480));
  assert.ok(daylightAt(1080) > daylightAt(1110));
  for (let minute = 0; minute < 1440; minute++) {
    assert.ok(daylightAt(minute) >= 0 && daylightAt(minute) <= 1);
    assert.ok(Math.abs(daylightAt(minute + 1) - daylightAt(minute)) < 0.015);
    assert.equal(daylightAt(minute), daylightAt(minute + 1440));
  }
});

test("sun dapples stay on paths and exclude water, planters, and the shophouses", () => {
  for (const [x, y] of [
    [300, 770],
    [500, 790],
    [950, 829],
    [1320, 867],
  ])
    assert.ok(pathContains(x, y), `${x},${y}`);
  for (const [x, y] of [
    [700, 300],
    [1090, 710],
    [700, 800],
    [1250, 850],
    [700, 950],
    [400, 860],
    [1430, 760],
  ])
    assert.equal(pathContains(x, y), false, `${x},${y}`);
});

test("water glints respond to wave slope and evolve smoothly instead of switching on and off", () => {
  let movement = 0,
    response = 0,
    maximumStep = 0;
  for (let i = 0; i < 24; i++) {
    const point = {
      x: 550 + i * 20,
      y: 930 + i * 9,
      phase: i * 0.67,
      speed: 0.8,
    };
    for (let t = 0; t < 12; t += 0.05) {
      const value = glintStrength(point, t);
      assert.ok(value >= 0 && value <= 1);
      maximumStep = Math.max(
        maximumStep,
        Math.abs(value - glintStrength(point, t + 0.05)),
      );
      movement += Math.abs(value - glintStrength(point, t + 2));
      response += Math.abs(value - glintStrength(point, t, 0.18));
    }
  }
  assert.ok(movement > 10);
  assert.ok(response > 10);
  assert.ok(maximumStep < 0.2);
});

test("reduced motion keeps water glints steady even when the ripple field changes", () => {
  const point = { x: 740, y: 960, phase: 1.3, speed: 0.8 };
  const initial = glintStrength(point, 0, 0, true);
  for (const time of [1, 10, 100])
    assert.equal(glintStrength(point, time, 0.3, true), initial);
});
