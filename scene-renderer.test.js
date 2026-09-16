import test from "node:test";
import assert from "node:assert/strict";
import { SCENE, inWater, sceneLayout } from "./scene-model.js";
import {
  WATER_REFLECTION,
  waterReflectionPoint,
  drawWaterFallback,
} from "./scene-renderer.js";

function canvasRecorder() {
  const draws = [];
  const ellipses = [];
  const clips = [];
  const stack = [];
  let path = [];
  let transform = { x: 0, y: 0, sx: 1, sy: 1, clipDepth: 0 };
  return {
    draws,
    ellipses,
    clips,
    globalAlpha: 1,
    save() {
      stack.push({ ...transform, alpha: this.globalAlpha });
    },
    restore() {
      const { alpha, ...previous } = stack.pop();
      transform = previous;
      this.globalAlpha = alpha;
    },
    translate(x, y) {
      transform.x += x * transform.sx;
      transform.y += y * transform.sy;
    },
    scale(x, y) {
      transform.sx *= x;
      transform.sy *= y;
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
      clips.push(path);
      transform.clipDepth++;
    },
    quadraticCurveTo() {},
    stroke() {},
    ellipse(...args) {
      ellipses.push(args);
    },
    drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh) {
      const xs = [
        transform.x + dx * transform.sx,
        transform.x + (dx + dw) * transform.sx,
      ];
      const ys = [
        transform.y + dy * transform.sy,
        transform.y + (dy + dh) * transform.sy,
      ];
      draws.push({
        image,
        source: [sx, sy, sw, sh],
        alpha: this.globalAlpha,
        clipped: transform.clipDepth > 0,
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.min(...ys),
        bottom: Math.max(...ys),
      });
    },
  };
}

function draw({
  width = 390,
  height = 844,
  assetScale = 1,
  night = 0.6,
  reduced = false,
} = {}) {
  const ctx = canvasRecorder();
  const layout = sceneLayout(width, height);
  const day = {
    id: "day",
    width: SCENE.width * assetScale,
    height: SCENE.height * assetScale,
  };
  const nightImage = { ...day, id: "night" };
  drawWaterFallback(ctx, {
    day,
    nightImage,
    layout,
    width,
    height,
    time: 32,
    night,
    reduced,
    ripples: [{ x: 875, y: 1300, active: true, age: 0.8 }],
  });
  return { ctx, layout, width, height };
}

test("foreground reflections sample clear source water at every depth and motion setting", () => {
  for (const reduced of [false, true]) {
    for (const time of [0, 2, 32, 200, Math.PI * 200, 10000]) {
      for (let y = WATER_REFLECTION.blendStart; y <= 2600; y += 19) {
        for (let x = -250; x <= 1900; x += 79) {
          const point = waterReflectionPoint(x, y, time, reduced);
          assert.ok(
            point.x >= WATER_REFLECTION.left &&
              point.x <= WATER_REFLECTION.right,
          );
          assert.ok(
            point.y >= WATER_REFLECTION.top &&
              point.y <= WATER_REFLECTION.bottom,
          );
          assert.ok(
            inWater(point.x, point.y),
            `sample ${point.x}, ${point.y} crossed a bank`,
          );
        }
      }
    }
  }
});

test("fallback joins the photo to the extended river with mirrored edge strips", () => {
  for (const reduced of [false, true]) {
    const { ctx, layout, width, height } = draw({ reduced });
    const mirrored = ctx.draws.filter(
      ({ source, clipped, top }) =>
        source[0] === 0 && !clipped && top >= SCENE.height,
    );
    assert.ok(mirrored.length > 0, "the source edge must continue below the photo");
    const left = -layout.x / layout.scale;
    const right = (width - layout.x) / layout.scale;
    const bottom = (height - layout.y) / layout.scale;
    const rows = Map.groupBy(mirrored, (photo) => photo.top);
    let coveredTo = SCENE.height;
    for (const [top, strips] of rows) {
      assert.ok(
        Math.abs(top - coveredTo) < 1e-8,
        "the mirrored edge has a horizontal gap",
      );
      assert.ok(Math.min(...strips.map((s) => s.left)) <= left);
      assert.ok(Math.max(...strips.map((s) => s.right)) >= right);
      coveredTo = strips[0].bottom;
      for (const { source: [sx, sy, sw, sh] } of strips) {
        assert.equal(sx, 0);
        assert.equal(sw, SCENE.width);
        assert.ok(sy >= 0 && sy + sh <= SCENE.height);
      }
    }
    assert.ok(
      Math.abs(
        coveredTo -
          Math.min(bottom, SCENE.height + WATER_REFLECTION.edgeBlendDepth),
      ) < 1e-8,
    );
    const first = rows.values().next().value;
    assert.ok(
      first.every(({ source: [, sy, , sh] }) => sy + sh === SCENE.height),
      "the first extension row must sample the photo's exact bottom edge",
    );
    assert.equal(
      ctx.globalAlpha,
      1,
      "the water renderer must restore canvas state",
    );
    assert.ok(
      ctx.clips[0].every(([, y]) => y > 800),
      "the draw clip must exclude the architecture",
    );
  }
});

test("the continuation preserves the day/night mix and high resolution source coordinates", () => {
  const original = draw().ctx.draws;
  const highResolution = draw({ assetScale: 2 }).ctx.draws;
  assert.equal(original.length, highResolution.length);
  original.forEach((photo, i) => {
    const high = highResolution[i];
    assert.deepEqual(
      high.source,
      photo.source.map((value) => value * 2),
    );
    for (const key of ["left", "right", "top", "bottom", "alpha"])
      assert.equal(high[key], photo[key]);
  });
  const mirrored = original.filter(
    ({ source, clipped, top }) =>
      source[0] === 0 && !clipped && top >= SCENE.height,
  );
  assert.ok(mirrored.length > 0);
  for (let i = 0; i < mirrored.length; i += 2) {
    assert.equal(mirrored[i].alpha, 1);
    assert.equal(mirrored[i + 1].alpha, 0.6);
  }
});

test("continued water fades in gradually after the mirrored edge", () => {
  const { ctx, layout, width } = draw();
  const water = ctx.draws.filter(
    ({ source, clipped }) => source[0] > 0 && !clipped,
  );
  assert.ok(water.length > 0);
  const rows = Map.groupBy(water, (photo) => photo.top);
  let previousBlend = 0;
  let coveredTo = SCENE.height;
  for (const [top, strips] of rows) {
    assert.equal(top, coveredTo);
    assert.ok(top >= SCENE.height);
    assert.ok(
      Math.min(...strips.map((s) => s.left)) <= -layout.x / layout.scale,
    );
    assert.ok(
      Math.max(...strips.map((s) => s.right)) >=
        (width - layout.x) / layout.scale,
    );
    const day = strips[0],
      night = strips[1];
    const blend = night.alpha + day.alpha * (1 - night.alpha);
    assert.ok(blend >= previousBlend && blend - previousBlend < 0.12);
    previousBlend = blend;
    coveredTo = strips[0].bottom;
  }
  assert.ok(coveredTo > SCENE.height + WATER_REFLECTION.edgeBlendDepth);
  assert.ok(
    previousBlend > 0.99,
    "the repeated water must fully replace the mirrored edge",
  );
});

test("the extended reflection bends stay gentle at phone scale", () => {
  const x = (WATER_REFLECTION.left + WATER_REFLECTION.right) / 2;
  const scale = sceneLayout(390, 844).scale;
  for (let y = WATER_REFLECTION.blendStart; y < 2600; y += 3) {
    const sample = waterReflectionPoint(x, y, 0);
    assert.ok(
      Math.abs(sample.x - x) * scale < 12,
      `reflection bends too far at ${y}`,
    );
  }
});

test("a landscape already filled by the source photo does not get a foreground wash", () => {
  for (const night of [0, 0.5, 1]) {
    const { ctx, layout, height } = draw({ width: 1440, height: 900, night });
    assert.ok((height - layout.y) / layout.scale <= SCENE.height);
    assert.ok(ctx.draws.length > 0);
    assert.ok(ctx.draws.every(({ source }) => source[0] === 0));
    assert.ok(ctx.draws.every(({ bottom }) => bottom <= SCENE.height));
  }
});
