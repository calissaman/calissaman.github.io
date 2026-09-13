import test from "node:test";
import assert from "node:assert/strict";
import {
  KOPI_CUPS,
  NIGHT_TABLE_RECT,
  prepareTableImage,
  tableSettingAt,
  drawTableSetting,
} from "./scene-table.js";

const assets = {
  kopiCup: { id: "coffee", width: 400, height: 320 },
  nightTable: { id: "night", width: 700, height: 250 },
  dayTable: { id: "dayDinner", width: 160, height: 56 },
  unlitTable: { id: "unlitDinner", width: 160, height: 56 },
};

function normalizationFixture(image, alphas = [253]) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++)
    data.set([17, 82, 190, alphas[i % alphas.length]], i * 4);
  const state = {
    reads: 0,
    writes: 0,
    allocations: 0,
    original: data.slice(),
    output: null,
  };
  const canvas = {
    id: image.id,
    getContext() {
      return {
        drawImage(source, x, y) {
          assert.equal(source, image);
          assert.deepEqual([x, y], [0, 0]);
        },
        getImageData(x, y, w, h) {
          state.reads++;
          assert.deepEqual([x, y, w, h], [0, 0, width, height]);
          return { data };
        },
        putImageData(pixels, x, y) {
          state.writes++;
          state.output = pixels.data.slice();
          assert.deepEqual([x, y], [0, 0]);
        },
      };
    },
  };
  return {
    canvas,
    state,
    createCanvas() {
      state.allocations++;
      return canvas;
    },
  };
}

for (const image of Object.values(assets)) {
  const fixture = normalizationFixture(image);
  prepareTableImage(image, fixture.createCanvas);
}

function recorder() {
  const sprites = [],
    strokes = [],
    saved = [];
  let path = [];
  const keys = [
    "globalAlpha",
    "filter",
    "globalCompositeOperation",
    "strokeStyle",
    "lineWidth",
    "lineCap",
  ];
  return {
    sprites,
    strokes,
    globalAlpha: 0,
    filter: "blur(4px)",
    globalCompositeOperation: "multiply",
    strokeStyle: "#123456",
    lineWidth: 7,
    lineCap: "butt",
    save() {
      saved.push(Object.fromEntries(keys.map((key) => [key, this[key]])));
    },
    restore() {
      Object.assign(this, saved.pop());
    },
    drawImage(image, x, y, width, height) {
      sprites.push({
        image,
        x,
        y,
        width,
        height,
        alpha: this.globalAlpha,
        filter: this.filter,
        composite: this.globalCompositeOperation,
      });
    },
    beginPath() {
      path = [];
    },
    moveTo(...point) {
      path.push(point);
    },
    bezierCurveTo(...points) {
      path.push(points);
    },
    stroke() {
      strokes.push({ path, alpha: this.globalAlpha, width: this.lineWidth });
    },
  };
}

test("daytime keeps both kopi cups until the table switches to night drinks", () => {
  for (const [minutes, setting, count] of [
    [0, "night", 1],
    [359.99, "night", 1],
    [360, "coffee", 2],
    [719.99, "coffee", 2],
    [720, "coffee", 2],
    [900, "coffee", 2],
    [1079.99, "coffee", 2],
    [1080, "night", 1],
    [1439.99, "night", 1],
  ]) {
    assert.equal(tableSettingAt(minutes), setting);
    for (const shift of [-2880, -1440, 1440, 2880])
      assert.equal(tableSettingAt(minutes + shift), setting);
    const ctx = recorder();
    drawTableSetting(ctx, assets, { minutes, time: 8 });
    assert.equal(ctx.sprites.length, count);
    assert.ok(ctx.sprites.every((sprite) => sprite.image.id === setting));
    assert.equal(ctx.strokes.length, setting === "coffee" ? 4 : 0);
  }
});

test("preparation makes sprite bodies opaque without changing transparent backgrounds, soft edges or colour", () => {
  const image = { naturalWidth: 4, naturalHeight: 2, width: 40, height: 20 };
  const fixture = normalizationFixture(
    image,
    [0, 1, 128, 239, 240, 252, 253, 255],
  );
  const prepared = prepareTableImage(image, fixture.createCanvas);
  assert.equal(prepared, fixture.canvas);
  assert.deepEqual([prepared.width, prepared.height], [4, 2]);
  assert.deepEqual(
    [...fixture.state.output].filter((_, i) => i % 4 === 3),
    [0, 1, 128, 239, 255, 255, 255, 255],
  );
  for (let i = 0; i < fixture.state.output.length; i++)
    if (i % 4 !== 3)
      assert.equal(fixture.state.output[i], fixture.state.original[i]);
});

test("prepared images are reused across both cups, repeated frames and already prepared inputs", () => {
  const image = { width: 4, height: 2 };
  const fixture = normalizationFixture(image);
  const prepared = prepareTableImage(image, fixture.createCanvas);
  assert.equal(prepareTableImage(image, fixture.createCanvas), prepared);
  assert.equal(prepareTableImage(prepared, fixture.createCanvas), prepared);
  const ctx = recorder();
  for (let time = 0; time < 3; time++)
    drawTableSetting(
      ctx,
      { kopiCup: time === 1 ? prepared : image },
      { minutes: 480, time },
    );
  assert.equal(ctx.sprites.length, 6);
  assert.ok(
    ctx.sprites.every(
      (sprite) => sprite.image === prepared && sprite.alpha === 1,
    ),
  );
  assert.deepEqual(
    [fixture.state.allocations, fixture.state.reads, fixture.state.writes],
    [1, 1, 1],
  );
});

test("solid objects stay opaque despite inherited alpha and restore the shared drawing state", () => {
  for (const minutes of [360, 660, 720, 900, 1079, 1080, 1439]) {
    const ctx = recorder();
    drawTableSetting(ctx, assets, { minutes, time: 2 });
    for (const sprite of ctx.sprites) {
      assert.equal(sprite.alpha, 1);
      assert.equal(sprite.filter, "none");
      assert.equal(sprite.composite, "source-over");
    }
    assert.equal(ctx.globalAlpha, 0);
    assert.equal(ctx.filter, "blur(4px)");
    assert.equal(ctx.globalCompositeOperation, "multiply");
    assert.equal(ctx.strokeStyle, "#123456");
    assert.equal(ctx.lineWidth, 7);
    assert.equal(ctx.lineCap, "butt");
  }
});

test("dinner follows the scene lighting without fading or doubling the dishes", () => {
  for (const [night, expected] of [
    [0, "dayDinner"],
    [0.49, "dayDinner"],
    [0.5, "night"],
    [1, "night"],
  ]) {
    const ctx = recorder();
    drawTableSetting(ctx, assets, { minutes: 1080, time: 0, night });
    assert.equal(ctx.sprites.length, 1);
    assert.equal(ctx.sprites[0].image.id, expected);
    assert.equal(ctx.sprites[0].alpha, 1);
    assert.equal(ctx.sprites[0].composite, "source-over");
  }
});

test("turning off the cafe lights darkens dinner at night without hiding the dishes", () => {
  for (const [night, bistroLight, expected] of [
    [1, 0, "unlitDinner"],
    [1, 1, "night"],
    [0, 0, "dayDinner"],
  ]) {
    const ctx = recorder();
    drawTableSetting(ctx, assets, {
      minutes: 1200,
      time: 0,
      night,
      bistroLight,
    });
    assert.equal(ctx.sprites.length, 1);
    assert.equal(ctx.sprites[0].image.id, expected);
    assert.equal(ctx.sprites[0].alpha, 1);
  }
});

test("the two coffee cups and single night arrangement retain their source proportions", () => {
  const coffee = recorder(),
    night = recorder();
  drawTableSetting(coffee, assets, { minutes: 480, time: 0 });
  drawTableSetting(night, assets, { minutes: 1200, time: 0 });
  for (const [i, sprite] of coffee.sprites.entries()) {
    assert.equal(sprite.x + sprite.width / 2, KOPI_CUPS[i].x);
    assert.equal(sprite.y + sprite.height, KOPI_CUPS[i].baseY);
    assert.equal(sprite.width, KOPI_CUPS[i].width);
    assert.ok(
      Math.abs(
        sprite.height / sprite.width -
          assets.kopiCup.height / assets.kopiCup.width,
      ) < 1e-12,
    );
  }
  assert.ok(
    coffee.sprites[0].x + coffee.sprites[0].width < coffee.sprites[1].x,
  );
  const sprite = night.sprites[0];
  assert.ok(
    Math.abs(
      sprite.width / sprite.height -
        assets.nightTable.width / assets.nightTable.height,
    ) < 1e-12,
  );
  assert.ok(
    sprite.width <= NIGHT_TABLE_RECT.width &&
      sprite.height <= NIGHT_TABLE_RECT.height,
  );
  assert.equal(
    sprite.y + sprite.height,
    NIGHT_TABLE_RECT.y + NIGHT_TABLE_RECT.height,
  );
});

test("afternoon steam rises quietly with simulation time and is static in reduced motion", () => {
  const a = recorder(),
    b = recorder(),
    quietA = recorder(),
    quietB = recorder();
  drawTableSetting(a, assets, { minutes: 900, time: 1.2 });
  drawTableSetting(b, assets, { minutes: 900, time: 2.2 });
  assert.deepEqual(
    a.sprites,
    b.sprites,
    "steam time must not fade or move the cups",
  );
  assert.notDeepEqual(a.strokes, b.strokes);
  for (const [i, stroke] of a.strokes.entries()) {
    const cup = KOPI_CUPS[Math.floor(i / 2)];
    const finalY = stroke.path.at(-1).at(-1);
    assert.ok(cup.steamY - finalY >= 18 && cup.steamY - finalY <= 30);
    assert.ok(stroke.alpha > 0 && stroke.alpha <= 0.25);
  }
  drawTableSetting(quietA, assets, { minutes: 900, time: 0, reduced: true });
  drawTableSetting(quietB, assets, { minutes: 900, time: 200, reduced: true });
  assert.deepEqual(quietA.strokes, quietB.strokes);
  assert.deepEqual(quietA.sprites, quietB.sprites);
  assert.ok(
    quietA.strokes.every((stroke) => stroke.alpha > 0 && stroke.alpha < 0.2),
  );
});

test("a missing optional sprite never draws the other setting", () => {
  const untouched = new Proxy(
    {},
    {
      get() {
        throw new Error("missing sprite touched the canvas");
      },
    },
  );
  drawTableSetting(
    untouched,
    { kopiCup: null, nightTable: assets.nightTable },
    { minutes: 900, time: 0 },
  );
  drawTableSetting(
    untouched,
    { kopiCup: assets.kopiCup, nightTable: null },
    { minutes: 1200, time: 0 },
  );
});
