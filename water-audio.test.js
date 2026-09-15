import test from "node:test";
import assert from "node:assert/strict";
import { fillWaterChannel } from "./water-audio.js";

test("water audio stays finite, audible, unclipped, and quiet at the loop seam", () => {
  const samples = new Float32Array(48000 * 37);
  let seed = 42;
  fillWaterChannel(samples, 48000, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
  let power = 0;
  for (const sample of samples) {
    assert.ok(Number.isFinite(sample));
    assert.ok(Math.abs(sample) < 1);
    power += sample * sample;
  }
  assert.ok(Math.sqrt(power / samples.length) > 0.01);
  assert.equal(Math.abs(samples[0]), 0);
  assert.equal(Math.abs(samples.at(-1)), 0);
});
