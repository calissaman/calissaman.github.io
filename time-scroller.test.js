import test from "node:test";
import assert from "node:assert/strict";
import { setupTimeScroller } from "./time-scroller.js";

class Element {
  constructor(id = "") {
    this.id = id;
    this.hidden = false;
    this.dataset = {};
    this.attributes = {};
    this.listeners = new Map();
    this.children = new Map();
    this.captures = new Set();
    this.properties = new Map();
    this.style = {
      setProperty: (name, value) => this.properties.set(name, value),
    };
    this.visibleTiles = 7;
    this.height = 476;
  }
  addEventListener(name, listener) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(listener);
  }
  fire(name, values = {}) {
    const event = {
      button: 0,
      pointerId: 1,
      clientY: 338,
      detail: 1,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...values,
    };
    for (const listener of this.listeners.get(name) || []) listener(event);
    return event;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  removeAttribute(name) {
    delete this.attributes[name];
    if (name === "data-dragging") delete this.dataset.dragging;
  }
  querySelector(selector) {
    return this.children.get(selector);
  }
  querySelectorAll(selector) {
    return this.children.get(selector) || [];
  }
  after() {}
  before() {}
  focus() {
    document.activeElement = this;
  }
  setPointerCapture(id) {
    this.captures.add(id);
  }
  hasPointerCapture(id) {
    return this.captures.has(id);
  }
  releasePointerCapture(id) {
    this.captures.delete(id);
    this.fire("lostpointercapture", { pointerId: id });
  }
  getBoundingClientRect() {
    return { top: 100, height: this.height };
  }
  get clientHeight() {
    return this.height;
  }
  set innerHTML(html) {
    if (html.includes("data-time-view=")) {
      this.children.set(
        "button",
        [...html.matchAll(/data-time-view="([^"]+)"/g)].map((match) => {
          const button = new Element();
          button.dataset.timeView = match[1];
          return button;
        }),
      );
      return;
    }
    this.children.set(".breeze-time-rail", new Element("time-panel-breeze"));
    this.children.set(
      ".breeze-time-block-flow",
      [
        ...html.matchAll(/class="breeze-time-block breeze-time-block-flow"/g),
      ].map(() => new Element()),
    );
    if (html.includes("breeze-time-block-center"))
      this.children.set(".breeze-time-block-center", new Element());
    for (const city of ["sg", "sf"]) {
      const clock = new Element();
      for (const selector of [
        "time",
        ".breeze-clock-digits",
        ".breeze-clock-period",
      ])
        clock.children.set(selector, new Element());
      this.children.set(`.breeze-time-${city}`, clock);
    }
  }
}

function fixture(t, reduced = false) {
  const names = [
    "window",
    "document",
    "performance",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
    "ResizeObserver",
  ];
  const originals = Object.fromEntries(
    names.map((name) => [name, globalThis[name]]),
  );
  t.after(() => Object.assign(globalThis, originals));
  const document = new Element();
  const window = new Element();
  const media = new Element();
  media.matches = reduced;
  window.matchMedia = () => media;
  const created = [];
  document.createElement = () => {
    const element = new Element();
    created.push(element);
    return element;
  };
  let now = 1000;
  let cursor = 0;
  const frames = new Map();
  const resizeCallbacks = [];
  Object.assign(globalThis, {
    document,
    window,
    performance: { now: () => now },
    getComputedStyle: (element) => ({
      getPropertyValue: () => String(element.visibleTiles),
    }),
    requestAnimationFrame: (callback) => {
      frames.set(++cursor, callback);
      return cursor;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
    ResizeObserver: class {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
        resizeCallbacks.push(this.callback);
      }
    },
  });
  const panel = new Element("time-panel");
  const range = new Element("environment-time");
  range.value = "720";
  panel.children.set("#environment-time", range);
  panel.children.set(".time-panel-heading", new Element());
  panel.children.set(".city-clocks", new Element());
  const changes = [];
  const api = setupTimeScroller({
    panel,
    onTimeChange(minutes) {
      changes.push(minutes);
      api.update({
        minutes,
        live: false,
        sgMinutes: minutes,
        sfMinutes: minutes - 900,
      });
    },
  });
  const [choices, view] = created;
  return {
    api,
    panel,
    range,
    media,
    document,
    window,
    changes,
    frames,
    rail: view.querySelector(".breeze-time-rail"),
    flow: view.querySelectorAll(".breeze-time-block-flow"),
    center: view.querySelector(".breeze-time-block-center"),
    buttons: choices.querySelectorAll("button"),
    resize() {
      resizeCallbacks.forEach((callback) => callback());
    },
    advance(milliseconds) {
      now += milliseconds;
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((callback) => callback(now));
    },
  };
}

const offset = (tile) => Number(tile.properties.get("--tile-offset"));

test("one-hour wheel changes visibly move reusable tiles and survive paired-clock updates", (t) => {
  const f = fixture(t);
  assert.deepEqual(
    f.buttons.map((button) => button.dataset.timeView),
    ["breeze", "slider"],
  );
  for (const button of f.buttons)
    assert.equal(
      button.attributes["aria-controls"],
      button.dataset.timeView === "breeze"
        ? "time-panel-breeze"
        : "environment-time",
    );
  assert.equal(f.flow.length, 11);
  assert.equal(f.flow.filter((tile) => !tile.hidden).length, 7);
  const tracked = f.flow.find((tile) => offset(tile) === 2);
  f.rail.fire("wheel", { deltaY: -68, deltaMode: 0 });
  assert.equal(f.range.value, "780");
  assert.deepEqual(f.changes, [780]);
  assert.equal(offset(tracked), 2);
  assert.equal(f.frames.size, 1);
  f.advance(140);
  assert.ok(offset(tracked) < 2 && offset(tracked) > 1);
  f.api.update({ minutes: 780, sgMinutes: 780, sfMinutes: -120 });
  assert.ok(
    offset(tracked) > 1,
    "reentrant clock updates must not snap the stream",
  );
  const movingCenter = f.flow.find((tile) => Math.abs(offset(tile)) < 0.5);
  assert.equal(movingCenter.hidden, false);
  assert.ok(Number(movingCenter.properties.get("--tile-scale")) > 0.4);
  f.advance(140);
  assert.equal(offset(tracked), 1);
  assert.equal(f.frames.size, 0);
  assert.equal(f.flow.filter((tile) => !tile.hidden).length, 7);
  const centered = f.flow.find((tile) => offset(tile) === 0);
  assert.equal(Number(centered.properties.get("--tile-scale")), 1);
  assert.equal(
    Number.parseFloat(centered.properties.get("--tile-rotation")),
    0,
  );
  assert.equal(f.center, undefined, "there is no duplicate fixed centre image");
  f.advance(1000);
  assert.equal(f.frames.size, 0);
  assert.deepEqual(f.changes, [780]);
});

test("drag tracks directly and responsive rails retain one-hour steps and edge culling", (t) => {
  const f = fixture(t);
  for (const [count, step] of [
    [5, 140],
    [3, 120],
    [3, 100],
    [3, 70],
  ]) {
    f.api.cancel();
    f.api.update({ minutes: 720 });
    f.rail.visibleTiles = count;
    f.rail.height = count * step;
    f.resize();
    assert.equal(f.flow.filter((tile) => !tile.hidden).length, count);
    const tracked = f.flow.find((tile) => offset(tile) === 1);
    const center = 100 + f.rail.height / 2;
    f.rail.fire("pointerdown", { clientY: center });
    f.rail.fire("pointermove", { clientY: center - step });
    assert.equal(f.range.value, "780");
    assert.equal(offset(tracked), 0);
    assert.equal(Number(tracked.properties.get("--tile-scale")), 1);
    assert.equal(f.frames.size, 0);
    f.rail.fire("pointerup", { clientY: center - step });
    assert.equal(f.rail.captures.size, 0);
    f.api.update({ minutes: 720 });
    f.rail.fire("wheel", { deltaY: -step, deltaMode: 0 });
    assert.equal(f.changes.at(-1), 780);
    f.advance(280);
    assert.equal(f.frames.size, 0);
    for (const tile of f.flow)
      if (Math.abs(offset(tile)) >= count / 2) assert.equal(tile.hidden, true);
  }
});

test("the flowing centre grows upright and shares space at half hours", (t) => {
  const f = fixture(t);
  f.rail.visibleTiles = 3;
  f.rail.height = 138;
  f.resize();
  for (const [minutes, expectedOffsets] of [
    [720, [-1, 0, 1]],
    [750, [-0.5, 0.5]],
    [780, [-1, 0, 1]],
  ]) {
    f.api.update({ minutes });
    const visible = f.flow.filter((tile) => !tile.hidden);
    assert.deepEqual(
      visible
        .map((tile) => Math.round(offset(tile) * 10) / 10)
        .sort((a, b) => a - b),
      expectedOffsets,
    );
    assert.ok(
      visible.every(
        (tile) => Number(tile.properties.get("--tile-opacity")) > 0.7,
      ),
    );
    for (const tile of visible) {
      const distance = Math.abs(offset(tile));
      const scale = Number(tile.properties.get("--tile-scale"));
      const rotation = Number.parseFloat(
        tile.properties.get("--tile-rotation"),
      );
      if (distance === 0) {
        assert.equal(scale, 1);
        assert.equal(rotation, 0);
      }
      if (distance === 1) {
        assert.equal(scale, 0.4);
        assert.equal(rotation, 45);
      }
      if (distance === 0.5) {
        assert.ok(scale > 0.4 && scale < 1);
        assert.ok(rotation > 0 && rotation < 45);
      }
    }
    assert.equal(f.center, undefined);
  }
});

test("rotated tiles retain wide gaps throughout a fractional-hour scroll", (t) => {
  const f = fixture(t);
  for (const [label, count, step, size] of [
    ["desktop", 3, 148, 110],
    ["734px high", 3, 144.67, 82],
    ["mobile", 3, 148, 82],
    ["small phone", 3, 100, 72],
    ["short landscape", 3, 66, 38],
    ["tall five-block panel", 5, 140, 110],
    ["extra-tall seven-block panel", 7, 148, 110],
  ]) {
    f.rail.visibleTiles = count;
    f.rail.height = count * step;
    f.resize();
    for (let part = 0; part <= 120; part++) {
      f.api.update({ minutes: 720 });
      f.rail.fire("wheel", { deltaY: -step, deltaMode: 0 });
      f.advance((1 - Math.cbrt(1 - part / 120)) * 280);
      const visible = f.flow
        .filter((tile) => !tile.hidden)
        .map((tile) => {
          const scale = Number(tile.properties.get("--tile-scale"));
          const angle =
            (Number.parseFloat(tile.properties.get("--tile-rotation")) *
              Math.PI) /
            180;
          return {
            center: offset(tile) * step,
            height:
              size *
              scale *
              (Math.abs(Math.cos(angle)) + Math.abs(Math.sin(angle))),
          };
        })
        .sort((a, b) => a.center - b.center);
      assert.ok(visible.length <= count, `${label}: too many blocks`);
      for (let index = 1; index < visible.length; index++) {
        const current = visible[index],
          previous = visible[index - 1];
        const gap =
          current.center -
          previous.center -
          (current.height + previous.height) / 2;
        assert.ok(
          gap > 35,
          `${label}: ${gap.toFixed(2)}px gap at fraction ${part}/120`,
        );
      }
    }
    f.api.cancel();
  }
});

test("cancel, external changes, view switching and hidden panels stop animation and capture", (t) => {
  const f = fixture(t);
  const start = () => {
    f.api.update({ minutes: 720, city: "singapore", live: false });
    f.rail.fire("wheel", { deltaY: -68, deltaMode: 0 });
    assert.equal(f.frames.size, 1);
  };
  start();
  f.api.cancel();
  assert.equal(f.frames.size, 0);
  f.rail.fire("pointerdown");
  f.rail.fire("pointercancel", { pointerId: 2 });
  assert.equal(f.rail.captures.has(1), true);
  f.api.update({ minutes: 300, city: "san_francisco", live: true });
  assert.equal(f.rail.captures.size, 0);
  const changes = f.changes.length;
  f.rail.fire("pointermove", { clientY: 270 });
  assert.equal(f.changes.length, changes);
  start();
  f.buttons
    .find((button) => button.dataset.timeView === "slider")
    .fire("click");
  assert.equal(f.frames.size, 0);
  assert.equal(document.activeElement, f.range);
  f.buttons
    .find((button) => button.dataset.timeView === "breeze")
    .fire("click");
  start();
  f.document.hidden = true;
  f.document.fire("visibilitychange");
  assert.equal(f.frames.size, 0);
  f.document.hidden = false;
  start();
  f.panel.hidden = true;
  f.advance(16);
  assert.equal(f.frames.size, 0);
  f.panel.hidden = false;
  f.api.update({ minutes: 720 });
  f.rail.fire("wheel", { deltaY: -0.68, deltaMode: 0 });
  f.api.cancel();
  f.rail.fire("wheel", { deltaY: -0.68, deltaMode: 0 });
  assert.equal(
    f.range.value,
    "720",
    "cancel also clears fractional wheel input",
  );
});

test("reduced motion keeps the stream fixed while keyboard and wheel controls remain functional", (t) => {
  const f = fixture(t, true);
  const positions = f.flow.map(offset);
  f.rail.fire("wheel", { deltaY: -68, deltaMode: 0 });
  f.rail.fire("keydown", { key: "ArrowUp" });
  assert.equal(f.range.value, "781");
  assert.deepEqual(f.flow.map(offset), positions);
  assert.equal(f.frames.size, 0);
  f.rail.fire("keydown", { key: "Home" });
  f.rail.fire("keydown", { key: "ArrowDown" });
  assert.equal(f.range.value, "0");
  f.rail.fire("keydown", { key: "End" });
  f.rail.fire("keydown", { key: "ArrowUp" });
  assert.equal(f.range.value, "1439");
  f.api.update({ minutes: 720 });
  f.media.matches = false;
  f.media.fire("change");
  f.rail.fire("wheel", { deltaY: -68, deltaMode: 0 });
  assert.equal(f.frames.size, 1);
  f.media.matches = true;
  f.media.fire("change");
  assert.equal(f.frames.size, 0);
  assert.deepEqual(f.flow.map(offset), positions);
});
