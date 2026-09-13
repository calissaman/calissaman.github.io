import test from "node:test";
import assert from "node:assert/strict";
import { createWindows, prepareMerlionImage } from "./scene-windows.js";

function fixture(t, overrides = {}) {
  const originalDocument = globalThis.document;
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, "button");
      const attributes = new Map(), listeners = new Map();
      return {
        style: {}, dataset: {}, disabled: false,
        setAttribute(name, value) { attributes.set(name, String(value)); },
        getAttribute(name) { return attributes.get(name) ?? null; },
        removeAttribute(name) { attributes.delete(name); },
        addEventListener(name, handler) { listeners.set(name, handler); },
        click() { if (!this.disabled) listeners.get("click")?.({ currentTarget: this }); },
      };
    },
  };
  t.after(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  const children = [], announcements = [];
  const images = {
    closedShutters: { id: "shutters" }, otter: { id: "otter" }, merlion: { id: "merlion" },
    ...overrides,
  };
  const windows = createWindows({
    stage: { append(...elements) { children.push(...elements); } },
    ...images, announce(message) { announcements.push(message); },
  });
  const button = (name) => {
    const found = children.find(element => element.className.split(/\s+/).includes(name));
    assert.ok(found, `missing independent ${name} target`);
    return found;
  };
  return { windows, button, children, announcements };
}

function canvasRecorder() {
  const draws = [], fills = [], saved = [];
  let path = [], clip = [];
  return {
    draws, fills, globalAlpha: 1, filter: "none", fillStyle: "#000000",
    save() { saved.push({ clip, alpha: this.globalAlpha, filter: this.filter, fillStyle: this.fillStyle }); },
    restore() {
      const state = saved.pop();
      clip = state.clip;
      this.globalAlpha = state.alpha;
      this.filter = state.filter;
      this.fillStyle = state.fillStyle;
    },
    beginPath() { path = []; },
    moveTo(x, y) { path.push([x, y]); },
    lineTo(x, y) { path.push([x, y]); },
    rect(x, y, width, height) { path.push([x, y], [x + width, y], [x + width, y + height], [x, y + height]); },
    closePath() {},
    clip() { clip = path.map(point => [...point]); },
    createLinearGradient() { return { addColorStop() {} }; },
    fill() { fills.push({ path, clip, alpha: this.globalAlpha }); },
    fillRect(x, y, width, height) { fills.push({ rect: [x, y, width, height], clip, alpha: this.globalAlpha }); },
    drawImage(image, ...args) {
      const [x, y, width, height] = args.slice(-4);
      draws.push({ id: image.id, x, y, width, height, source: args.length === 8 ? args.slice(0, 4) : null,
        clip, alpha: this.globalAlpha, filter: this.filter });
    },
  };
}

function draw(windows) {
  const ctx = canvasRecorder();
  windows.draw(ctx, 1);
  return ctx;
}

test("Merlion preparation preserves native detail and edge alpha while making its body opaque", () => {
  const alphas = [0, 1, 128, 239, 240, 252, 253, 255];
  const original = new Uint8ClampedArray(alphas.flatMap(alpha => [239, 231, 227, alpha]));
  const image = { naturalWidth: 4, naturalHeight: 2, width: 40, height: 20, pixels: original.slice() };
  let output, reads = 0, writes = 0, allocations = 0;
  const canvas = {
    getContext() {
      return {
        drawImage(source, x, y) {
          assert.equal(source, image);
          assert.deepEqual([x, y], [0, 0]);
        },
        getImageData(x, y, width, height) {
          reads++;
          assert.deepEqual([x, y, width, height], [0, 0, 4, 2]);
          return { data: image.pixels.slice() };
        },
        putImageData(pixels, x, y) {
          writes++;
          output = pixels.data.slice();
          assert.deepEqual([x, y], [0, 0]);
        },
      };
    },
  };
  const prepared = prepareMerlionImage(image, () => { allocations++; return canvas; });
  assert.equal(prepared, canvas);
  assert.notEqual(prepared, image);
  assert.deepEqual([prepared.width, prepared.height], [4, 2]);
  assert.deepEqual(image.pixels, original, "the decoded source remains untouched");
  assert.deepEqual([...output].filter((_, i) => i % 4 === 3), [0, 1, 128, 239, 255, 255, 255, 255]);
  for (let i = 0; i < original.length; i++)
    if (i % 4 !== 3) assert.equal(output[i], original[i]);
  assert.deepEqual([allocations, reads, writes], [1, 1, 1]);
});

test("the Merlion remains opaque through concealed, partial and full reveal", (t) => {
  const f = fixture(t);
  f.windows.update(23 * 60);
  const concealed = draw(f.windows).draws[0];
  assert.equal(concealed.alpha, 1);
  assert.equal(concealed.filter, "none");
  f.button("merlion-window-hotspot").click();
  f.windows.step(0.5);
  const partial = draw(f.windows).draws[0];
  f.windows.step(1);
  const full = draw(f.windows).draws[0];
  assert.ok(concealed.y > partial.y && partial.y > full.y, "revealing moves the plushie out of its recess");
  assert.deepEqual([partial.alpha, full.alpha], [1, 1]);
  assert.deepEqual([partial.filter, full.filter], ["none", "none"]);
  for (const night of [0, 0.5, 1]) {
    const ctx = canvasRecorder();
    ctx.globalAlpha = 0.2;
    ctx.filter = "brightness(0.4)";
    f.windows.draw(ctx, night);
    assert.equal(ctx.draws[0].alpha, 1, "the solid plushie must not inherit another object's opacity");
    assert.equal(ctx.draws[0].filter, "none", "the white fabric retains its original tones");
    assert.equal(ctx.globalAlpha, 0.2);
    assert.equal(ctx.filter, "brightness(0.4)");
  }
});

test("the green shutters, otter and neighboring Merlion each have their own native target", (t) => {
  const f = fixture(t);
  const green = f.button("green-window-hotspot");
  const otter = f.button("blue-window-hotspot");
  const merlion = f.button("merlion-window-hotspot");
  assert.equal(new Set([green, otter, merlion]).size, 3);
  f.windows.resize({ scale: 0.5, x: -20, y: 110 });
  for (const button of [green, otter, merlion]) {
    assert.equal(button.type, "button");
    assert.ok(button.getAttribute("aria-label"));
    assert.equal(button.getAttribute("aria-pressed"), "false");
    assert.ok(parseFloat(button.style.width) > 0 && parseFloat(button.style.height) > 0);
  }
  assert.ok(parseFloat(merlion.style.left) > parseFloat(otter.style.left));
});

test("scheduled visitors draw only in their own openings, including overnight boundaries", (t) => {
  const f = fixture(t);
  for (const [minutes, expected] of [
    [0, "merlion"], [299, "merlion"], [300, null], [1079, null],
    [1080, "otter"], [1319, "otter"], [1320, "otter"], [1379, "otter"],
    [1380, "merlion"], [1439, "merlion"],
  ]) {
    f.windows.update(minutes);
    if (expected) {
      const button = f.button(expected === "otter" ? "blue-window-hotspot" : "merlion-window-hotspot");
      if (button.getAttribute("aria-pressed") !== "true") button.click();
    }
    f.windows.step(1);
    const ctx = draw(f.windows);
    assert.deepEqual(ctx.draws.map(sprite => sprite.id), expected ? [expected] : [], `minute ${minutes}`);
    if (!expected) continue;
    const sprite = ctx.draws[0];
    assert.equal(sprite.x, expected === "otter" ? 1007 : 1101);
    assert.equal(sprite.width, expected === "otter" ? 28 : 27);
    assert.ok(Math.abs(sprite.y + sprite.height - (expected === "otter" ? 374 : 355)) < 1e-9);
    assert.ok(sprite.clip.length >= 3, "the sprite must be clipped to its window");
    const xs = sprite.clip.map(([x]) => x);
    assert.ok(sprite.x >= Math.min(...xs) - 1 && sprite.x + sprite.width <= Math.max(...xs) + 1);
    if (expected === "otter") assert.deepEqual(sprite.source, [33, 25, 324, 298]);
    else {
      assert.equal(sprite.alpha, 1);
      assert.ok(Math.min(...xs) > 1080, "the Merlion must use the neighboring bay clip");
      assert.ok(ctx.fills.length > 0, "the neighboring bay needs its dark recess");
    }
  }
});

test("inactive-window clicks leave the active reveal alone and schedule changes reset it", (t) => {
  const f = fixture(t);
  const otter = f.button("blue-window-hotspot"), merlion = f.button("merlion-window-hotspot");
  f.windows.update(19 * 60);
  otter.click();
  f.windows.step(1);
  const revealedOtter = draw(f.windows).draws;
  merlion.click();
  f.windows.step(1);
  assert.match(f.announcements.at(-1), /quiet/i);
  assert.equal(otter.getAttribute("aria-pressed"), "true");
  assert.equal(merlion.getAttribute("aria-pressed"), "false");
  assert.deepEqual(draw(f.windows).draws, revealedOtter);
  f.windows.update(20 * 60);
  assert.equal(otter.getAttribute("aria-pressed"), "true", "ordinary clock updates retain reveal");
  f.windows.update(23 * 60);
  assert.equal(otter.getAttribute("aria-pressed"), "false");
  assert.equal(merlion.getAttribute("aria-pressed"), "false");
  merlion.click();
  f.windows.step(1);
  const revealedMerlion = draw(f.windows).draws;
  otter.click();
  f.windows.step(1);
  assert.match(f.announcements.at(-1), /quiet/i);
  assert.equal(merlion.getAttribute("aria-pressed"), "true");
  assert.deepEqual(draw(f.windows).draws, revealedMerlion);
  f.windows.update(5 * 60);
  assert.equal(merlion.getAttribute("aria-pressed"), "false");
  f.windows.update(23 * 60);
  assert.equal(merlion.getAttribute("aria-pressed"), "false");
});

test("green shutters still toggle independently of both visitor windows", (t) => {
  const f = fixture(t);
  const green = f.button("green-window-hotspot"), otter = f.button("blue-window-hotspot");
  f.windows.update(19 * 60);
  otter.click();
  green.click();
  f.windows.step(1);
  assert.equal(green.getAttribute("aria-pressed"), "true");
  assert.match(green.getAttribute("aria-label"), /open/i);
  assert.deepEqual(draw(f.windows).draws.map(sprite => sprite.id).sort(), ["otter", "shutters"]);
  green.click();
  f.windows.step(1);
  assert.equal(green.getAttribute("aria-pressed"), "false");
  assert.match(green.getAttribute("aria-label"), /close/i);
  assert.equal(otter.getAttribute("aria-pressed"), "true");
  assert.deepEqual(draw(f.windows).draws.map(sprite => sprite.id), ["otter"]);
});

test("a missing otter image leaves the neighboring Merlion functional", (t) => {
  const f = fixture(t, { otter: null });
  f.windows.update(19 * 60);
  f.button("blue-window-hotspot").click();
  f.windows.step(1);
  assert.equal(f.button("blue-window-hotspot").getAttribute("aria-pressed"), "false");
  assert.deepEqual(draw(f.windows).draws, []);
  f.windows.update(23 * 60);
  f.button("merlion-window-hotspot").click();
  f.windows.step(1);
  assert.deepEqual(draw(f.windows).draws.map(sprite => sprite.id), ["merlion"]);
});

test("missing optional window images never throw or create phantom reveals", (t) => {
  const f = fixture(t, { closedShutters: null, otter: null, merlion: null });
  assert.equal(f.button("green-window-hotspot").disabled, true);
  for (const minutes of [12 * 60, 19 * 60, 23 * 60]) {
    f.windows.update(minutes);
    for (const button of f.children) button.click();
    f.windows.step(1);
    assert.deepEqual(draw(f.windows).draws, []);
    for (const button of f.children) assert.equal(button.getAttribute("aria-pressed"), "false");
  }
});
