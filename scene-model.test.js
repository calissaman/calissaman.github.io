import test from "node:test";
import assert from "node:assert/strict";
import {
  createSimulation,
  addFlower,
  breakFlower,
  flowerSize,
  addRipple,
  stepSimulation,
  nightAt,
  bloomAt,
  minutesInZone,
  sceneLayout,
  formatMinutes,
  waterCoverage,
  inWater,
  inWaterSurface,
  constrainToWater,
  windowVisitorAt,
  pairedClockMinutes,
} from "./scene-model.js";

test("the blue window visitor follows the evening and overnight schedules", () => {
  for (const [minute, visitor] of [
    [0, "merlion"],
    [299, "merlion"],
    [300, null],
    [1079, null],
    [1080, "otter"],
    [1319, "otter"],
    [1320, "otter"],
    [1379, "otter"],
    [1380, "merlion"],
    [1439, "merlion"],
  ])
    assert.equal(windowVisitorAt(minute), visitor, `minute ${minute}`);
});

test("paired clocks follow the explored hour with seasonal timezone offsets", () => {
  assert.deepEqual(
    pairedClockMinutes(21 * 60, "singapore", new Date("2026-09-12T12:00:00Z")),
    { singapore: 1260, san_francisco: 360 },
  );
  assert.deepEqual(
    pairedClockMinutes(21 * 60, "singapore", new Date("2026-01-12T12:00:00Z")),
    { singapore: 1260, san_francisco: 300 },
  );
  assert.deepEqual(
    pairedClockMinutes(
      23 * 60,
      "san_francisco",
      new Date("2026-09-12T12:00:00Z"),
    ),
    { singapore: 840, san_francisco: 1380 },
  );
});

function artworkWaterCoverage(x, y) {
  // Preserve the artwork calibration independently of the model geometry.
  const fade = (a, b, value) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const px = x / 1536;
  const py = y / 1024;
  const shore = 0.756 + px * 0.1545;
  const belowBanks = Math.max(py - 0.8, 0);
  return (
    fade(shore + 0.005, shore + 0.03, py) *
    fade(0.13 + belowBanks * 0.75, 0.17 + belowBanks * 0.75, px) *
    (1 - fade(0.93 - belowBanks * 0.65, 0.97 - belowBanks * 0.65, px))
  );
}

test("one persistent plant has closed daytime and fully open nighttime states", () => {
  assert.equal(bloomAt(13 * 60), 0);
  assert.equal(bloomAt(1 * 60), 1);
  assert.equal(nightAt(13 * 60), 0);
  assert.equal(nightAt(1 * 60), 1);
  assert.ok(bloomAt(21 * 60) > 0 && bloomAt(21 * 60) < 1);
});
test("time exploration cannot move a dragged flower or change ripple age", () => {
  const sim = createSimulation(),
    f = addFlower(sim, 700, 900);
  f.dragged = true;
  addRipple(sim, 600, 850);
  stepSimulation(sim, 0.02);
  const before = structuredClone(sim);
  for (let minute = 0; minute < 1440; minute++) {
    nightAt(minute);
    bloomAt(minute);
  }
  assert.deepEqual(sim, before);
  stepSimulation(sim, 0.02);
  assert.equal(f.x, 700);
  assert.equal(f.y, 900);
  assert.equal(sim.ripples[0].age, 0.04);
});
test("flower storage grows without overwriting active blooms and reuses retired objects", () => {
  const sim = createSimulation();
  for (let i = 0; i < 400; i++)
    assert.ok(addFlower(sim, 450 + i * 50, 100, true));
  assert.ok(addFlower(sim, 700, 950));
  assert.equal(sim.flowers.filter((f) => f.active).length, 401);
  const retired = sim.flowers[0];
  retired.active = false;
  assert.equal(addFlower(sim, 800, 900), retired);
  assert.equal(sim.flowers.length, 401);
});
test("long stalls are bounded and reduced motion retains manual ripples", () => {
  const sim = createSimulation();
  const f = addFlower(sim, 700, 900);
  addRipple(sim, 600, 850);
  stepSimulation(sim, 300, true);
  assert.equal(sim.time, 0.05);
  assert.equal(f.x, 700);
  assert.equal(f.y, 900);
  assert.equal(sim.ripples[0].age, 0.05);
  for (let i = 0; i < 100; i++) addRipple(sim, i, i);
  assert.equal(sim.ripples.length, 12);
});
test("SG and SF use actual timezone rules through both daylight saving transitions", () => {
  assert.equal(
    minutesInZone(new Date("2026-03-08T09:30:00Z"), "san_francisco"),
    90,
  );
  assert.equal(
    minutesInZone(new Date("2026-03-08T10:30:00Z"), "san_francisco"),
    210,
  );
  assert.equal(
    minutesInZone(new Date("2026-11-01T08:30:00Z"), "san_francisco"),
    90,
  );
  assert.equal(
    minutesInZone(new Date("2026-11-01T09:30:00Z"), "san_francisco"),
    90,
  );
  assert.equal(
    minutesInZone(new Date("2026-03-08T10:30:00Z"), "singapore"),
    1110,
  );
  assert.equal(formatMinutes(0), "12:00 am");
  assert.equal(formatMinutes(720), "12:00 pm");
});
test("common portrait crops protect all three facades, the plant and water", () => {
  for (const [w, h] of [
    [320, 640],
    [375, 667],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
    [2560, 1080],
    [844, 390],
  ]) {
    const heroHeight = Math.max(h, (w * 990) / 1536);
    const l = sceneLayout(w, heroHeight);
    assert.ok(l.x + 410 * l.scale >= 0, `${w}: green facade`);
    assert.ok(l.x + 1220 * l.scale <= w, `${w}: blue facade`);
    assert.ok(l.y + 770 * l.scale < heroHeight, `${w}: Tan Hua`);
    assert.ok(l.y + 950 * l.scale < heroHeight, `${w}: water`);
  }
});

test("portrait and near-square crops retain the right-side fern and hydrangea", () => {
  for (const [w, h] of [
    [320, 640],
    [390, 844],
    [430, 932],
    [768, 1024],
    [714, 734],
    [760, 700],
  ]) {
    const layout = sceneLayout(w, h);
    for (const x of [410, 1220, 701, 744, 1170, 1300]) {
      const screenX = layout.x + x * layout.scale;
      assert.ok(screenX >= 0 && screenX <= w, `${w}×${h}: subject at ${x}`);
    }
    const fernX = layout.x + 1320 * layout.scale;
    assert.ok(fernX >= 10 && fernX <= w - 10, `${w}×${h}: fern margin`);
    for (const y of [770, 950]) {
      const screenY = layout.y + y * layout.scale;
      assert.ok(screenY >= 0 && screenY < h, `${w}×${h}: plant/water at ${y}`);
    }
  }
  for (let aspect = 1.1; aspect <= 1.15; aspect += 0.001) {
    const layout = sceneLayout(320, 320 / aspect);
    const fernX = layout.x + 1320 * layout.scale;
    assert.ok(fernX <= 310, `${aspect}: fern margin during framing blend`);
  }
  const before = sceneLayout(804.999, 700);
  const after = sceneLayout(805.001, 700);
  assert.ok(
    Math.abs(before.x - after.x) < 0.01,
    "framing stays continuous at aspect 1.15",
  );
});

test("accepted water taps stay inside the artwork river mask", () => {
  for (const [x, y] of [
    [270, 900],
    [380, 1000],
    [400, 1000],
  ]) {
    assert.equal(artworkWaterCoverage(x, y), 0);
    assert.equal(inWater(x, y), false, `${x},${y} is on the bank`);
  }
  let accepted = 0;
  for (let x = 180; x <= 1500; x += 11) {
    for (let y = 780; y <= 1024; y += 7) {
      if (!inWater(x, y)) continue;
      accepted++;
      assert.ok(artworkWaterCoverage(x, y) > 0.99, `${x},${y}`);
    }
  }
  assert.ok(accepted > 1000, "the interactive river retains a usable area");
  assert.equal(inWater(500, 950), true);
});

test("portrait water taps reach the visible river below the source image", () => {
  const layout = sceneLayout(390, 844);
  for (const cssY of [layout.y + 970 * layout.scale, 675, 824]) {
    const x = (195 - layout.x) / layout.scale;
    const y = (cssY - layout.y) / layout.scale;
    assert.equal(inWaterSurface(x, y), true, `tap at CSS 195,${cssY}`);
    assert.equal(inWater(x, y), cssY < layout.y + 1024 * layout.scale);
  }
});

test("the extended river spans the viewport while architecture and banks stay excluded", () => {
  for (const x of [-700, 0, 360, 875, 1390, 1536, 2300])
    assert.equal(inWaterSurface(x, 1200), true, `extended river at x=${x}`);
  for (const [x, y] of [
    [700, -10],
    [500, 300],
    [1050, 750],
    [270, 900],
    [400, 1000],
    [1450, 930],
  ])
    assert.equal(
      inWaterSurface(x, y),
      false,
      `architecture or bank at ${x},${y}`,
    );
});

test("river taps remain continuous across the bottom edge of the artwork", () => {
  for (const x of [600, 875, 1100])
    for (let y = 1000; y <= 1040; y += 0.125)
      assert.equal(inWaterSurface(x, y), true, `river seam at ${x},${y}`);
});

test("surface interaction leaves source water coverage and flower boundaries unchanged", () => {
  for (let x = 180; x <= 1500; x += 33)
    for (let y = 780; y <= 1024; y += 13)
      assert.ok(
        Math.abs(waterCoverage(x, y) - artworkWaterCoverage(x, y)) < 1e-12,
      );
  for (const [x, y] of [
    [-1, 950],
    [1537, 950],
    [875, -1],
    [875, 1025],
    [875, 1400],
  ])
    assert.equal(waterCoverage(x, y), 0, `outside source ${x},${y}`);
  for (const point of [
    { x: -700, y: 1200 },
    { x: 875, y: 1500 },
    { x: 2300, y: 1200 },
  ]) {
    assert.equal(inWaterSurface(point.x, point.y), true);
    assert.equal(inWater(point.x, point.y), false);
    const bounded = constrainToWater(point, 25);
    assert.equal(inWater(bounded.x, bounded.y), true);
    assert.ok(bounded.y <= 999);
  }
});

test("dragging beyond any bank returns a point in visible water", () => {
  for (const padding of [0, 8, 25]) {
    for (const x of [-500, 0, 270, 380, 400, 700, 1220, 1500, 2000]) {
      for (const y of [-100, 600, 850, 900, 1000, 1024, 1500]) {
        const point = constrainToWater({ x, y }, padding);
        assert.ok(
          inWater(point.x, point.y),
          JSON.stringify({ x, y, padding, point }),
        );
        assert.ok(artworkWaterCoverage(point.x, point.y) > 0.99);
        assert.deepEqual(constrainToWater(point, padding), point);
        assert.ok(point.y <= 1024 - padding);
      }
    }
  }
});

test("landing preserves position and records the simulation time once", () => {
  const sim = createSimulation();
  const flower = addFlower(sim, 500, 95, true);
  assert.equal(flower.landedAt, null);
  let previous;
  for (let frame = 0; frame < 1800 && flower.falling; frame++) {
    previous = { x: flower.x, y: flower.y };
    stepSimulation(sim, 1 / 60);
  }
  assert.equal(flower.falling, false);
  assert.ok(Math.hypot(flower.x - previous.x, flower.y - previous.y) < 1.2);
  assert.ok(inWater(flower.x, flower.y));
  assert.equal(flower.landedAt, sim.time);
  assert.equal(sim.ripples[0].x, flower.x);
  assert.equal(sim.ripples[0].y, flower.y);
  const landedAt = flower.landedAt;
  stepSimulation(sim, 1 / 60);
  assert.equal(flower.landedAt, landedAt);
  flower.active = false;
  assert.equal(addFlower(sim, 700, 900), flower);
  assert.equal(flower.landedAt, sim.time - 2);
  flower.active = false;
  assert.equal(addFlower(sim, 500, 95, true), flower);
  assert.equal(flower.landedAt, null);
});

test("released and landed flowers remain in the river until retirement", () => {
  const sim = createSimulation();
  const edge = constrainToWater({ x: 380, y: 1000 }, 25);
  const released = addFlower(sim, edge.x, edge.y);
  released.vx = -35;
  released.vy = 12;
  for (const x of [410, 450, 490, 530, 570, 610]) addFlower(sim, x, 95, true);
  const floated = new Set([released.id]);
  for (let frame = 0; frame < 60 * 600; frame++) {
    stepSimulation(sim, 1 / 60);
    for (const flower of sim.flowers) {
      if (!flower.active || flower.falling) continue;
      floated.add(flower.id);
      assert.ok(inWaterSurface(flower.x, flower.y), JSON.stringify(flower));
      if (flower.y < 1024 * 0.94)
        assert.ok(artworkWaterCoverage(flower.x, flower.y) > 0.99);
    }
  }
  assert.equal(floated.size, 7);
  assert.equal(sim.flowers.filter((flower) => flower.active).length, 0);
});

function advanceSimulation(sim, seconds, reduced = false) {
  for (let frame = 0; frame < Math.ceil(seconds * 60); frame++)
    stepSimulation(sim, 1 / 60, reduced);
}

test("breaking captures the displayed flower with one ripple and no duplicate petals", () => {
  const sim = createSimulation();
  const inactive = addFlower(sim, 700, 900);
  inactive.active = false;
  assert.equal(breakFlower(sim, inactive), false);
  assert.equal(sim.rippleCursor, 0);
  const flower = addFlower(sim, 700, 900);
  flower.angle = 0.7;
  flower.dragged = true;
  assert.equal(flowerSize(sim, flower), 49.5);
  assert.equal(breakFlower(sim, flower), true);
  assert.equal(sim.rippleCursor, 1);
  assert.deepEqual(sim.ripples[0], { active: true, x: 700, y: 900, age: 0 });
  assert.equal(flower.fragmentSize, 49.5);
  assert.equal(flower.dragged, false);
  assert.equal(flower.active, true);
  assert.deepEqual(
    flower.petals.map((p) => p.index),
    [0, 1, 2, 3, 4],
  );
  for (const p of flower.petals) {
    assert.equal(p.active, true);
    assert.deepEqual([p.x, p.y, p.angle, p.opacity], [700, 900, 0.7, 1]);
  }
  const before = structuredClone(sim);
  assert.equal(breakFlower(sim, flower), false);
  assert.deepEqual(sim, before);
  advanceSimulation(sim, 0.5);
  assert.equal(sim.rippleCursor, 1);
  assert.equal(flowerSize(sim, flower), 49.5);
});

test("floating petals separate within the river and retire after fading", () => {
  const sim = createSimulation();
  const flower = addFlower(sim, 700, 920);
  breakFlower(sim, flower);
  for (let frame = 0; frame < 4 * 60; frame++) {
    stepSimulation(sim, 1 / 60);
    for (const p of flower.petals) {
      assert.ok(inWater(p.x, p.y));
      assert.ok(artworkWaterCoverage(p.x, p.y) > 0.99);
      assert.ok(p.opacity > 0 && p.opacity <= 1);
    }
  }
  assert.equal(flower.active, true);
  assert.equal(new Set(flower.petals.map((p) => `${p.x},${p.y}`)).size, 5);
  advanceSimulation(sim, 1.2);
  assert.equal(flower.active, false);
  assert.ok(flower.petals.every((p) => !p.active && p.opacity === 0));
});

test("falling petals land in water with one ripple and finish within twenty seconds", () => {
  const sim = createSimulation();
  const flower = addFlower(sim, 500, 100, true);
  assert.equal(flowerSize(sim, flower), 42);
  breakFlower(sim, flower);
  assert.ok(flower.petals.every((p) => p.falling && p.landedAt === null));
  const landed = new Map();
  for (let frame = 0; flower.active && frame < 21 * 60; frame++) {
    stepSimulation(sim, 1 / 60);
    for (const p of flower.petals) {
      assert.ok(p.vy <= 85);
      if (p.landedAt === null) continue;
      if (!landed.has(p.index)) landed.set(p.index, p.landedAt);
      assert.equal(p.landedAt, landed.get(p.index));
      assert.equal(p.falling, false);
      assert.ok(inWater(p.x, p.y));
      assert.ok(artworkWaterCoverage(p.x, p.y) > 0.99);
    }
  }
  assert.equal(landed.size, 5);
  assert.equal(sim.rippleCursor, 1);
  assert.equal(flower.active, false);
  assert.ok(sim.time <= 20.1);
  assert.ok(flower.petals.every((p) => !p.active && p.opacity === 0));
});

test("breakup never blocks new flowers and reused slots reset their petals", () => {
  const sim = createSimulation();
  const flowers = Array.from({ length: 7 }, () => addFlower(sim, 700, 920));
  const petals = [...flowers[0].petals];
  flowers.forEach((f) => breakFlower(sim, f));
  assert.ok(addFlower(sim, 700, 920));
  advanceSimulation(sim, 4);
  assert.ok(addFlower(sim, 700, 920));
  advanceSimulation(sim, 1.2);
  assert.equal(breakFlower(sim, flowers[0]), false);
  const reused = addFlower(sim, 500, 100, true);
  assert.equal(reused, flowers[0]);
  assert.equal(reused.breaking, false);
  assert.equal(reused.fragmentSize, 0);
  for (const [index, p] of reused.petals.entries()) {
    assert.equal(p, petals[index]);
    assert.equal(p.active, false);
    assert.equal(p.age, 0);
    assert.equal(p.opacity, 0);
    assert.equal(p.landedAt, null);
  }
  assert.equal(breakFlower(sim, reused), true);
  assert.equal(reused.fragmentSize, 42);
  assert.ok(
    reused.petals.every((p) => p.x === 500 && p.y === 100 && p.falling),
  );
});

test("petals that cannot reach the river still release their slot after twenty seconds", () => {
  const sim = createSimulation();
  const flower = addFlower(sim, 500, -2000, true);
  breakFlower(sim, flower);
  advanceSimulation(sim, 20.2);
  assert.equal(flower.active, false);
  assert.equal(sim.rippleCursor, 0);
});

test("reduced breakup stays near its origin and retires even if dragging was set", () => {
  for (const falling of [false, true]) {
    const sim = createSimulation();
    const flower = addFlower(sim, 700, falling ? 100 : 920, falling);
    breakFlower(sim, flower, true);
    flower.dragged = true;
    advanceSimulation(sim, 0.5, true);
    assert.equal(flower.active, true);
    for (const p of flower.petals) {
      assert.ok(Math.hypot(p.x - flower.x, p.y - flower.y) < 4);
      assert.equal(p.falling, false);
      assert.ok(p.opacity > 0 && p.opacity < 1);
    }
    advanceSimulation(sim, 0.7, true);
    assert.equal(flower.active, false);
    assert.equal(sim.rippleCursor, falling ? 0 : 1);
  }
});

test("enabling reduced motion during breakup does not leave active fragments", () => {
  const sim = createSimulation();
  const flower = addFlower(sim, 500, 100, true);
  breakFlower(sim, flower);
  advanceSimulation(sim, 0.4);
  const positions = flower.petals.map((p) => ({ x: p.x, y: p.y }));
  advanceSimulation(sim, 0.1, true);
  advanceSimulation(sim, 0.7, false);
  assert.equal(flower.active, false);
  assert.ok(flower.petals.every((p) => !p.active && p.opacity === 0));
  for (const [index, p] of flower.petals.entries())
    assert.ok(
      Math.hypot(p.x - positions[index].x, p.y - positions[index].y) < 5,
    );
});

test("portrait framing keeps both trees and the entire flowering canopy on screen", () => {
  for (const [w, h] of [
    [320, 640],
    [375, 667],
    [390, 844],
    [430, 932],
    [768, 1024],
  ]) {
    const layout = sceneLayout(w, h);
    for (const [x, y] of [
      [0, 0],
      [1536, 0],
      [0, 1024],
      [1536, 1024],
      [138, 442],
      [1480, 500],
    ]) {
      const px = layout.x + x * layout.scale;
      const py = layout.y + y * layout.scale;
      assert.ok(px >= 0 && px <= w, `${w}×${h}: tree/canopy x=${x}`);
      assert.ok(py >= 0 && py <= h, `${w}×${h}: tree/canopy y=${y}`);
    }
  }
});

test("the scene fills the top and both page edges", () => {
  for (const [w, h] of [
    [320, 640],
    [390, 844],
    [768, 1024],
    [1440, 928],
    [2560, 1650],
  ]) {
    const l = sceneLayout(w, h);
    assert.ok(l.x <= 0);
    assert.ok(l.x + 1536 * l.scale >= w);
    assert.ok(l.y <= 0);
  }
});

test("whole flowers drift beyond the mobile water before retiring", () => {
  const sim = createSimulation();
  sim.waterExitY = 2400;
  const flower = addFlower(sim, 1200, 985);
  for (let frame = 0; frame < 60 * 230; frame++) {
    stepSimulation(sim, 1 / 60);
    if (flower.y <= sim.waterExitY + flowerSize(sim, flower))
      assert.equal(flower.active, true);
  }
  assert.equal(flower.active, false);
  assert.ok(flower.y > sim.waterExitY + flowerSize(sim, flower));
});
