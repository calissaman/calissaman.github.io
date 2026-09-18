import test from "node:test";
import assert from "node:assert/strict";
import {
  createSimulation,
  stepSimulation,
  inWater,
  addFlower,
} from "./scene-model.js";
import { createTreeBlooms } from "./tree-blooms.js";

function setup(random = () => 0.5, options = {}) {
  const sim = createSimulation();
  return { sim, trees: createTreeBlooms(sim, { random, ...options }) };
}
function advance(sim, trees, seconds, reduced = false) {
  for (let i = 0; i < seconds * 20; i++) {
    stepSimulation(sim, 0.05, reduced);
    trees.step(reduced);
  }
}

test("each tree accepts 88 clicks independently, even during a rapid three-bloom burst", () => {
  const { sim, trees } = setup(() => 0.999);
  for (let i = 0; i < 4; i++) addFlower(sim, 555 + i * 100, 950);
  for (let i = 0; i < 88; i++) {
    assert.deepEqual(trees.release("trumpet"), {
      accepted: true,
      count: 3,
      remaining: 87 - i,
    });
  }
  assert.equal(sim.flowers.filter((f) => f.active).length, 268);
  assert.equal(trees.release("trumpet").accepted, false);
  assert.equal(trees.remaining("angsana"), 88);
  for (let i = 0; i < 88; i++) assert.equal(trees.release("angsana").count, 1);
  assert.equal(trees.yellow.length, 88);
  assert.equal(trees.release("angsana").accepted, false);
});

test("existing blooms never block clicks or automatic falls", () => {
  const { sim, trees } = setup(() => 0.999);
  for (let i = 0; i < 400; i++) addFlower(sim, 700, 940);
  for (let i = 0; i < 88; i++) {
    assert.equal(trees.release("trumpet").count, 3);
    assert.equal(trees.release("angsana").count, 1);
  }
  sim.time = 19;
  trees.step();
  assert.equal(sim.flowers.filter((f) => f.active).length, 667);
  assert.equal(trees.yellow.length, 89);
  assert.equal(trees.remaining("trumpet"), 0);
  assert.equal(trees.remaining("angsana"), 0);
});

test("trumpet groups vary between one, two, and three; angsana always releases one", () => {
  for (const [random, count] of [
    [0.01, 1],
    [0.5, 2],
    [0.99, 3],
  ]) {
    const { trees } = setup(() => random);
    assert.equal(trees.release("trumpet").count, count);
    assert.equal(trees.release("angsana").count, 1);
  }
});

test("trumpet blooms travel continuously from the left canopy into water", () => {
  const { sim, trees } = setup(() => 0.01);
  trees.release("trumpet");
  const f = sim.flowers.find((f) => f.active);
  assert.ok(f.x < 605 && f.y < 340);
  let previous = { x: f.x, y: f.y };
  while (f.falling) {
    stepSimulation(sim, 0.05);
    assert.ok(Math.hypot(f.x - previous.x, f.y - previous.y) < 9);
    previous = { x: f.x, y: f.y };
  }
  assert.ok(inWater(f.x, f.y));
  assert.ok(sim.ripples.some((r) => r.active));
});

test("angsana blooms land on the right ground and retire after resting", () => {
  const { sim, trees } = setup();
  trees.release("angsana");
  const f = trees.yellow[0];
  assert.ok(f.x > 960 && f.y < 225);
  advance(sim, trees, 12);
  assert.equal(f.landed, true);
  assert.ok(f.x >= 1300 && f.x <= 1470);
  assert.ok(!inWater(f.x, f.y));
  assert.ok(f.y >= 823 && f.y <= 853);
  advance(sim, trees, 45);
  assert.ok(!trees.yellow.includes(f));
});

test("automatic releases use separate cadences without spending click allowances", () => {
  const { sim, trees } = setup();
  advance(sim, trees, 8);
  assert.ok(sim.flowers.some((f) => f.active));
  assert.equal(trees.yellow.length, 0);
  advance(sim, trees, 9);
  assert.equal(trees.yellow.length, 1);
  const firstYellow = trees.yellow[0];
  advance(sim, trees, 14);
  assert.equal(trees.yellow.length, 1);
  assert.equal(trees.yellow[0], firstYellow);
  assert.ok(sim.flowers.filter((f) => f.active).length >= 4);
  assert.equal(trees.remaining("trumpet"), 88);
  assert.equal(trees.remaining("angsana"), 88);
});

test("reduced motion suppresses automatic falls and keeps clicked flowers tree-born", () => {
  const { sim, trees } = setup();
  advance(sim, trees, 60, true);
  assert.equal(trees.yellow.length, 0);
  assert.equal(
    sim.flowers.some((f) => f.active),
    false,
  );
  trees.release("trumpet", { reduced: true });
  trees.release("angsana", { reduced: true });
  const trumpet = sim.flowers.find((f) => f.active);
  const angsana = trees.yellow[0];
  assert.ok(trumpet.falling && trumpet.y < 340);
  assert.ok(!angsana.landed && angsana.y < 225);
  advance(sim, trees, 3, true);
  assert.ok(!trumpet.falling && inWater(trumpet.x, trumpet.y));
  assert.equal(angsana.landed, true);
});

test("mobile releases originate in the visible portion of each canopy", () => {
  const { sim, trees } = setup(() => 0.01, {
    getBounds: () => ({ left: 360, right: 1390 }),
  });
  trees.release("trumpet");
  trees.release("angsana");
  assert.ok(sim.flowers.find((f) => f.active).x > 360);
  assert.ok(trees.yellow[0].x < 1390);
});
