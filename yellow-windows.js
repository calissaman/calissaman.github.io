import { panelProjection } from "./facade-panels.js?v=20260913-62";

export const YELLOW_WINDOWS = [
  {
    id: "upper-left",
    name: "left upstairs",
    light: "cream-upper-left",
    quad: [
      [695, 276],
      [763, 266],
      [764, 402],
      [695, 411],
    ],
    target: [691, 293, 77, 115],
  },
  {
    id: "upper-right",
    name: "right upstairs",
    light: "cream-upper-right",
    quad: [
      [811, 257],
      [879, 247],
      [880, 388],
      [811, 397],
    ],
    target: [806, 277, 78, 114],
  },
  {
    id: "ground",
    name: "ground-floor",
    light: "cream-window",
    quad: [
      [706, 585],
      [766, 581],
      [766, 684],
      [705, 690],
    ],
    target: [721, 615, 49, 70],
    foregroundY: 635,
  },
];

function trace(ctx, points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}
const lerp = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t);

export function shutterLeaves(quad, amount) {
  const [tl, tr, br, bl] = quad;
  const top = lerp(tl, tr, 0.5),
    bottom = lerp(bl, br, 0.5);
  const angle = amount * Math.PI * 0.34,
    width = Math.cos(angle),
    depth = Math.sin(angle) * 10;
  const leftTop = lerp(tl, top, width),
    leftBottom = lerp(bl, bottom, width);
  const rightTop = lerp(tr, top, width),
    rightBottom = lerp(br, bottom, width);
  leftTop[1] += depth;
  rightTop[1] += depth;
  leftBottom[1] -= depth;
  rightBottom[1] -= depth;
  return [
    { source: [tl, top, bottom, bl], target: [tl, leftTop, leftBottom, bl] },
    { source: [top, tr, br, bottom], target: [rightTop, tr, br, rightBottom] },
  ];
}

function triangle(ctx, image, source, target) {
  const [s0, s1, s2] = source,
    [d0, d1, d2] = target;
  const sx1 = s1[0] - s0[0],
    sy1 = s1[1] - s0[1],
    sx2 = s2[0] - s0[0],
    sy2 = s2[1] - s0[1];
  const dx1 = d1[0] - d0[0],
    dy1 = d1[1] - d0[1],
    dx2 = d2[0] - d0[0],
    dy2 = d2[1] - d0[1];
  const determinant = sx1 * sy2 - sx2 * sy1;
  const a = (dx1 * sy2 - dx2 * sy1) / determinant,
    c = (dx2 * sx1 - dx1 * sx2) / determinant;
  const b = (dy1 * sy2 - dy2 * sy1) / determinant,
    d = (dy2 * sx1 - dy1 * sx2) / determinant;
  ctx.save();
  const center = target.reduce(
    (sum, p) => [sum[0] + p[0] / 3, sum[1] + p[1] / 3],
    [0, 0],
  );
  trace(
    ctx,
    target.map((p) => {
      const d = Math.hypot(p[0] - center[0], p[1] - center[1]);
      return p.map((n, i) => n + ((n - center[i]) / d) * 0.3);
    }),
  );
  ctx.clip();
  ctx.transform(
    a,
    b,
    c,
    d,
    d0[0] - a * s0[0] - c * s0[1],
    d0[1] - b * s0[0] - d * s0[1],
  );
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}

function paintLeaf(ctx, image, source, target) {
  for (let i = 0; i < 6; i++) {
    const a = i / 6,
      b = (i + 1) / 6;
    const strip = (quad) => [
      lerp(quad[0], quad[1], a),
      lerp(quad[0], quad[1], b),
      lerp(quad[3], quad[2], b),
      lerp(quad[3], quad[2], a),
    ];
    const s = strip(source),
      t = strip(target);
    triangle(ctx, image, [s[0], s[1], s[2]], [t[0], t[1], t[2]]);
    triangle(ctx, image, [s[0], s[2], s[3]], [t[0], t[2], t[3]]);
  }
}

export function drawMatchingYellowShutters(ctx) {
  const [left, right] = YELLOW_WINDOWS;
  const bounds = (quad) => {
    const x = Math.floor(Math.min(...quad.map((p) => p[0]))),
      y = Math.floor(Math.min(...quad.map((p) => p[1])));
    return [
      x,
      y,
      Math.ceil(Math.max(...quad.map((p) => p[0]))) - x + 1,
      Math.ceil(Math.max(...quad.map((p) => p[1]))) - y + 1,
    ];
  };
  const [sx, sy, sw, sh] = bounds(left.quad),
    [dx, dy, dw, dh] = bounds(right.quad);
  const source = ctx.getImageData(sx, sy, sw, sh).data,
    target = ctx.getImageData(dx, dy, dw, dh),
    project = panelProjection(right.quad);
  for (let y = 0; y < dh; y++)
    for (let x = 0; x < dw; x++) {
      const [u, v] = project(dx + x + 0.5, dy + y + 0.5);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const [px, py] = lerp(
        lerp(left.quad[0], left.quad[1], u),
        lerp(left.quad[3], left.quad[2], u),
        v,
      ).map((n, i) => Math.max(0, n - (i ? sy : sx) - 0.5));
      const ix = Math.floor(px),
        iy = Math.floor(py),
        fx = px - ix,
        fy = py - iy;
      for (let k = 0; k < 4; k++) {
        const top =
          source[(iy * sw + ix) * 4 + k] * (1 - fx) +
          source[(iy * sw + Math.min(ix + 1, sw - 1)) * 4 + k] * fx;
        const bottom =
          source[(Math.min(iy + 1, sh - 1) * sw + ix) * 4 + k] * (1 - fx) +
          source[
            (Math.min(iy + 1, sh - 1) * sw + Math.min(ix + 1, sw - 1)) * 4 + k
          ] *
            fx;
        target.data[(y * dw + x) * 4 + k] = top * (1 - fy) + bottom * fy;
      }
    }
  ctx.putImageData(target, dx, dy);
}

export function yellowWindowButtonRect(window, layout) {
  const [x, y, w, h] = window.target;
  const minimum = layout.portrait ? 24 : 44;
  const width = Math.max(minimum, w * layout.scale),
    height = Math.max(minimum, h * layout.scale);
  return {
    left: `${layout.x + (x + w / 2) * layout.scale - width / 2}px`,
    top: `${layout.y + (y + h / 2) * layout.scale - height / 2 + (layout.portrait ? 2 : 0)}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
}

export function createYellowWindows({
  stage,
  day,
  night,
  interior,
  lightPatches,
  lights,
  getLightAmount,
  announce,
  createCanvas = () => document.createElement("canvas"),
}) {
  const windows = YELLOW_WINDOWS.map((definition) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-hotspot yellow-window-hotspot";
    button.dataset.window = definition.id;
    button.setAttribute("aria-pressed", "false");
    button.setAttribute(
      "aria-label",
      `Open the ${definition.name} window of the yellow shophouse`,
    );
    button.title = "Open or close this window";
    button.disabled = !(day && night);
    stage.append(button);
    const state = { ...definition, button, open: false, amount: 0 };
    const x = Math.floor(Math.min(...state.quad.map((p) => p[0]))),
      y = Math.floor(Math.min(...state.quad.map((p) => p[1])));
    const width = Math.ceil(Math.max(...state.quad.map((p) => p[0]))) - x + 1,
      height = Math.ceil(Math.max(...state.quad.map((p) => p[1]))) - y + 1;
    state.origin = [x, y];
    state.texture = createCanvas();
    state.texture.width = width;
    state.texture.height = height;
    if (state.foregroundY && day && night) {
      const makeLayer = (image) => {
        const c = createCanvas();
        c.width = width;
        c.height = height;
        const p = c.getContext("2d");
        p.drawImage(image, -x, -y);
        return {
          canvas: c,
          ctx: p,
          pixels: p.getImageData(0, 0, width, height),
        };
      };
      const layers = [makeLayer(day), makeLayer(night)];
      const mask = layers[0].pixels.data;
      for (let py = 0; py < height; py++)
        for (let px = 0; px < width; px++) {
          const i = (py * width + px) * 4,
            [r, g, b] = mask.slice(i, i + 3);
          const leaf = r < 175 && g > r * 0.9 && g > b * 1.2;
          const bud =
            Math.hypot((px + x - 726) / 4, (py + y - 657) / 11) < 1 &&
            r > g * 1.2 &&
            b > g * 0.9;
          const alpha = py + y >= state.foregroundY && (leaf || bud) ? 255 : 0;
          for (const layer of layers) layer.pixels.data[i + 3] = alpha;
        }
      layers.forEach((layer) => layer.ctx.putImageData(layer.pixels, 0, 0));
      state.foreground = layers.map((layer) => layer.canvas);
    }
    button.addEventListener("click", () => {
      state.open = !state.open;
      button.setAttribute("aria-pressed", String(state.open));
      button.setAttribute(
        "aria-label",
        `${state.open ? "Close" : "Open"} the ${state.name} window of the yellow shophouse`,
      );
      announce(
        `The yellow shophouse ${state.name} window is ${state.open ? "open" : "closed"}.`,
      );
    });
    return state;
  });
  return {
    resize(layout) {
      windows.forEach((w) =>
        Object.assign(w.button.style, yellowWindowButtonRect(w, layout)),
      );
    },
    step(easing, reduced = false) {
      windows.forEach((w) => {
        w.amount = reduced
          ? Number(w.open)
          : w.amount + (Number(w.open) - w.amount) * easing;
      });
    },
    draw(ctx, nightAmount) {
      for (const w of windows) {
        if (w.amount < 0.001 || !day || !night) continue;
        const light = getLightAmount(w.light),
          [x, y] = w.origin,
          paint = w.texture.getContext("2d");
        paint.globalAlpha = 1;
        paint.clearRect(0, 0, w.texture.width, w.texture.height);
        paint.drawImage(day, -x, -y);
        paint.globalAlpha = nightAmount;
        paint.drawImage(night, -x, -y);
        const patches = lightPatches.get(w.light),
          definition = lights.find((l) => l.id === w.light);
        const [lx, ly] = definition.rect;
        paint.globalAlpha = (1 - light) * (1 - nightAmount);
        paint.drawImage(patches[0], lx - x, ly - y);
        paint.globalAlpha = (1 - light) * nightAmount;
        paint.drawImage(patches[1], lx - x, ly - y);
        ctx.save();
        trace(ctx, w.quad);
        ctx.clip();
        const glow = nightAmount * light,
          recess = ctx.createLinearGradient(
            x,
            y,
            x + w.texture.width,
            y + w.texture.height,
          );
        recess.addColorStop(
          0,
          `rgb(${Math.round(15 + glow * 34)},${Math.round(23 + glow * 12)},${Math.round(23 - glow * 7)})`,
        );
        recess.addColorStop(
          0.65,
          `rgb(${Math.round(24 + glow * 79)},${Math.round(31 + glow * 36)},${Math.round(29 + glow * 2)})`,
        );
        recess.addColorStop(
          1,
          `rgb(${Math.round(13 + glow * 42)},${Math.round(20 + glow * 16)},${Math.round(20 - glow * 1)})`,
        );
        ctx.globalAlpha = 1;
        ctx.fillStyle = recess;
        ctx.fillRect(x, y, w.texture.width, w.texture.height);
        if (interior) {
          ctx.save();
          ctx.filter = `brightness(${0.42 + glow * 0.24 - nightAmount * (1 - light) * 0.34}) sepia(${glow * 0.35})`;
          ctx.drawImage(interior, x, y, w.texture.width, w.texture.height);
          ctx.restore();
          const shade = ctx.createLinearGradient(x, y, x + w.texture.width, y);
          shade.addColorStop(0, "#050e14c0");
          shade.addColorStop(0.25, "#050e1400");
          shade.addColorStop(0.75, "#050e1400");
          shade.addColorStop(1, "#050e1480");
          ctx.fillStyle = shade;
          ctx.fillRect(x, y, w.texture.width, w.texture.height);
        }
        for (const leaf of shutterLeaves(w.quad, w.amount))
          paintLeaf(
            ctx,
            w.texture,
            leaf.source.map((p) => [p[0] - x, p[1] - y]),
            leaf.target,
          );
        if (w.foreground) {
          ctx.save();
          ctx.drawImage(w.foreground[0], x, y);
          ctx.globalAlpha = nightAmount;
          ctx.drawImage(w.foreground[1], x, y);
          ctx.restore();
        }
        ctx.restore();
      }
    },
  };
}
