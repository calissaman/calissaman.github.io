import {
  clamp,
  smooth,
  shoreline,
  inWaterSurface,
} from "./scene-model.js?v=20260919-128";

const PATHS = [
  [
    [134, 730],
    [230, 739],
    [415, 764],
    [425, 806],
    [182, 780],
    [115, 762],
  ],
  [
    [425, 767],
    [920, 799],
    [1260, 820],
    [1390, 846],
    [1390, 909],
    [1260, 884],
    [920, 844],
    [425, 818],
  ],
];
const PLANTERS = [
  [679, 730, 102, 85],
  [1199, 722, 107, 143],
];

export function daylightAt(minutes) {
  const hour = (((minutes % 1440) + 1440) % 1440) / 60;
  return (
    smooth(6, 8, hour) *
    (1 - smooth(17, 19, hour)) *
    (0.7 + 0.3 * Math.max(0, Math.sin(((hour - 6) / 13) * Math.PI)))
  );
}

function inside(points, x, y) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i],
      [bx, by] = points[j];
    if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax)
      result = !result;
  }
  return result;
}

export function pathContains(x, y) {
  return (
    y < shoreline(x) - 9 &&
    PATHS.some((points) => inside(points, x, y)) &&
    !PLANTERS.some(
      ([px, py, width, height]) =>
        x >= px && x <= px + width && y >= py && y <= py + height,
    )
  );
}

function randomSource(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function glintStrength(
  { x, y, phase, speed },
  time,
  slope = 0,
  reduced = false,
) {
  const t = reduced ? 0 : time;
  const wave = (y / 1024) * 265 + t * 1.25 + (x / 1536) * 7;
  const crest = Math.sin(wave + phase + (reduced ? 0 : slope * 9));
  const flicker = Math.pow(Math.max(0, Math.sin(t * speed + phase)), 6);
  return Math.pow(Math.max(0, crest), 3) * flicker * (reduced ? 0.45 : 1);
}

export function createDaylightEffects(
  createCanvas = () => document.createElement("canvas"),
) {
  const random = randomSource(0x6b6f6d6f);
  const dapples = [];
  for (let attempt = 0; attempt < 2500 && dapples.length < 110; attempt++) {
    const x = 125 + random() * 1260,
      y = 737 + random() * 167;
    if (
      !pathContains(x, y) ||
      !pathContains(x - 10, y) ||
      !pathContains(x + 10, y) ||
      !pathContains(x, y - 5) ||
      !pathContains(x, y + 5)
    )
      continue;
    dapples.push({
      x,
      y,
      width: 15 + random() * 30,
      height: 5 + random() * 10,
      phase: random() * Math.PI * 2,
      speed: 0.2 + random() * 0.22,
      angle: random() * 0.45 - 0.22,
      opacity: 0.32 + random() * 0.30,
    });
  }
  const patches = Array.from({ length: 4 }, (_, index) => {
    const canvas = createCanvas();
    canvas.width = canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.translate(48, 48);
    ctx.filter = "blur(2px)";
    const glow = ctx.createRadialGradient(-7, -4, 2, 0, 0, 43);
    glow.addColorStop(0, "#fff3c9e8");
    glow.addColorStop(0.6, "#ffe9a5aa");
    glow.addColorStop(1, "#ffe4a000");
    ctx.fillStyle = glow;
    ctx.beginPath();
    const points = Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2,
        r = 30 + Math.sin(i * 2.3 + index * 1.7) * 9;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    points.forEach(([x, y], i) => {
      const next = points[(i + 1) % points.length];
      if (!i)
        ctx.moveTo((points.at(-1)[0] + x) / 2, (points.at(-1)[1] + y) / 2);
      ctx.quadraticCurveTo(x, y, (x + next[0]) / 2, (y + next[1]) / 2);
    });
    ctx.closePath();
    ctx.fill();
    return canvas;
  });
  const highlights = [
    "#eafaff",
    "#ffe3ab",
    "#ffc477",
    "#ef9dca",
    "#87cfff",
    "#8de0c3",
  ].map((color, index) => {
    const canvas = createCanvas();
    canvas.width = 64;
    canvas.height = 16;
    const paint = canvas.getContext("2d");
    paint.translate(32, 8);
    paint.scale(1, 0.22);
    const glow = paint.createRadialGradient(0, 0, 0, 0, 0, 31);
    glow.addColorStop(0, index < 2 ? "#fffef9" : color);
    glow.addColorStop(0.25, color + "ee");
    glow.addColorStop(0.6, color + "80");
    glow.addColorStop(1, color + "00");
    paint.fillStyle = glow;
    paint.fillRect(-32, -36, 64, 72);
    return canvas;
  });

  let glints = [],
    layout = null;
  return {
    resize({ width, height, layout: next }) {
      layout = next;
      const left = -layout.x / layout.scale,
        right = (width - layout.x) / layout.scale;
      const bottom = (height - layout.y) / layout.scale;
      const top = Math.max(800, -layout.y / layout.scale);
      const random = randomSource(0x73756e6c);
      glints = [];
      const count = Math.min(
        1100,
        Math.max(560, Math.round((width * height) / 1250)),
      );
      for (
        let attempt = 0;
        attempt < count * 12 && glints.length < count;
        attempt++
      ) {
        const x = left + random() * (right - left),
          y = top + random() * (bottom - top);
        if (
          !inWaterSurface(x, y) ||
          !inWaterSurface(x - 9, y) ||
          !inWaterSurface(x + 9, y)
        )
          continue;
        glints.push({
          x,
          y,
          phase: random() * Math.PI * 2,
          speed: 0.55 + random() * 0.55,
          width: (7 + random() * 12) * (0.7 + clamp((y - 820) / 600, 0, 1.2)),
          warmth: 0,
          strength: 0.76,
        });
      }
      // Broken vertical trails widen toward the viewer, like reflected sunlight.
      for (const [sourceX, strength] of [
        [420, 0.48],
        [560, 1],
        [815, 0.90],
        [1065, 0.72],
      ]) {
        for (
          let y = Math.max(top, shoreline(sourceX) + 36);
          y < bottom;
          y += 1.8 + random() * 2.5
        ) {
          const depth = Math.max(0, y - shoreline(sourceX));
          const spread = 9 + Math.min(depth, 800) * 0.13;
          const x =
            sourceX + depth * 0.1 + (random() + random() - 1) * spread * 2;
          if (!inWaterSurface(x - 16, y) || !inWaterSurface(x + 16, y))
            continue;
          glints.push({
            x,
            y,
            phase: random() * Math.PI * 2,
            speed: 0.45 + random() * 0.7,
            width: (10 + random() * 22) * (0.65 + Math.min(depth, 600) / 600),
            warmth: 1,
            strength,
          });
        }
      }
      // Match the warm lamps and the pink, blue, and emerald facades.
      for (const [sourceX, color] of [
        [480, 2],
        [620, 5],
        [820, 3],
        [1050, 4],
        [1130, 2],
      ]) {
        for (
          let y = Math.max(top, shoreline(sourceX) + 34);
          y < bottom;
          y += 3 + random() * 5
        ) {
          const depth = Math.max(0, y - shoreline(sourceX));
          const spread = 12 + Math.min(depth, 900) * 0.12;
          const x =
            sourceX +
            Math.sin(depth * 0.004) * 24 +
            (random() + random() - 1) * spread * 2;
          if (!inWaterSurface(x - 20, y) || !inWaterSurface(x + 20, y))
            continue;
          glints.push({
            x,
            y,
            phase: random() * Math.PI * 2,
            speed: 0.35 + random() * 0.65,
            width: (12 + random() * 28) * (0.65 + Math.min(depth, 700) / 700),
            warmth: color,
            strength: 0.72 / (1 + depth / 2200),
            night: true,
          });
        }
      }
    },
    draw(ctx, { time, daylight, night = 0, reduced = false, waterField }) {
      if (!layout || (daylight <= 0.001 && night <= 0.001)) return;
      const t = reduced ? 0 : time;
      if (daylight > 0.001) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = daylight;
        const sunlight = ctx.createRadialGradient(760, 180, 60, 760, 180, 1250);
        sunlight.addColorStop(0, "rgba(255, 245, 214, 0.085)");
        sunlight.addColorStop(0.65, "rgba(255, 245, 225, 0.045)");
        sunlight.addColorStop(1, "rgba(225, 247, 255, 0)");
        ctx.fillStyle = sunlight;
        ctx.fillRect(0, 0, 1536, 1024);
        ctx.restore();
      }
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.beginPath();
      for (const points of PATHS) {
        points.forEach(([x, y], i) =>
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
        );
        ctx.closePath();
      }
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(1536, 0);
      ctx.lineTo(1536, shoreline(1536) - 9);
      ctx.lineTo(0, shoreline(0) - 9);
      ctx.closePath();
      ctx.clip();
      ctx.beginPath();
      ctx.rect(0, 0, 1536, 1024);
      for (const [x, y, w, h] of PLANTERS) ctx.rect(x, y, w, h);
      ctx.clip("evenodd");
      dapples.forEach((d, i) => {
        const breeze = Math.sin(t * 0.29 + d.x * 0.003);
        const x = d.x + breeze * 3 + Math.sin(t * d.speed + d.phase) * 1.5;
        const y = d.y + Math.sin(t * 0.23 + d.phase) * 1.1;
        if (!pathContains(x, y)) return;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(d.angle + breeze * 0.025);
        ctx.globalAlpha =
          daylight *
          d.opacity *
          (0.76 + 0.24 * Math.sin(t * d.speed + d.phase));
        ctx.drawImage(
          patches[i % patches.length],
          -d.width / 2,
          -d.height / 2,
          d.width,
          d.height,
        );
        ctx.restore();
      });
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const g of glints) {
        const illumination = g.night ? night : daylight;
        if (illumination <= 0.001) continue;
        let slope = 0;
        if (
          !reduced &&
          waterField?.spanWidth > 0 &&
          waterField.spanHeight > 0
        ) {
          const x =
            (g.x * layout.scale + layout.x - waterField.left) /
            waterField.spanWidth;
          const y =
            (g.y * layout.scale + layout.y - waterField.top) /
            waterField.spanHeight;
          if (x >= 0 && x < 1 && y >= 0 && y < 1) {
            const p =
              (Math.floor(y * waterField.height) * waterField.width +
                Math.floor(x * waterField.width)) *
              4;
            slope =
              ((waterField.data[p] - 128) * -0.65 -
                (waterField.data[p + 1] - 128)) /
              127;
          }
        }
        const pulse = glintStrength(g, time, slope, reduced);
        const alpha =
          illumination * g.strength *
          (g.warmth ? 0.28 + pulse * 0.72 : 0.08 + pulse * 0.92);
        if (alpha < 0.015) continue;
        const x = g.x + Math.sin(g.y * 0.025 + t * 0.9) * (reduced ? 0 : 1.7);
        const y = g.y + Math.sin(g.x * 0.035 + t * 0.65) * (reduced ? 0 : 0.65);
        if (
          !inWaterSurface(x - g.width / 2, y - 2) ||
          !inWaterSurface(x + g.width / 2, y + 2)
        )
          continue;
        ctx.globalAlpha = alpha;
        const height = Math.max(
          1 / layout.scale,
          g.width * (g.warmth ? 0.24 : 0.16),
        );
        ctx.drawImage(
          highlights[g.warmth],
          x - g.width / 2,
          y - height / 2,
          g.width,
          height,
        );
      }
      ctx.restore();
    },
  };
}
