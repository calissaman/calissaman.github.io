import test from "node:test";
import assert from "node:assert/strict";
import { streetLightsAt } from "./street-scene.js";

test("street lamps light at 17:30 and switch off at 04:00", () => {
  for (const [minute, lit] of [
    [0, true],
    [239, true],
    [240, false],
    [720, false],
    [1049, false],
    [1050, true],
    [1439, true],
  ]) {
    assert.equal(streetLightsAt(minute), lit, `minute ${minute}`);
  }
});

test("renderer swaps lamp textures both ways without replacing images with the night amount", async () => {
  const { createRenderer } = await import("./scene-renderer.js");
  const day = { name: "day off" },
    night = { name: "night off" };
  const dayOn = { name: "day on" },
    nightOn = { name: "night on" };
  const uploads = [];
  const gl = new Proxy(
    {
      texImage2D(...args) {
        if (args.length === 6) {
          assert.ok([day, night, dayOn, nightOn].includes(args[5]));
          uploads.push(args[5].name);
        }
      },
    },
    {
      get(target, key) {
        if (key in target) return target[key];
        if (/^[A-Z_0-9]+$/.test(key)) return 1;
        return () => true;
      },
    },
  );
  const renderer = createRenderer(
    { getContext: () => gl, width: 100, height: 100 },
    day,
    night,
    { dayOn, nightOn },
  );
  const frame = {
    width: 100,
    height: 100,
    layout: { x: 0, y: 0, scale: 1 },
    time: 0,
    night: 0.8,
    reduced: false,
    lights: [1, 1],
    waterField: {
      width: 1,
      height: 1,
      revision: 0,
      pixels: new Uint8Array(4),
      left: 0,
      top: 0,
      spanWidth: 100,
      spanHeight: 100,
    },
  };
  renderer.render({ ...frame, streetLights: true });
  renderer.render({ ...frame, streetLights: false });
  renderer.render({ ...frame, streetLights: false });
  assert.deepEqual(uploads, [
    "day off",
    "night off",
    "day on",
    "night on",
    "day off",
    "night off",
  ]);
});
