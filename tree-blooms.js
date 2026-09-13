import {
  addFlower,
  addRipple,
  constrainToWater,
  clamp,
} from "./scene-model.js?v=20260913-63";

export const TREE_CLICK_LIMIT = 88;
export const TREE_FLOWER_CAPACITY = TREE_CLICK_LIMIT * 3 + 24;
const TRUMPET_ORIGINS = [
  [68, 225],
  [154, 128],
  [274, 84],
  [355, 129],
  [472, 69],
  [553, 28],
];
const ANGSANA_ORIGINS = [
  [1068, 32],
  [1176, 46],
  [1284, 31],
  [1390, 72],
  [1484, 107],
];
export const TREE_HOTSPOTS = [
  {
    kind: "trumpet",
    selector: ".branch-hotspot",
    rect: [0, 0, 605, 340],
    clip: "polygon(0 0,100% 0,98% 24%,73% 48%,46% 65%,24% 77%,0 100%)",
  },
  {
    kind: "angsana",
    selector: ".angsana-hotspot",
    rect: [960, 0, 576, 225],
    clip: "polygon(0 0,100% 0,100% 100%,54% 80%,30% 48%,0 35%)",
  },
];

export function createTreeBlooms(
  sim,
  {
    random = Math.random,
    enabled = { trumpet: true, angsana: true },
    getBounds = () => ({ left: 0, right: 1536 }),
  } = {},
) {
  const clicks = { trumpet: 0, angsana: 0 };
  const yellow = [];
  const next = { trumpet: 5 + random() * 4, angsana: 13 + random() * 5 };
  const range = (a, b) => a + random() * (b - a);
  const pick = (points) =>
    points[Math.min(points.length - 1, Math.floor(random() * points.length))];
  function release(kind, { manual = true, reduced = false } = {}) {
    if (!enabled[kind] || (manual && clicks[kind] >= TREE_CLICK_LIMIT))
      return {
        accepted: false,
        count: 0,
        remaining: TREE_CLICK_LIMIT - clicks[kind],
      };
    const count =
      kind === "trumpet" ? 1 + Math.min(2, Math.floor(random() * 3)) : 1;
    let released = 0;
    for (let i = 0; i < count; i++) {
      const points = kind === "trumpet" ? TRUMPET_ORIGINS : ANGSANA_ORIGINS;
      const bounds = getBounds();
      const visible = points.filter(
        ([x]) => x >= bounds.left + 16 && x <= bounds.right - 16,
      );
      const [x, y] = pick(visible.length ? visible : points);
      const start = { x: x + range(-12, 12), y: y + range(-9, 9) };
      const startsAt = sim.time + (reduced ? 0 : i * range(0.2, 0.55));
      if (kind === "trumpet") {
        const end = constrainToWater(
          { x: range(385, 740), y: range(900, 967) },
          25,
        );
        const f = addFlower(
          sim,
          reduced ? end.x : start.x,
          reduced ? end.y : start.y,
          !reduced,
        );
        if (!f) continue;
        f.startsAt = startsAt;
        f.sizeScale = range(0.76, 0.94);
        if (reduced) addRipple(sim, end.x, end.y);
        else
          f.path = {
            start,
            end,
            duration: range(10, 15),
            sway: range(12, 26),
            phase: range(0, Math.PI * 2),
            angle: f.angle,
          };
      } else {
        const landX = range(
          1300,
          Math.max(1300, Math.min(1470, bounds.right - 20)),
        );
        const end = { x: landX, y: 827 + (landX - 1300) * 0.12 + range(-4, 5) };
        yellow.push({
          start,
          end,
          x: reduced ? end.x : start.x,
          y: reduced ? end.y : start.y,
          startsAt,
          duration: reduced ? 0 : range(6.5, 10.5),
          size: range(10, 15),
          angle: range(-1, 1),
          spin: range(-0.9, 0.9),
          life: range(32, 48),
          landed: reduced,
        });
      }
      released++;
    }
    if (manual && released) clicks[kind]++;
    return {
      accepted: released > 0,
      count: released,
      remaining: TREE_CLICK_LIMIT - clicks[kind],
    };
  }
  return {
    yellow,
    release,
    remaining(kind) {
      return TREE_CLICK_LIMIT - clicks[kind];
    },
    step(reduced = false) {
      for (let i = yellow.length - 1; i >= 0; i--) {
        const f = yellow[i];
        if (reduced && !f.landed) {
          f.startsAt = sim.time;
          f.duration = 0;
        }
        const age = sim.time - f.startsAt;
        const t = f.duration ? clamp(age / f.duration, 0, 1) : 1;
        f.x =
          f.start.x +
          (f.end.x - f.start.x) * t +
          Math.sin(t * Math.PI) * Math.sin(t * 9 + f.angle) * 9;
        f.y = f.start.y + (f.end.y - f.start.y) * Math.pow(t, 1.22);
        f.landed = t === 1;
        if (age > f.duration + f.life) yellow.splice(i, 1);
      }
      for (const kind of ["trumpet", "angsana"]) {
        if (reduced) {
          next[kind] = sim.time + (kind === "trumpet" ? 12 : 27);
          continue;
        }
        if (sim.time < next[kind]) continue;
        if (
          kind === "trumpet"
            ? sim.flowers.filter((f) => f.active).length < 12
            : yellow.length < 5
        )
          release(kind, { manual: false });
        next[kind] =
          sim.time + (kind === "trumpet" ? range(10, 19) : range(25, 42));
      }
    },
    draw(ctx, image, night) {
      if (!image) return;
      for (const f of yellow) {
        const age = sim.time - f.startsAt;
        if (age < 0) continue;
        const t = f.duration ? clamp(age / f.duration, 0, 1) : 1;
        const fade = 1 - clamp((age - f.duration - f.life + 5) / 5, 0, 1);
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.angle + f.spin * t);
        ctx.globalAlpha = fade;
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = night > 0.5 ? "brightness(.86) saturate(1.08)" : "none";
        ctx.shadowColor = "#28220d77";
        ctx.shadowBlur = 1;
        ctx.shadowOffsetY = f.landed ? 0.6 : 1;
        ctx.drawImage(image, -f.size / 2, -f.size / 2, f.size, f.size);
        ctx.restore();
      }
    },
  };
}
