import { clamp } from "./scene-model.js?v=20260912-29";
import { streetLightsAt } from "./street-scene.js?v=20260913-43";

// Source-image coordinates keep each switch attached to its actual fixture.
export const SCENE_LIGHTS = [
  { id: "tower", name: "skyscraper lights", rect: [137, 257, 60, 183] },
  { id: "hdb-left", name: "left HDB block lights", rect: [210, 345, 83, 96] },
  { id: "hdb-right", name: "right HDB block lights", rect: [314, 346, 90, 95] },
  {
    id: "green-upper-left",
    name: "left green upstairs window light",
    rect: [480, 297, 55, 130],
  },
  {
    id: "green-upper-right",
    name: "right green upstairs window light",
    rect: [573, 282, 65, 137],
  },
  {
    id: "cream-upper-left",
    name: "left cream upstairs window light",
    rect: [690, 260, 77, 147],
    target: [694, 222, 69, 30],
  },
  {
    id: "cream-upper-right",
    name: "right cream upstairs window light",
    rect: [806, 244, 78, 151],
    target: [810, 204, 69, 32],
  },
  {
    id: "blue-upper-left",
    name: "left blue upstairs window light",
    rect: [973, 220, 80, 156],
    target: [973, 231, 66, 86],
  },
  {
    id: "blue-upper-right",
    name: "right blue upstairs window light",
    rect: [1100, 219, 79, 141],
    target: [1100, 219, 79, 81],
  },
  {
    id: "green-transom-left",
    name: "left green door transom light",
    rect: [490, 535, 58, 37],
  },
  {
    id: "green-transom-right",
    name: "right green door transom light",
    rect: [571, 528, 73, 40],
  },
  {
    id: "green-door-left",
    name: "left green door window light",
    rect: [487, 580, 55, 111],
  },
  {
    id: "green-door-right",
    name: "right green door window light",
    rect: [576, 578, 66, 105],
  },
  {
    id: "green-wall-lamp",
    name: "green shophouse wall lamp",
    flicker: "lamp",
    rect: [464, 603, 30, 59],
    ellipse: true,
  },
  {
    id: "cream-window",
    name: "cream ground-floor window light",
    rect: [703, 578, 72, 101],
    target: [703, 521, 72, 32],
  },
  {
    id: "blue-breeze-block",
    name: "blue breeze-block light",
    rect: [948, 510, 47, 45],
  },
  {
    id: "blue-door-left",
    name: "left blue door window light",
    rect: [958, 558, 28, 140],
    target: [952, 555, 40, 62],
  },
  {
    id: "blue-door-right",
    name: "right blue door window light",
    rect: [990, 559, 23, 139],
    target: [989, 634, 35, 64],
  },
  {
    id: "bistro-pendant",
    name: "bistro pendant lamp",
    flicker: "lamp",
    rect: [1066, 574, 57, 53],
    ellipse: true,
    bistro: true,
  },
  {
    id: "tutu-shelf",
    name: "shelf tutu kueh lamp",
    flicker: "lamp",
    rect: [1147, 598, 35, 33],
    target: [1156, 606, 19, 19],
    dome: [1165, 615, 8, 6],
    bistro: true,
  },
  {
    id: "bistro-candle-left",
    name: "bistro counter candles",
    flicker: "candle",
    rect: [1138, 660, 34, 31],
    bulbs: [
      [1147, 682, 5, 7],
      [1163, 671, 7, 12],
    ],
    hitClipX: [0, 1173],
    ellipse: true,
    bistro: true,
  },
  {
    id: "tutu-counter",
    name: "counter tutu kueh lamp",
    flicker: "lamp",
    rect: [1163, 659, 38, 34],
    target: [1172, 669, 23, 20],
    dome: [1182.5, 677.7, 9, 6],
    hitClipX: [1173, 1536],
    bistro: true,
  },
  ...[
    ["far-left", 55, 617, 71, 96],
    ["left", 126, 627, 78, 128],
    ["middle", 204, 605, 80, 150],
    ["right", 284, 612, 84, 144],
  ].map(([id, x, y, width, height]) => ({
    id: `street-${id}`,
    name: `${id.replace("-", " ")} street lamp`,
    flicker: "lamp",
    rect: [x, y, width, height],
    street: true,
  })),
];

export function flickerIntensity(light, time, night, reduced) {
  if (!light.flicker || reduced || night <= 0) return 1;
  const candle = light.flicker === "candle";
  const phase = light.rect[0] * 0.17 + light.rect[1] * 0.11;
  const t = time * (candle ? 3.7 : 0.95);
  const variation =
    0.5 +
    0.25 * Math.sin(t + phase) +
    0.16 * Math.sin(t * 2.37 + phase * 0.71) +
    0.09 * Math.sin(t * 4.19 + phase * 1.31);
  return 1 - clamp(night, 0, 1) * (candle ? 0.28 : 0.14) * variation;
}

export function lightButtonRect(light, layout) {
  const [x, y, width, height] = light.target || light.rect;
  const w = Math.max(24, width * layout.scale);
  const h = Math.max(24, height * layout.scale);
  const left = layout.x + (x + width / 2) * layout.scale - w / 2;
  return {
    left: `${left}px`,
    top: `${layout.y + (y + height / 2) * layout.scale - h / 2}px`,
    width: `${w}px`,
    height: `${h}px`,
    ...(light.hitClipX && {
      clipPath: `inset(0 ${Math.max(0, left + w - layout.x - light.hitClipX[1] * layout.scale)}px 0 ${Math.max(0, layout.x + light.hitClipX[0] * layout.scale - left)}px)`,
    }),
  };
}

function prepareTutuGlow(image, light, night, createCanvas) {
  const [x, y, width, height] = light.rect;
  const [cx, cy, rx, ry] = light.dome;
  const canvas = createCanvas();
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  for (let py = 0; py < height; py++)
    for (let px = 0; px < width; px++) {
      const i = (py * width + px) * 4;
      const [r, g, b] = pixels.data.slice(i, i + 3);
      const distance = Math.hypot((x + px - cx) / rx, (y + py - cy) / ry);
      const mask =
        clamp((b - 140) / 45, 0, 1) *
        clamp((45 - Math.abs(r - g)) / 18, 0, 1) *
        clamp((1.08 - distance) * 8, 0, 1);
      const shade = 0.85 + ((r + g + b) / (3 * 255)) * 0.15;
      pixels.data.set(
        [
          255 * shade,
          (night ? 223 : 243) * shade,
          (night ? 150 : 205) * shade,
          mask * (night ? 230 : 195),
        ],
        i,
      );
    }
  ctx.putImageData(pixels, 0, 0);
  ctx.globalCompositeOperation = "destination-over";
  const halo = ctx.createRadialGradient(
    cx - x,
    cy - y,
    1,
    cx - x,
    cy - y,
    rx * 2.2,
  );
  halo.addColorStop(0, `rgba(255,203,112,${night ? 0.48 : 0.2})`);
  halo.addColorStop(0.45, `rgba(255,190,94,${night ? 0.18 : 0.07})`);
  halo.addColorStop(1, "rgba(255,190,94,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

export function unlitPixel(r, g, b, night) {
  const warmth =
    clamp((r - b - 18) / 42, 0, 1) *
    clamp((g - b - 5) / 25, 0, 1) *
    clamp((r - 75) / 85, 0, 1);
  const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return night
    ? [
        9 + luminance * 0.11,
        14 + luminance * 0.15,
        20 + luminance * 0.19,
        warmth * 255,
      ]
    : [
        22 + luminance * 0.25,
        29 + luminance * 0.29,
        34 + luminance * 0.31,
        warmth * 255,
      ];
}

export function unlitLampPixel(r, g, b, night, distance) {
  const brightness = (r + g + b) / 3;
  const core =
    clamp((0.36 - distance) * 12, 0, 1) * clamp((brightness - 90) / 90, 0, 1);
  const halo = clamp(1 - distance, 0, 1) * 0.32;
  const neutral = night ? [99, 92, 78] : [171, 161, 143];
  return [
    r * 0.88 * (1 - core) + neutral[0] * core,
    g * 0.86 * (1 - core) + neutral[1] * core,
    b * 0.84 * (1 - core) + neutral[2] * core,
    Math.max(core, halo) * 255,
  ];
}

export function prepareLightPatches(
  { day, night, dayOff, nightOff },
  createCanvas = () => document.createElement("canvas"),
) {
  return new Map(
    SCENE_LIGHTS.map((light) => {
      if (light.dome)
        return [
          light.id,
          [false, true].map((night) =>
            prepareTutuGlow(day, light, night, createCanvas),
          ),
        ];
      const patches = [day, night].map((image, mode) => {
        const [x, y, width, height] = light.rect;
        const canvas = createCanvas();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
        const pixels = ctx.getImageData(0, 0, width, height);
        let streetPixels;
        if (light.street) {
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(
            mode ? nightOff : dayOff,
            x,
            y,
            width,
            height,
            0,
            0,
            width,
            height,
          );
          streetPixels = ctx.getImageData(0, 0, width, height).data;
        }
        for (let py = 0; py < height; py++)
          for (let px = 0; px < width; px++) {
            const i = (py * width + px) * 4;
            if (streetPixels) {
              const changed = [0, 1, 2].some(
                (k) => Math.abs(pixels.data[i + k] - streetPixels[i + k]) > 2,
              );
              pixels.data.set(
                [
                  streetPixels[i],
                  streetPixels[i + 1],
                  streetPixels[i + 2],
                  changed ? 255 : 0,
                ],
                i,
              );
            } else {
              const rgb = pixels.data.slice(i, i + 3);
              const distance = light.bulbs
                ? Math.min(
                    ...light.bulbs.map(([cx, cy, rx, ry]) =>
                      Math.hypot(
                        (x + px + 0.5 - cx) / rx,
                        (y + py + 0.5 - cy) / ry,
                      ),
                    ),
                  )
                : Math.hypot(
                    (px + 0.5 - width / 2) / (width / 2),
                    (py + 0.5 - height / 2) / (height / 2),
                  );
              const rgba = light.ellipse
                ? unlitLampPixel(...rgb, mode === 1, distance)
                : unlitPixel(...rgb, mode === 1);
              const edge = light.ellipse
                ? clamp((1 - distance) * 4, 0, 1)
                : Math.min(
                    1,
                    px / 2,
                    py / 2,
                    (width - 1 - px) / 2,
                    (height - 1 - py) / 2,
                  );
              rgba[3] *= edge;
              pixels.data.set(rgba, i);
            }
          }
        ctx.putImageData(pixels, 0, 0);
        return canvas;
      });
      return [light.id, patches];
    }),
  );
}

export function createSceneLighting({ stage, patches, announce }) {
  let minutes = 720;
  const switches = SCENE_LIGHTS.map((light) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-hotspot scene-light-switch";
    button.dataset.light = light.id;
    const state = {
      light,
      button,
      override: null,
      on: !light.street,
      amount: light.street ? 0 : 1,
    };
    button.addEventListener("click", () => {
      state.override = !state.on;
      sync(state);
      announce(
        `${light.name.charAt(0).toUpperCase() + light.name.slice(1)} switched ${state.on ? "on" : "off"}.`,
      );
    });
    stage.append(button);
    return state;
  });
  function sync(state) {
    state.on =
      state.override ?? (state.light.street ? streetLightsAt(minutes) : true);
    state.button.setAttribute("aria-pressed", String(state.on));
    state.button.setAttribute(
      "aria-label",
      `Turn ${state.on ? "off" : "on"} the ${state.light.name}`,
    );
    state.button.title = `Switch ${state.light.name}`;
  }
  switches.forEach(sync);
  return {
    update(time) {
      minutes = time;
      switches.forEach(sync);
    },
    resize(layout) {
      switches.forEach((state) =>
        Object.assign(state.button.style, lightButtonRect(state.light, layout)),
      );
    },
    step(easing) {
      switches.forEach((state) => {
        state.amount += (Number(state.on) - state.amount) * easing;
      });
    },
    amountFor(id) {
      return switches.find((state) => state.light.id === id).amount;
    },
    get bistroLight() {
      const cafe = switches.filter((state) => state.light.bistro);
      return cafe.reduce((sum, state) => sum + state.amount, 0) / cafe.length;
    },
    get streetLights() {
      return switches.some((state) => state.light.street && state.on);
    },
    draw(ctx, night, { time, reduced }) {
      for (const state of switches) {
        const amount =
          state.amount * flickerIntensity(state.light, time, night, reduced);
        const strength = state.light.dome ? amount : 1 - amount;
        if (strength < 0.001) continue;
        const [dayPatch, nightPatch] = patches.get(state.light.id);
        const [x, y] = state.light.rect;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = strength;
        // The day and night patches share a mask; paint one weighted frame.
        if (night <= 0.001) ctx.drawImage(dayPatch, x, y);
        else if (night >= 0.999) ctx.drawImage(nightPatch, x, y);
        else {
          ctx.globalAlpha = strength * (1 - night);
          ctx.drawImage(dayPatch, x, y);
          ctx.globalAlpha = strength * night;
          ctx.drawImage(nightPatch, x, y);
        }
        ctx.restore();
      }
    },
  };
}
