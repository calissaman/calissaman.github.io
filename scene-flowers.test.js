import test from "node:test";
import assert from "node:assert/strict";
import { createFlowers, prepareFlowerImage } from "./scene-flowers.js";
import { addFlower, createSimulation, stepSimulation } from "./scene-model.js";

function imageFixture(id, alphas = [0, 128, 252, 253]) {
  return {
    id,
    naturalWidth: alphas.length,
    naturalHeight: 1,
    width: alphas.length * 10,
    height: 10,
    pixels: new Uint8ClampedArray(alphas.flatMap(alpha => [17, 82, 190, alpha])),
  };
}

function preparationCanvas(stats) {
  stats.allocations++;
  let image;
  const canvas = {
    getContext() {
      return {
        drawImage(source) { image = source; canvas.pixels = source.pixels; },
        getImageData(x, y, width, height) {
          stats.reads++;
          assert.deepEqual([x, y, width, height], [0, 0, image.naturalWidth, image.naturalHeight]);
          return { data: image.pixels.slice() };
        },
        putImageData(pixels, x, y) {
          stats.writes++;
          assert.deepEqual([x, y], [0, 0]);
          canvas.pixels = pixels.data.slice();
        },
      };
    },
  };
  return canvas;
}

function fixture(t, reduced = false) {
  const originalDocument = globalThis.document;
  const stats = { allocations: 0, reads: 0, writes: 0 };
  const buttons = [];
  globalThis.document = {
    activeElement: null,
    createElement(tag) {
      if (tag === "canvas") return preparationCanvas(stats);
      assert.equal(tag, "button");
      const listeners = new Map();
      return {
        style: {},
        dataset: {},
        setAttribute() {},
        addEventListener(name, listener) { listeners.set(name, listener); },
        click() { listeners.get("click")({ detail: 0 }); },
      };
    },
  };
  t.after(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  const sim = createSimulation();
  const images = [imageFixture("front"), imageFixture("side")];
  const flowers = createFlowers({
    stage: { append(button) { buttons.push(button); } },
    sim,
    sprites: images.map(image => ({
      image,
      view: image.id,
      crop: [0, 0, image.naturalWidth, image.naturalHeight],
      origin: [0.5, 0.5],
      edges: Array.from({ length: 6 }, (_, i) => i * Math.PI * 2 / 5),
    })),
    sourcePoint: event => ({ x: event.clientX, y: event.clientY }),
    getLayout: () => ({ x: 0, y: 0, scale: 1 }),
    isReduced: () => reduced,
    announce() {},
  });
  return { sim, flowers, images, buttons, stats };
}

function recorder() {
  const draws = [], saved = [];
  return {
    draws,
    globalAlpha: 0.37,
    filter: "none",
    save() { saved.push({ globalAlpha: this.globalAlpha, filter: this.filter }); },
    restore() { Object.assign(this, saved.pop()); },
    translate() {},
    rotate() {},
    scale() {},
    beginPath() {},
    moveTo() {},
    arc() {},
    closePath() {},
    clip() {},
    drawImage(image) { draws.push({ image, alpha: this.globalAlpha, filter: this.filter }); },
  };
}

test("preparation makes body pixels opaque while preserving source data, RGB and antialiased edges", () => {
  const image = imageFixture("flower", [0, 1, 128, 239, 240, 252, 253, 255]);
  const original = image.pixels.slice();
  const stats = { allocations: 0, reads: 0, writes: 0 };
  const prepared = prepareFlowerImage(image, () => preparationCanvas(stats));
  assert.notEqual(prepared, image);
  assert.deepEqual([prepared.width, prepared.height], [8, 1]);
  assert.deepEqual(image.pixels, original);
  assert.deepEqual(
    [...prepared.pixels].filter((_, i) => i % 4 === 3),
    [0, 1, 128, 239, 255, 255, 255, 255],
  );
  for (let i = 0; i < original.length; i++)
    if (i % 4 !== 3) assert.equal(prepared.pixels[i], original[i]);
});

test("both sprite views are prepared once and reused across successive frames", (t) => {
  const f = fixture(t);
  const original = f.images.map(image => image.pixels.slice());
  addFlower(f.sim, 755, 910);
  addFlower(f.sim, 935, 976);
  const first = recorder();
  f.flowers.draw(first, 0);
  const prepared = new Set(first.draws.map(draw => draw.image));
  assert.equal(prepared.size, 2);
  for (const image of prepared) {
    assert.ok(!f.images.includes(image));
    assert.equal(image.pixels[11], 255);
  }
  for (let frame = 0; frame < 12; frame++) {
    stepSimulation(f.sim, 1 / 60);
    const ctx = recorder();
    f.flowers.draw(ctx, frame % 2);
    assert.ok(ctx.draws.every(draw => prepared.has(draw.image)));
  }
  assert.deepEqual(f.stats, { allocations: 4, reads: 2, writes: 2 });
  f.images.forEach((image, i) => assert.deepEqual(image.pixels, original[i]));
});

test("whole flowers remain opaque at birth and maturity, falling or floating, day or night", (t) => {
  const f = fixture(t);
  const flower = addFlower(f.sim, 755, 910);
  flower.appearedAt = 10;
  for (const time of [10, 10.3, 20]) {
    f.sim.time = time;
    for (const falling of [true, false]) {
      flower.falling = falling;
      for (const night of [0, 1]) {
        const ctx = recorder();
        f.flowers.draw(ctx, night);
        assert.deepEqual(ctx.draws.map(draw => draw.alpha), falling ? [1] : [0.16, 1]);
        assert.equal(ctx.globalAlpha, 0.37, "drawing must restore the caller's alpha");
        assert.equal(ctx.filter, "none");
      }
    }
  }
});

test("clicked flowers begin with opaque petals and fade only as the breakup retires", async (t) => {
  for (const reduced of [false, true]) {
    await t.test(reduced ? "reduced motion" : "normal motion", (t) => {
      const f = fixture(t, reduced);
      f.sim.time = 10;
      const flower = addFlower(f.sim, 755, 910);
      flower.appearedAt = f.sim.time;
      f.buttons[flower.id].click();
      assert.equal(f.buttons[flower.id].hidden, true);
      const initial = recorder();
      f.flowers.draw(initial, 0);
      assert.deepEqual(initial.draws.map(draw => draw.alpha), [1, 1, 1, 1, 1]);
      const halfLifetime = reduced ? 0.5 : 2.5;
      for (let i = 0; i < halfLifetime * 60; i++) stepSimulation(f.sim, 1 / 60, reduced);
      for (const night of [0, 1]) {
        const midway = recorder();
        f.flowers.draw(midway, night);
        assert.equal(midway.draws.length, 5);
        assert.ok(midway.draws.every(draw => Math.abs(draw.alpha - 0.5) < 1e-9));
      }
      for (let i = 0; i < (halfLifetime + 0.1) * 60; i++) stepSimulation(f.sim, 1 / 60, reduced);
      const retired = recorder();
      f.flowers.draw(retired, 0);
      assert.deepEqual(retired.draws, []);
    });
  }
});

test("night mode preserves the solid flower's petal colours while falling and floating", (t) => {
  const f = fixture(t);
  const flower = addFlower(f.sim, 755, 910);
  for (const falling of [true, false]) {
    flower.falling = falling;
    const day = recorder();
    const night = recorder();
    f.flowers.draw(day, 0);
    f.flowers.draw(night, 1);
    assert.equal(night.draws.at(-1).filter, day.draws.at(-1).filter);
    assert.equal(night.draws.at(-1).alpha, 1);
    assert.equal(day.draws.at(-1).alpha, 1);
  }
});
