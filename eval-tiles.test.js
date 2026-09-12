import test from "node:test";
import assert from "node:assert/strict";
import { setupEvalTiles } from "./eval-tiles.js";

class Element {
  constructor() {
    this.dataset = {};
    this.children = new Map();
    this.listeners = new Map();
    this.animations = [];
  }
  querySelector(selector) { return this.children.get(selector); }
  querySelectorAll(selector) { return this.children.get(selector) || []; }
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(listener);
  }
  fire(type) { this.listeners.get(type)?.forEach((listener) => listener()); }
  animate() {
    let resolve, reject;
    const animation = {
      playState: "running",
      finished: new Promise((done, failed) => { resolve = done; reject = failed; }),
      play() { this.playState = "running"; },
      pause() { this.playState = "paused"; },
      finish() { this.playState = "finished"; resolve(); },
      cancel() { this.playState = "idle"; reject(new Error("Canceled")); },
    };
    this.animations.push(animation);
    return animation;
  }
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function fixture(t, reduced = false) {
  const names = ["window", "document", "Image", "IntersectionObserver", "getComputedStyle"];
  const originals = Object.fromEntries(names.map((name) => [name, globalThis[name]]));
  t.after(() => Object.assign(globalThis, originals));
  const document = new Element(), media = new Element();
  document.hidden = false;
  media.matches = reduced;
  const figures = [false, true].map((rows) => {
    const figure = new Element(), panel = new Element(), replay = new Element();
    if (rows) figure.dataset.tileMotion = "rows";
    const tiles = Array.from({ length: rows ? 8 : 12 }, () => {
      const tile = new Element();
      if (rows) tile.children.set(".eval-tile-glint", new Element());
      return tile;
    });
    panel.children.set(".eval-tile", tiles);
    figure.children.set(".eval-tile-panel", panel);
    figure.children.set(".eval-tiles-replay", replay);
    return { figure, panel, replay, tiles, glints: tiles.map((tile) => tile.querySelector(".eval-tile-glint")).filter(Boolean) };
  });
  document.children.set(".eval-tile-art", figures.map(({ figure }) => figure));
  document.querySelector = () => figures[0].figure;
  const observers = new Map(), images = [], timeouts = new Map();
  let timer = 0;
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe(panel) { observers.set(panel, this.callback); }
  }
  Object.assign(globalThis, {
    document,
    window: {
      IntersectionObserver: Observer,
      matchMedia: () => media,
      setTimeout(callback) { timeouts.set(++timer, callback); return timer; },
      clearTimeout(id) { timeouts.delete(id); },
    },
    IntersectionObserver: Observer,
    Image: class {
      constructor() { images.push(this); }
      decode() { return Promise.resolve(); }
    },
    getComputedStyle: () => ({ backgroundImage: 'url("tiles.jpg")' }),
  });
  setupEvalTiles();
  return {
    figures, images, timeouts, media, document,
    visible(index, isVisible = true) {
      observers.get(figures[index].panel)?.([{ isIntersecting: isVisible, intersectionRatio: isVisible ? 0.7 : 0 }]);
    },
    async load(index) { images[index].onload(); await flush(); },
    animations(index) {
      const { tiles, glints } = figures[index];
      return [...tiles, ...glints].flatMap((element) => element.animations).filter((animation) => animation.playState !== "idle");
    },
  };
}

test("both tile panels wait independently for texture and visibility", async (t) => {
  const run = fixture(t), [assembly, rows] = run.figures;
  assert.equal(run.images.length, 2);
  run.visible(0);
  await run.load(1);
  assert.equal(assembly.panel.dataset.assembly, "ready");
  assert.equal(rows.panel.dataset.assembly, "ready");
  await run.load(0);
  assert.equal(assembly.panel.dataset.assembly, "assembling");
  assert.equal(rows.panel.dataset.assembly, "ready");
  run.animations(0).forEach((animation) => animation.finish());
  await flush();
  run.visible(1);
  assert.equal(assembly.panel.dataset.assembly, "assembled");
  assert.equal(rows.panel.dataset.assembly, "assembling");
  rows.tiles.forEach((tile) => tile.animations.at(-1).finish());
  await flush();
  assert.equal(rows.panel.dataset.assembly, "assembling", "glaze sweeps are still running");
  rows.glints.forEach((glint) => glint.animations.at(-1).finish());
  await flush();
  assert.equal(rows.panel.dataset.assembly, "assembled");
});

test("panels pause independently and rapid replay cancels only its own sequence", async (t) => {
  const run = fixture(t), [assembly, rows] = run.figures;
  for (let index = 0; index < 2; index++) { run.visible(index); await run.load(index); }
  run.visible(0, false);
  assert.equal(assembly.panel.dataset.assembly, "paused");
  assert.equal(rows.panel.dataset.assembly, "assembling");
  run.document.hidden = true;
  run.document.fire("visibilitychange");
  assert.ok([0, 1].flatMap((index) => run.animations(index)).every((animation) => animation.playState === "paused"));
  run.visible(0);
  assert.equal(assembly.panel.dataset.assembly, "paused");
  run.document.hidden = false;
  run.document.fire("visibilitychange");
  assert.ok([0, 1].flatMap((index) => run.animations(index)).every((animation) => animation.playState === "running"));
  const other = run.animations(0), previous = run.animations(1);
  rows.replay.fire("click");
  assert.ok(previous.every((animation) => animation.playState === "idle"));
  assert.deepEqual(run.animations(0), other);
  const replaced = run.animations(1);
  rows.replay.fire("click");
  assert.ok(replaced.every((animation) => animation.playState === "idle"));
  await flush();
  assert.equal(rows.panel.dataset.assembly, "assembling");
  run.animations(1).forEach((animation) => animation.finish());
  await flush();
  assert.equal(rows.panel.dataset.assembly, "assembled");
  assert.equal(assembly.panel.dataset.assembly, "assembling");
});

test("reduced motion retains static art and immediately settles both running panels", async (t) => {
  const run = fixture(t, true);
  for (let index = 0; index < 2; index++) { run.visible(index); await run.load(index); }
  for (const { panel, replay } of run.figures) {
    assert.equal(panel.dataset.assembly, "assembled");
    assert.equal(replay.hidden, true);
  }
  assert.equal(run.animations(0).length + run.animations(1).length, 0);
  run.media.matches = false;
  run.media.fire("change");
  run.figures.forEach(({ replay }) => { assert.equal(replay.hidden, false); replay.fire("click"); });
  assert.ok(run.animations(0).length && run.animations(1).length);
  run.media.matches = true;
  run.media.fire("change");
  await flush();
  run.document.fire("visibilitychange");
  for (const { panel, replay } of run.figures) {
    assert.equal(panel.dataset.assembly, "assembled");
    assert.equal(replay.hidden, true);
  }
  assert.equal(run.animations(0).length + run.animations(1).length, 0);
});

test("one texture timeout settles its panel without stranding the other replay", async (t) => {
  const run = fixture(t), [assembly, rows] = run.figures;
  run.visible(0);
  run.visible(1);
  run.timeouts.values().next().value();
  assert.equal(assembly.panel.dataset.assembly, "assembled");
  assert.equal(assembly.replay.hidden, true);
  await run.load(1);
  assert.equal(rows.panel.dataset.assembly, "assembling");
  assert.equal(rows.replay.hidden, false);
  assembly.replay.fire("click");
  assert.equal(run.animations(0).length, 0);
});
