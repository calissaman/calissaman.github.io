import test from "node:test";
import assert from "node:assert/strict";
import { MORNING_GLORY_BLOOMS, morningGloryAt, drawMorningGlory } from "./morning-glory.js";

test("morning glories follow the selected six-to-noon lifecycle", () => {
  for (const [minute, expected] of [
    [0, 0], [359, 0], [360, 0], [390, 0.5], [420, 1],
    [540, 1], [600, 1], [660, 0.5], [720, 0], [1439, 0],
  ]) assert.equal(morningGloryAt(minute), expected, `selected minute ${minute}`);
  for (let minute = 360; minute < 420; minute++)
    assert.ok(morningGloryAt(minute + 1) >= morningGloryAt(minute));
  for (let minute = 600; minute < 720; minute++)
    assert.ok(morningGloryAt(minute + 1) <= morningGloryAt(minute));
  for (const minute of [360, 420, 600, 720])
    assert.ok(Math.abs(morningGloryAt(minute - 0.01) - morningGloryAt(minute + 0.01)) < 1e-6);
});

test("day wrapping and negative selected minutes retain the same lifecycle", () => {
  for (const minute of [0, 360, 390, 420, 660, 720, 1439])
    for (const days of [-3, -1, 1, 3])
      assert.equal(morningGloryAt(minute + days * 1440), morningGloryAt(minute));
});

function recorder() {
  const draws = [];
  const saved = [];
  const ctx = {
    draws, globalAlpha: 0.7, filter: "none", x: 0, y: 0, sx: 1, sy: 1, angle: 0,
    save() {
      saved.push(Object.fromEntries(["globalAlpha", "filter", "x", "y", "sx", "sy", "angle"].map(key => [key, this[key]])));
    },
    restore() { Object.assign(this, saved.pop()); },
    translate(x, y) { this.x += x; this.y += y; },
    rotate(angle) { this.angle += angle; },
    scale(x, y) { this.sx *= x; this.sy *= y; },
    drawImage(image, x, y, width, height) {
      draws.push({ image, x: this.x, y: this.y, angle: this.angle, width: width * this.sx,
        height: height * this.sy, alpha: this.globalAlpha, filter: this.filter,
        centered: x === -width / 2 && y === -height / 2 });
    },
  };
  return ctx;
}

test("closed or unavailable flowers leave the shared canvas untouched", () => {
  const untouched = new Proxy({}, { get() { throw new Error("closed decoration touched the canvas"); } });
  drawMorningGlory(untouched, null, 1, 0);
  for (const openness of [0, -1, 0.0001])
    drawMorningGlory(untouched, { width: 512, height: 512 }, openness, 0);
});

test("isolated sprite blooms unfold at fixed anchors without leaking canvas state", () => {
  const image = { width: 512, height: 384 };
  const open = recorder(), partial = recorder();
  drawMorningGlory(open, image, 1, 0);
  drawMorningGlory(partial, image, 0.5, 0.5);
  assert.equal(open.draws.length, 5);
  for (let i = 0; i < MORNING_GLORY_BLOOMS.length; i++) {
    const anchor = MORNING_GLORY_BLOOMS[i];
    const full = open.draws[i], unfolding = partial.draws[i];
    assert.deepEqual([full.x, full.y, full.angle], [anchor.x, anchor.y, anchor.angle]);
    assert.deepEqual([unfolding.x, unfolding.y], [full.x, full.y]);
    assert.ok(full.centered && unfolding.centered);
    assert.equal(full.width, anchor.size);
    assert.equal(full.height / full.width, image.height / image.width);
    assert.ok(unfolding.width < full.width && unfolding.height < full.height);
    assert.ok(unfolding.alpha > 0 && unfolding.alpha < full.alpha);
  }
  for (const ctx of [open, partial]) {
    assert.equal(ctx.globalAlpha, 0.7);
    assert.equal(ctx.filter, "none");
    assert.deepEqual([ctx.x, ctx.y, ctx.sx, ctx.sy, ctx.angle], [0, 0, 1, 1, 0]);
  }
  const repeated = recorder();
  drawMorningGlory(repeated, image, 1, 0);
  assert.deepEqual(repeated.draws, open.draws, "paused or repeated draws must remain static");
});
