import test from "node:test";
import assert from "node:assert/strict";
import { createGardenVisitor } from "./garden-visitor.js";

function fakeImage({ width = 1024, height = 1024 } = {}) {
  return {
    id: "raccoon",
    naturalWidth: width,
    naturalHeight: height,
  };
}

function fixture(t) {
  const original = globalThis.document;
  const attributes = new Map();
  const listeners = new Map();
  const button = {
    style: {},
    disabled: false,
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    click() {
      if (!this.disabled) listeners.get("click")?.();
    },
  };
  globalThis.document = {
    createElement(tag) {
      assert.equal(tag, "button");
      return button;
    },
  };
  t.after(() => {
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  });
  const announcements = [];
  const children = [];
  const visitor = createGardenVisitor({
    stage: {
      append(child) {
        children.push(child);
      },
    },
    announce(message) {
      announcements.push(message);
    },
  });
  return { visitor, button, listeners, announcements, children };
}

function draw(visitor, night = 0) {
  let path = [];
  let clip = [];
  const saved = [];
  const ctx = {
    draws: [],
    globalAlpha: 0.2,
    filter: "sepia(0.5)",
    globalCompositeOperation: "screen",
    save() {
      saved.push({
        alpha: this.globalAlpha,
        filter: this.filter,
        composite: this.globalCompositeOperation,
        clip,
      });
    },
    restore() {
      const previous = saved.pop();
      this.globalAlpha = previous.alpha;
      this.filter = previous.filter;
      this.globalCompositeOperation = previous.composite;
      clip = previous.clip;
    },
    beginPath() {
      path = [];
    },
    moveTo(x, y) {
      path.push([x, y]);
    },
    lineTo(x, y) {
      path.push([x, y]);
    },
    closePath() {},
    clip() {
      clip = path;
    },
    drawImage(image, x, y, width, height) {
      this.draws.push({
        image,
        x,
        y,
        width,
        height,
        clip,
        alpha: this.globalAlpha,
        filter: this.filter,
        composite: this.globalCompositeOperation,
      });
    },
  };
  visitor.draw(ctx, night);
  assert.equal(saved.length, 0, "canvas save/restore must be balanced");
  assert.equal(ctx.globalAlpha, 0.2);
  assert.equal(ctx.filter, "sepia(0.5)");
  assert.equal(ctx.globalCompositeOperation, "screen");
  return ctx.draws;
}

test("a native button stays fully hidden and disabled until given a loaded image", (t) => {
  const f = fixture(t);
  assert.deepEqual(f.children, [f.button]);
  assert.equal(f.button.type, "button");
  assert.match(f.button.className, /\braccoon-hotspot\b/);
  assert.equal(f.button.style.touchAction, "pan-y");
  assert.deepEqual(
    [...f.listeners.keys()],
    ["click"],
    "native Enter/Space activation needs no duplicate key or pointer handlers",
  );
  assert.equal(f.button.getAttribute("aria-pressed"), "false");
  assert.equal(f.button.disabled, true);
  f.button.click();
  f.visitor.step(100, false);
  assert.equal(draw(f.visitor).length, 0);
  f.visitor.setImage(null);
  f.button.click();
  assert.equal(f.announcements.length, 0);
  assert.equal(f.button.disabled, true);
  f.visitor.setImage(fakeImage());
  assert.equal(f.button.disabled, false);
  f.visitor.step(100, false);
  assert.equal(
    draw(f.visitor).length,
    0,
    "loading alone must never expose the visitor",
  );
});

test("activation rises quietly in about 0.6 seconds, and a second activation fully conceals it", (t) => {
  const f = fixture(t);
  f.visitor.setImage(fakeImage());
  f.button.click();
  assert.equal(f.button.getAttribute("aria-pressed"), "true");
  assert.match(f.button.getAttribute("aria-label"), /^Hide/);
  assert.equal(draw(f.visitor).length, 0);
  let previousY = 715;
  for (let i = 0; i < 6; i++) {
    f.visitor.step(0.1, false);
    const sprite = draw(f.visitor)[0];
    assert.ok(
      sprite.y <= previousY && sprite.y >= 625,
      "rise must be monotonic without overshoot or bounce",
    );
    assert.equal(
      sprite.alpha,
      1,
      "reveal should move opaque fur, not fade it in",
    );
    previousY = sprite.y;
  }
  assert.ok(Math.abs(previousY - 625) < 1e-9);
  f.button.click();
  assert.equal(f.button.getAttribute("aria-pressed"), "false");
  f.visitor.step(0.6, false);
  assert.equal(draw(f.visitor).length, 0);
  assert.equal(f.announcements.length, 2);
  assert.match(f.announcements[0], /peeks out/);
  assert.match(f.announcements[1], /settles back/);
});

test("reduced motion settles reveal and conceal at dt zero, including mid-transition", (t) => {
  const f = fixture(t);
  f.visitor.setImage(fakeImage());
  f.button.click();
  f.visitor.step(0.15, false);
  assert.ok(draw(f.visitor)[0].y > 625);
  f.visitor.step(0, true);
  assert.equal(draw(f.visitor)[0].y, 625);
  f.button.click();
  f.visitor.step(0, true);
  assert.equal(draw(f.visitor).length, 0);
  f.button.click();
  f.visitor.step(0, true);
  assert.equal(draw(f.visitor)[0].y, 625);
});

test("rapid reversal is continuous and a zero-delta resume leaves the current position intact", (t) => {
  const f = fixture(t);
  f.visitor.setImage(fakeImage());
  f.button.click();
  f.visitor.step(0.3, false);
  const halfway = draw(f.visitor)[0].y;
  f.button.click();
  f.visitor.step(0, false);
  assert.equal(draw(f.visitor)[0].y, halfway);
  f.visitor.step(0.1, false);
  assert.ok(draw(f.visitor)[0].y > halfway);
  f.button.click();
  f.visitor.step(0.1, false);
  assert.ok(Math.abs(draw(f.visitor)[0].y - halfway) < 1e-9);
});

test("day/night and resize retain reveal, while target bounds include the head and keep a 44px minimum", (t) => {
  const f = fixture(t);
  f.visitor.setImage(fakeImage());
  f.button.click();
  f.visitor.step(0.6, false);
  const first = draw(f.visitor, 0)[0];
  const second = draw(f.visitor, 1)[0];
  assert.equal(first.x, second.x);
  assert.equal(first.y, second.y);
  assert.notEqual(first.filter, second.filter);
  const layout = { scale: 0.2, x: -35, y: 100 };
  f.visitor.resize(layout);
  assert.equal(f.button.getAttribute("aria-pressed"), "true");
  assert.equal(draw(f.visitor, 0.5)[0].y, first.y);
  const { left, top, width, height } = f.button.style;
  assert.ok(parseFloat(width) >= 44 && parseFloat(height) >= 44);
  assert.ok(
    Math.abs(
      parseFloat(left) +
        parseFloat(width) / 2 -
        (1245 * layout.scale + layout.x),
    ) < 1e-9,
  );
  assert.ok(
    Math.abs(
      parseFloat(top) +
        parseFloat(height) / 2 -
        (726 * layout.scale + layout.y),
    ) < 1e-9,
  );
  assert.ok(
    parseFloat(top) <= 625 * layout.scale + layout.y,
    "the revealed head must remain clickable",
  );
  assert.equal(
    f.announcements.length,
    1,
    "resize and lighting must not reannounce the reveal",
  );
});

test("the body is clipped behind hydrangeas while the head keeps the image proportions", (t) => {
  const f = fixture(t);
  f.visitor.setImage(fakeImage({ width: 1024, height: 768 }));
  f.button.click();
  f.visitor.step(0, true);
  const sprite = draw(f.visitor)[0];
  assert.equal(sprite.x, 1181);
  assert.equal(sprite.y, 625);
  assert.equal(sprite.width, 80);
  assert.equal(sprite.height, 60);
  assert.equal(sprite.composite, "source-over");
  assert.ok(
    sprite.clip.some(([x, y]) => x >= 1220 && x <= 1250 && y < 670),
    "the main blue mophead must occlude the lower face/chest",
  );
  assert.ok(
    sprite.clip.some(([x, y]) => x < 1190 && y > 710),
    "the left edge permits a natural peek alongside the flower cluster",
  );
  assert.ok(
    sprite.clip.every(
      ([x, y]) => x >= 1174 && x <= 1268 && y >= 610 && y <= 718,
    ),
  );
});

test("null resets safely and never leaves a clickable missing visitor", (t) => {
  const f = fixture(t);
  f.visitor.setImage(null);
  f.button.click();
  f.visitor.step(1, false);
  assert.equal(f.button.disabled, true);
  assert.equal(draw(f.visitor).length, 0);
  assert.equal(f.announcements.length, 0);
  const image = fakeImage();
  f.visitor.setImage(image);
  f.button.click();
  f.visitor.step(0, true);
  assert.equal(draw(f.visitor).length, 1);
  f.visitor.setImage(null);
  assert.equal(f.button.disabled, true);
  assert.equal(f.button.getAttribute("aria-pressed"), "false");
  assert.equal(draw(f.visitor).length, 0);
  f.visitor.setImage(fakeImage());
  assert.equal(f.button.disabled, false);
  assert.equal(
    draw(f.visitor).length,
    0,
    "a replacement image starts concealed",
  );
});
