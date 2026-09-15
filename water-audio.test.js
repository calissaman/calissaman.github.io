import test from "node:test";
import assert from "node:assert/strict";
import { createWaterLoop } from "./water-audio.js";
test("water recording loops continuously without muting either channel", () => {
  const channels = [
    new Float32Array(100).fill(0.3),
    new Float32Array(100).fill(-0.2),
  ];
  const recording = {
    sampleRate: 10,
    length: 100,
    numberOfChannels: 2,
    getChannelData: (i) => channels[i],
  };
  const context = {
    createBuffer: (count, length, rate) => {
      const data = Array.from(
        { length: count },
        () => new Float32Array(length),
      );
      return { length, sampleRate: rate, getChannelData: (i) => data[i] };
    },
  };
  const loop = createWaterLoop(context, recording);
  assert.equal(loop.length, 85);
  for (let c = 0; c < 2; c++)
    for (const value of loop.getChannelData(c))
      assert.ok(Math.abs(value - channels[c][0]) < 0.000001);
});
