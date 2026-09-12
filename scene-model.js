export const SCENE = Object.freeze({
  width: 1536,
  height: 1024,
  maxFlowers: 7,
  maxRipples: 12,
});
export const WATER = Object.freeze({
  shoreY: 774.144,
  shoreSlope: 0.103,
  shoreFadeStart: 5.12,
  shoreFadeEnd: 30.72,
  bankStartY: 819.2,
  leftOuter: 199.68,
  leftInner: 261.12,
  leftSlope: 1.125,
  rightInner: 1428.48,
  rightOuter: 1489.92,
  rightSlope: 0.975,
  surfaceFadeStart: SCENE.height * 0.94,
  surfaceFadeEnd: SCENE.height * 1.015,
});
export const ZONES = Object.freeze({
  singapore: "Asia/Singapore",
  san_francisco: "America/Los_Angeles",
  local: undefined,
});
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function smooth(a, b, x) {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
export function nightAt(minutes) {
  const h = minutes / 60;
  return h < 12 ? 1 - smooth(5.5, 7.5, h) : smooth(18.25, 20.5, h);
}
export function bloomAt(minutes) {
  const h = minutes / 60;
  return h < 12 ? 1 - smooth(4, 5.75, h) : smooth(20, 22, h);
}
export function minutesInZone(date, city) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONES[city],
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return (
    Number(parts.find((p) => p.type === "hour").value) * 60 +
    Number(parts.find((p) => p.type === "minute").value)
  );
}
export function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  return `${h % 12 || 12}:${String(Math.floor(minutes) % 60).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
}
export function windowVisitorAt(minutes) {
  if (minutes >= 18 * 60 && minutes < 22 * 60) return "otter";
  if (minutes >= 23 * 60 || minutes < 5 * 60) return "merlion";
  return null;
}
export function pairedClockMinutes(minutes, city, date = new Date()) {
  const selectedNow = minutesInZone(date, city);
  const shift = minutes - selectedNow;
  const shifted = (zone) => (minutesInZone(date, zone) + shift + 1440) % 1440;
  return {
    singapore: shifted("singapore"),
    san_francisco: shifted("san_francisco"),
  };
}
export function sceneLayout(w, h) {
  // Both axes share one scale; narrow crops include the right-side plants.
  const portrait = w / h < 0.85;
  const nearSquare = !portrait && w / h < 1.15;
  const scale = portrait
    ? w / 1030
    : Math.min(
        Math.max(w / 1536, h / 1024),
        w / 920,
        h / 990,
        nearSquare ? w / 1080 : Infinity,
      );
  let x = (w - 1536 * scale) * 0.53;
  if (portrait) x = w / 2 - 875 * scale;
  else if (nearSquare) {
    const focusedX = w / 2 - 870 * scale;
    x = focusedX + (x - focusedX) * smooth(1.1, 1.15, w / h);
  }
  return {
    scale,
    x,
    y: portrait
      ? Math.min(h * 0.34 - 60 * scale, h - 1024 * scale)
      : Math.min((h - 1024 * scale) * 0.45, h - 990 * scale),
    portrait,
  };
}
export function shoreline(x) {
  return WATER.shoreY + x * WATER.shoreSlope;
}
export function waterCoverage(x, y) {
  if (x < 0 || x > SCENE.width || y < 0 || y > SCENE.height) return 0;
  const belowBanks = Math.max(y - WATER.bankStartY, 0);
  return (
    smooth(
      shoreline(x) + WATER.shoreFadeStart,
      shoreline(x) + WATER.shoreFadeEnd,
      y,
    ) *
    smooth(
      WATER.leftOuter + belowBanks * WATER.leftSlope,
      WATER.leftInner + belowBanks * WATER.leftSlope,
      x,
    ) *
    (1 -
      smooth(
        WATER.rightInner - belowBanks * WATER.rightSlope,
        WATER.rightOuter - belowBanks * WATER.rightSlope,
        x,
      ))
  );
}
export function inWater(x, y) {
  return waterCoverage(x, y) > 0.99;
}
export function inWaterSurface(x, y) {
  const coverage = waterCoverage(x, Math.min(y, SCENE.height));
  const extension = smooth(WATER.surfaceFadeStart, WATER.surfaceFadeEnd, y);
  return y >= 0 && coverage + (1 - coverage) * extension > 0.99;
}
export function constrainToWater({ x, y }, padding = 8) {
  const front = WATER.shoreY + WATER.shoreFadeEnd + padding;
  // The uppermost valid point is where the inner left bank meets the shore.
  const minimumY =
    (front +
      WATER.shoreSlope *
        (WATER.leftInner + padding - WATER.leftSlope * WATER.bankStartY)) /
    (1 - WATER.shoreSlope * WATER.leftSlope);
  const nextY = clamp(
    Math.max(y, shoreline(x) + WATER.shoreFadeEnd + padding),
    minimumY,
    SCENE.height - padding,
  );
  const belowBanks = Math.max(nextY - WATER.bankStartY, 0);
  return {
    x: clamp(
      x,
      WATER.leftInner + belowBanks * WATER.leftSlope + padding,
      WATER.rightInner - belowBanks * WATER.rightSlope - padding,
    ),
    y: nextY,
  };
}
const PETAL_DIRECTIONS = [-1.715, -0.56, 0.745, 2.06, 3.365];

function resetPetal(petal) {
  return Object.assign(petal, {
    active: false,
    x: 0,
    y: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    age: 0,
    landedAt: null,
    falling: false,
    spin: 0,
    opacity: 0,
  });
}

export function createSimulation() {
  return {
    time: 0,
    nextWaterFlowerAt: 4,
    flowerCursor: 0,
    rippleCursor: 0,
    flowers: Array.from({ length: SCENE.maxFlowers }, (_, id) => ({
      id,
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      falling: false,
      landedAt: null,
      appearedAt: -2,
      variant: 0,
      dragged: false,
      breaking: false,
      fragmentSize: 0,
      breakReduced: false,
      petalRippleAdded: false,
      petals: PETAL_DIRECTIONS.map((_, index) => resetPetal({ index })),
    })),
    ripples: Array.from({ length: SCENE.maxRipples }, () => ({
      active: false,
      x: 0,
      y: 0,
      age: 0,
    })),
  };
}
export function addRipple(sim, x, y) {
  const r = sim.ripples[sim.rippleCursor++ % SCENE.maxRipples];
  Object.assign(r, { active: true, x, y, age: 0 });
}
export function addFlower(sim, x, y, falling = false) {
  const f = sim.flowers.find((f) => !f.active);
  if (!f) return null;
  Object.assign(f, {
    active: true,
    x,
    y,
    vx: 3 + f.id * 0.6,
    vy: falling ? 18 : 0,
    angle: f.id * 0.7,
    falling,
    landedAt: falling ? null : sim.time - 2,
    appearedAt: -2,
    variant: sim.flowerCursor++ % 2,
    dragged: false,
    breaking: false,
    fragmentSize: 0,
    breakReduced: false,
    petalRippleAdded: false,
  });
  f.petals.forEach(resetPetal);
  return f;
}

export function maintainWaterFlowers(sim, minimum = 4) {
  if (sim.time < sim.nextWaterFlowerAt) return null;
  sim.nextWaterFlowerAt = sim.time + 4;
  const floating = sim.flowers.filter(
    (f) => f.active && !f.falling && !f.breaking,
  );
  if (floating.length >= minimum || !sim.flowers.some((f) => !f.active))
    return null;
  // Retired breakup origins remain useful until their pooled slots are reused.
  const occupied = sim.flowers.filter(
    (f) => f.breaking || (f.active && !f.falling),
  );
  let position = null;
  let clearance = -1;
  for (const [x, y] of [
    [565, 925],
    [755, 910],
    [935, 976],
    [1100, 950],
    [670, 966],
    [1010, 933],
  ]) {
    const candidate = constrainToWater({ x, y }, 25);
    if (
      floating.some(
        (f) => Math.hypot(f.x - candidate.x, f.y - candidate.y) < 90,
      )
    )
      continue;
    const distance = Math.min(
      ...occupied.map((f) =>
        Math.hypot(f.x - candidate.x, f.y - candidate.y),
      ),
    );
    if (distance > clearance) {
      position = candidate;
      clearance = distance;
    }
  }
  if (!position) return null;
  const flower = addFlower(sim, position.x, position.y);
  flower.appearedAt = sim.time;
  return flower;
}

export function flowerSize(sim, f) {
  if (f.breaking) return f.fragmentSize;
  const settled = f.falling ? 0 : smooth(0, 1.2, sim.time - f.landedAt);
  return 42 + settled * (4 + (f.y - 850) * 0.07);
}

export function breakFlower(sim, f, reduced = false) {
  if (!f.active || f.breaking) return false;
  if (!f.falling) addRipple(sim, f.x, f.y);
  sim.nextWaterFlowerAt = Math.max(sim.nextWaterFlowerAt, sim.time + 6);
  f.fragmentSize = flowerSize(sim, f);
  f.breaking = true;
  f.breakReduced = reduced;
  f.dragged = false;
  for (const p of f.petals) {
    const direction = PETAL_DIRECTIONS[p.index] + f.angle;
    const speed = 9 + p.index * 2.25;
    Object.assign(p, {
      active: true,
      x: f.x,
      y: f.y,
      angle: f.angle,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed + (f.falling && !reduced ? f.vy : 0),
      age: 0,
      landedAt: f.falling && !reduced ? null : sim.time,
      falling: f.falling && !reduced,
      spin: (p.index - 2) * 0.035,
      opacity: 1,
    });
  }
  return true;
}

function stepPetals(sim, f, dt, reduced) {
  if (reduced) f.breakReduced = true;
  const quiet = f.breakReduced;
  for (const p of f.petals) {
    if (!p.active) continue;
    p.age += dt;
    if (quiet) {
      p.x += p.vx * dt * 0.18;
      p.y += p.vy * dt * 0.18;
      p.falling = false;
      if (!f.falling) Object.assign(p, constrainToWater(p));
    } else if (p.falling) {
      p.vy = Math.min(p.vy + dt * 20, 65 + p.index * 5);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > shoreline(p.x) + 45) {
        p.falling = false;
        p.landedAt = sim.time;
        p.vy = 0;
        p.vx *= 0.28;
        Object.assign(p, constrainToWater(p));
        if (!f.petalRippleAdded) {
          addRipple(sim, p.x, p.y);
          f.petalRippleAdded = true;
        }
      }
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 0.3);
      p.vy *= Math.exp(-dt * 0.3);
      Object.assign(p, constrainToWater(p));
    }
    p.angle += p.spin * dt * (quiet ? 0.15 : 1);
    p.opacity = quiet
      ? 1 - clamp(p.age, 0, 1)
      : Math.min(
          1 - smooth(18, 20, p.age),
          p.landedAt === null
            ? 1
            : 1 - clamp((sim.time - p.landedAt) / 5, 0, 1),
        );
    if (p.opacity === 0) p.active = false;
  }
  f.active = f.petals.some((p) => p.active);
}

export function stepSimulation(sim, seconds, reduced = false) {
  const dt = clamp(seconds, 0, 0.05);
  sim.time += dt;
  for (const r of sim.ripples) {
    if (r.active) {
      r.age += dt;
      if (r.age > 3.2) r.active = false;
    }
  }
  for (const f of sim.flowers) {
    if (!f.active) continue;
    if (f.breaking) {
      stepPetals(sim, f, dt, reduced);
      continue;
    }
    if (f.dragged) continue;
    if (f.falling) {
      f.vy = Math.min(f.vy + dt * 18, 65);
      f.x += Math.sin(sim.time * 0.8 + f.id) * dt * 9;
      f.y += f.vy * dt;
      f.angle += dt * 0.12;
      if (f.y > shoreline(f.x) + 45) {
        f.falling = false;
        f.landedAt = sim.time;
        f.vy = 0;
        Object.assign(f, constrainToWater(f));
        addRipple(sim, f.x, f.y);
      }
    } else if (!reduced) {
      f.vx += (3 + f.id * 0.6 - f.vx) * dt * 0.6;
      f.vy *= Math.exp(-dt * 1.5);
      f.x += dt * (f.vx + Math.sin(sim.time * 0.18 + f.id) * 2);
      f.y += dt * (f.vy + Math.sin(sim.time * 0.15 + f.id) * 0.8);
      f.angle += dt * 0.014;
      if (f.x > 1240 || f.y > 1010) f.active = false;
      else Object.assign(f, constrainToWater(f));
    }
  }
}
