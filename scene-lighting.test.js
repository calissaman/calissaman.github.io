import test from "node:test";
import assert from "node:assert/strict";
import {
  createSceneLighting,
  SCENE_LIGHTS,
  lightButtonRect,
  unlitPixel,
  flickerIntensity,
} from "./scene-lighting.js";
import { sceneLayout } from "./scene-model.js";

function fixture(t, minutes = 1320) {
  const original = globalThis.document;
  globalThis.document = {
    createElement() {
      const events = {},
        attrs = {};
      return {
        style: {},
        dataset: {},
        setAttribute(k, v) {
          attrs[k] = v;
        },
        getAttribute(k) {
          return attrs[k];
        },
        addEventListener(k, fn) {
          events[k] = fn;
        },
        click() {
          events.click();
        },
      };
    },
  };
  t.after(() => {
    globalThis.document = original;
  });
  const buttons = [],
    notices = [],
    patches = new Map(
      SCENE_LIGHTS.map((light) => [
        light.id,
        [light.id + "-day", light.id + "-night"],
      ]),
    );
  const lighting = createSceneLighting({
    stage: {
      append(b) {
        buttons.push(b);
      },
    },
    patches,
    announce(m) {
      notices.push(m);
    },
  });
  lighting.update(minutes);
  lighting.step(1);
  return {
    lighting,
    buttons,
    notices,
    button(id) {
      return buttons.find((b) => b.dataset.light === id);
    },
  };
}

function painted(lighting, night) {
  const calls = [];
  lighting.draw(
    {
      save() {},
      restore() {},
      drawImage(image) {
        calls.push(image);
      },
    },
    night,
    { time: 0, reduced: true },
  );
  return calls;
}

test("each lamp and window switches independently and restores exactly on the next click", (t) => {
  const f = fixture(t);
  assert.equal(new Set(f.buttons.map((b) => b.dataset.light)).size, 26);
  for (const button of f.buttons) {
    const baseline = painted(f.lighting, 1);
    assert.equal(button.type, "button");
    button.click();
    f.lighting.step(1);
    assert.equal(button.getAttribute("aria-pressed"), "false");
    const id = button.dataset.light + "-night";
    const expected = baseline.includes(id)
      ? baseline.filter((p) => p !== id)
      : [...baseline, id];
    assert.deepEqual(painted(f.lighting, 1).sort(), expected.sort());
    assert.deepEqual(
      painted(f.lighting, 0).sort(),
      expected.map((p) => p.replace(/-night$/, "-day")).sort(),
    );
    assert.ok(
      f.buttons
        .filter((b) => b !== button)
        .every((b) => b.getAttribute("aria-pressed") === "true"),
    );
    button.click();
    f.lighting.step(1);
    assert.deepEqual(painted(f.lighting, 1), baseline);
  }
});

test("street lamps follow the 17:30–04:00 schedule until individually clicked", (t) => {
  const f = fixture(t, 1049);
  const street = f.buttons.filter((b) => b.dataset.light.startsWith("street-"));
  assert.ok(street.every((b) => b.getAttribute("aria-pressed") === "false"));
  f.lighting.update(1050);
  assert.ok(street.every((b) => b.getAttribute("aria-pressed") === "true"));
  street[0].click();
  f.lighting.update(239);
  assert.equal(street[0].getAttribute("aria-pressed"), "false");
  assert.ok(
    street.slice(1).every((b) => b.getAttribute("aria-pressed") === "true"),
  );
  f.lighting.update(240);
  assert.ok(street.every((b) => b.getAttribute("aria-pressed") === "false"));
  street[1].click();
  f.lighting.update(720);
  assert.equal(street[1].getAttribute("aria-pressed"), "true");
});

test("switches retain their chosen state across day and night changes", (t) => {
  const f = fixture(t);
  f.button("blue-upper-left").click();
  f.lighting.update(720);
  f.lighting.step(1);
  assert.deepEqual(
    painted(f.lighting, 0).filter(
      (id) => !id.startsWith("street-") && !id.startsWith("tutu-"),
    ),
    ["blue-upper-left-day"],
  );
  f.lighting.update(1320);
  f.lighting.step(1);
  assert.deepEqual(
    painted(f.lighting, 1).filter((id) => !id.startsWith("tutu-")),
    ["blue-upper-left-night"],
  );
});

test("each tutu kueh lamp loses its glow when switched off and retains that choice through the day", (t) => {
  const f = fixture(t);
  assert.ok(painted(f.lighting, 1).includes("tutu-shelf-night"));
  assert.ok(painted(f.lighting, 1).includes("tutu-counter-night"));
  f.button("tutu-shelf").click();
  for (const minutes of [0, 240, 720, 1080, 1439]) {
    f.lighting.update(minutes);
    f.lighting.step(1);
    assert.equal(f.button("tutu-shelf").getAttribute("aria-pressed"), "false");
    assert.equal(f.button("tutu-counter").getAttribute("aria-pressed"), "true");
    assert.ok(!painted(f.lighting, 0).includes("tutu-shelf-day"));
    assert.ok(painted(f.lighting, 0).includes("tutu-counter-day"));
  }
  f.button("tutu-shelf").click();
  f.lighting.step(1);
  assert.ok(painted(f.lighting, 0).includes("tutu-shelf-day"));
});

test("table lighting follows the bistro fixtures without changing other switches", (t) => {
  const f = fixture(t);
  assert.equal(f.lighting.bistroLight, 1);
  SCENE_LIGHTS.filter((l) => l.bistro).forEach((l) => f.button(l.id).click());
  f.lighting.step(1);
  assert.equal(f.lighting.bistroLight, 0);
  assert.equal(f.button("tower").getAttribute("aria-pressed"), "true");
});

test("warm light pixels dim while blue shutters and dark outlines stay untouched", () => {
  const lit = unlitPixel(255, 219, 100, true);
  assert.equal(lit[3], 255);
  assert.ok(lit[0] < 40 && lit[1] < 50 && lit[2] < 65);
  assert.equal(unlitPixel(32, 120, 191, true)[3], 0);
  assert.equal(unlitPixel(24, 22, 17, true)[3], 0);
});

test("targets follow the artwork at desktop and mobile sizes", () => {
  for (const [width, height] of [
    [1280, 720],
    [390, 600],
  ]) {
    const layout = sceneLayout(width, height);
    for (const light of SCENE_LIGHTS) {
      const [x, y, w, h] = light.target || light.rect;
      const rect = lightButtonRect(light, layout);
      assert.ok(
        Math.abs(
          parseFloat(rect.left) +
            parseFloat(rect.width) / 2 -
            (layout.x + (x + w / 2) * layout.scale),
        ) < 1e-8,
      );
      assert.ok(
        Math.abs(
          parseFloat(rect.top) +
            parseFloat(rect.height) / 2 -
            (layout.y + (y + h / 2) * layout.scale),
        ) < 1e-8,
      );
      assert.ok(parseFloat(rect.width) >= 24 && parseFloat(rect.height) >= 24);
    }
  }
});

function lightFrame(lighting, time, night = 1, reduced = false) {
  const values = new Map();
  const ctx = {
    save() {},
    restore() {},
    drawImage(image) {
      values.set(image, this.globalAlpha);
    },
  };
  lighting.draw(ctx, night, { time, reduced });
  return values;
}

test("every lamp and candle flickers smoothly with its own timing at night", (t) => {
  const f = fixture(t);
  const fixtures = SCENE_LIGHTS.filter((light) => light.flicker);
  assert.deepEqual(
    fixtures.map((light) => light.id),
    [
      "green-wall-lamp",
      "bistro-pendant",
      "tutu-shelf",
      "bistro-candle-left",
      "tutu-counter",
      "street-far-left",
      "street-left",
      "street-middle",
      "street-right",
    ],
  );
  const first = lightFrame(f.lighting, 0);
  const later = lightFrame(f.lighting, 4);
  for (const light of fixtures) {
    assert.notEqual(
      first.get(light.id + "-night"),
      later.get(light.id + "-night"),
    );
    let movement = 0;
    for (let time = 0; time < 24; time += 1 / 60) {
      const value = flickerIntensity(light, time, 1, false);
      const delta = Math.abs(
        value - flickerIntensity(light, time + 1 / 60, 1, false),
      );
      assert.ok(
        value >= (light.flicker === "candle" ? 0.72 : 0.86) && value <= 1,
      );
      assert.ok(delta < 0.02);
      movement += delta;
    }
    assert.ok(movement > 0.1);
  }
  assert.equal(
    new Set(fixtures.map((light) => flickerIntensity(light, 2, 1, false))).size,
    fixtures.length,
  );
  for (const light of SCENE_LIGHTS.filter((light) => !light.flicker))
    assert.equal(flickerIntensity(light, 2, 1, false), 1);
});

test("daytime and reduced-motion lighting stay steady and flicker fades in with night", (t) => {
  const f = fixture(t);
  assert.deepEqual(lightFrame(f.lighting, 0, 0), lightFrame(f.lighting, 9, 0));
  assert.deepEqual(
    lightFrame(f.lighting, 0, 1, true),
    lightFrame(f.lighting, 9, 1, true),
  );
  const lamp = SCENE_LIGHTS.find((light) => light.id === "bistro-pendant");
  const full = flickerIntensity(lamp, 2, 1, false);
  const dusk = flickerIntensity(lamp, 2, 0.5, false);
  assert.ok(dusk > full && dusk < 1);
});

test("switching each flickering fixture off removes its animation and switching on restores it", (t) => {
  const f = fixture(t);
  for (const light of SCENE_LIGHTS.filter((light) => light.flicker)) {
    const image = light.id + "-night";
    f.button(light.id).click();
    f.lighting.step(1);
    assert.equal(f.button(light.id).getAttribute("aria-pressed"), "false");
    assert.equal(
      lightFrame(f.lighting, 0).get(image),
      light.dome ? undefined : 1,
    );
    assert.equal(
      lightFrame(f.lighting, 9).get(image),
      light.dome ? undefined : 1,
    );
    f.button(light.id).click();
    f.lighting.step(1);
    assert.notEqual(
      lightFrame(f.lighting, 0).get(image),
      lightFrame(f.lighting, 9).get(image),
    );
    assert.equal(f.lighting.amountFor(light.id), 1);
  }
});
