import test from "node:test";
import assert from "node:assert/strict";
import { createSceneDetails } from "./scene-details.js";

function fixture(t) {
  const previous = globalThis.document;
  const draws = [],
    canvases = [];
  const ctx = {
    setTransform() {},
    clearRect() {},
    save() {},
    restore() {},
    scale() {},
    translate() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    clip() {},
    fillRect() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    drawImage(image) {
      draws.push({ image, opacity: this.globalAlpha });
    },
  };
  globalThis.document = {
    createElement() {
      return { style: {}, setAttribute() {}, getContext: () => ctx };
    },
  };
  t.after(() => {
    globalThis.document = previous;
  });
  const day = {},
    night = {};
  const details = createSceneDetails({
    stage: {
      append(c) {
        canvases.push(c);
      },
    },
    day,
    night,
  });
  return { details, draws, canvas: canvases[0], day, night };
}

test("stationary architecture only repaints when its visible lighting changes", (t) => {
  const { details, draws, day, night } = fixture(t);
  details.resize({ x: 0, y: 0, scale: 1, portrait: false }, 2);
  for (let frame = 0; frame < 120; frame++) details.draw(0);
  assert.deepEqual(draws, [{ image: day, opacity: 1 }]);
  details.draw(0.0001);
  assert.equal(draws.length, 1);
  details.draw(0.5);
  assert.deepEqual(draws.slice(1), [
    { image: day, opacity: 1 },
    { image: night, opacity: 128 / 255 },
  ]);
});

test("viewport changes redraw sharp details while moving the scene only repositions its layer", (t) => {
  const { details, draws, canvas } = fixture(t);
  details.resize({ x: 0, y: 0, scale: 1, portrait: false }, 2);
  details.draw(0);
  const initialWidth = canvas.width;
  details.resize({ x: 50, y: 10, scale: 1, portrait: false }, 2);
  details.draw(0);
  assert.equal(draws.length, 1);
  assert.equal(canvas.style.left, "460px");
  assert.equal(canvas.width, initialWidth);
  details.resize({ x: -100, y: 200, scale: 0.4, portrait: true }, 3);
  details.draw(0);
  assert.equal(draws.length, 2);
  assert.equal(canvas.width, 1032);
  assert.ok(canvas.width * canvas.height <= 3_000_000);
});
