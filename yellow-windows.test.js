import test from "node:test";
import assert from "node:assert/strict";
import {
  YELLOW_WINDOWS,
  shutterLeaves,
  yellowWindowButtonRect,
  createYellowWindows,
} from "./yellow-windows.js";
import { SCENE_LIGHTS, lightButtonRect } from "./scene-lighting.js";
import { sceneLayout } from "./scene-model.js";

function fixture(t, images = true) {
  const original = globalThis.document,
    buttons = [];
  globalThis.document = {
    createElement() {
      const attributes = new Map(),
        listeners = new Map();
      return {
        style: {},
        dataset: {},
        setAttribute: (name, value) => attributes.set(name, value),
        getAttribute: (name) => attributes.get(name),
        addEventListener: (name, fn) => listeners.set(name, fn),
        click() {
          if (!this.disabled) listeners.get("click")();
        },
      };
    },
  };
  t.after(() => {
    globalThis.document = original;
  });
  const windows = createYellowWindows({
    stage: { append: (b) => buttons.push(b) },
    day: images ? {} : null,
    night: images ? {} : null,
    announce() {},
    createCanvas: () => ({
      getContext: () => ({
        drawImage() {},
        getImageData: (x, y, w, h) => ({
          data: new Uint8ClampedArray(w * h * 4),
        }),
        putImageData() {},
      }),
    }),
  });
  return { windows, buttons };
}

test("all three yellow windows open and close independently", (t) => {
  const { windows, buttons } = fixture(t);
  assert.equal(buttons.length, 3);
  for (const button of buttons) {
    assert.equal(button.getAttribute("aria-pressed"), "false");
    button.click();
    windows.step(1);
    assert.equal(button.getAttribute("aria-pressed"), "true");
    assert.match(button.getAttribute("aria-label"), /^Close/);
    assert.ok(
      buttons
        .filter((b) => b !== button)
        .every((b) => b.getAttribute("aria-pressed") === "false"),
    );
    button.click();
    windows.step(1);
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.match(button.getAttribute("aria-label"), /^Open/);
  }
});

test("shutter leaves keep their hinges fixed and reveal more of the opening", () => {
  for (const w of YELLOW_WINDOWS) {
    const closed = shutterLeaves(w.quad, 0),
      open = shutterLeaves(w.quad, 1);
    assert.deepEqual(
      closed.map((l) => l.source),
      closed.map((l) => l.target),
    );
    for (const a of [0.1, 0.5, 1]) {
      const leaves = shutterLeaves(w.quad, a);
      assert.deepEqual(leaves[0].target[0], w.quad[0]);
      assert.deepEqual(leaves[0].target[3], w.quad[3]);
      assert.deepEqual(leaves[1].target[1], w.quad[1]);
      assert.deepEqual(leaves[1].target[2], w.quad[2]);
      assert.ok(leaves[0].target[1][0] < leaves[1].target[0][0]);
    }
    assert.ok(open[0].target[1][0] - open[0].target[0][0] < 18);
  }
});

test("window touch targets and their light controls stay separate on mobile and desktop", () => {
  for (const [width, height] of [
    [1280, 800],
    [390, 844],
    [320, 700],
    [844, 390],
  ]) {
    const layout = sceneLayout(width, height);
    for (const w of YELLOW_WINDOWS) {
      const rect = Object.fromEntries(
        Object.entries(yellowWindowButtonRect(w, layout)).map(([k, v]) => [
          k,
          parseFloat(v),
        ]),
      );
      const lamp = Object.fromEntries(
        Object.entries(
          lightButtonRect(
            SCENE_LIGHTS.find((l) => l.id === w.light),
            layout,
          ),
        ).map(([k, v]) => [k, parseFloat(v)]),
      );
      const minimum = layout.portrait ? 24 : 44;
      assert.ok(rect.width >= minimum && rect.height >= minimum);
      assert.ok(
        rect.top >= lamp.top + lamp.height ||
          lamp.top >= rect.top + rect.height ||
          rect.left >= lamp.left + lamp.width ||
          lamp.left >= rect.left + rect.width,
        `${w.id} overlaps light at ${width}`,
      );
    }
  }
});

test("missing scene artwork leaves window controls disabled", (t) => {
  const { buttons } = fixture(t, false);
  assert.ok(buttons.every((b) => b.disabled));
  buttons.forEach((b) => b.click());
  assert.ok(buttons.every((b) => b.getAttribute("aria-pressed") === "false"));
});
