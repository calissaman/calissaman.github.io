import {
  SCENE,
  WATER,
  inWaterSurface,
  shoreline,
} from "./scene-model.js?v=20260912-29";

const STEP = 1 / 60;
const WAVE_SPEED = 22;
const VELOCITY_DAMPING = Math.exp(-0.8 * STEP);
const HEIGHT_DAMPING = Math.exp(-0.16 * STEP);
const MAX_STEPS = 5;
const TAP_AMPLITUDE = 1.05;
const NORMAL_GAIN = 1.8;

export function createWaterSurface() {
  const frame = {
    data: new Uint8Array(0),
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    spanWidth: 0,
    spanHeight: 0,
    revision: 0,
  };
  let heights = new Float32Array(0);
  let nextHeights = new Float32Array(0);
  let velocities = new Float32Array(0);
  let mask = new Uint8Array(0);
  let edgeDamping = new Float32Array(0);
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let lastTime = NaN;
  let accumulator = 0;
  let consumedCursor = 0;
  let nextDropAt = NaN;
  let randomState = 0x713ab29;

  function random() {
    randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
    return randomState / 4294967296;
  }

  function encode() {
    const { width: nx, height: ny, data } = frame;
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const i = y * nx + x;
        const p = i * 4;
        let slopeX = 0;
        let slopeY = 0;
        if (mask[i] && x > 0 && x < nx - 1 && y > 0 && y < ny - 1) {
          slopeX = (heights[i + 1] - heights[i - 1]) * NORMAL_GAIN * 0.5;
          slopeY = (heights[i + nx] - heights[i - nx]) * NORMAL_GAIN * 0.5;
        }
        data[p] = Math.round(128 + 127 * Math.max(-1, Math.min(1, slopeX)));
        data[p + 1] = Math.round(128 + 127 * Math.max(-1, Math.min(1, slopeY)));
        data[p + 2] = Math.round(
          128 + 127 * Math.max(-1, Math.min(1, heights[i])),
        );
        data[p + 3] = mask[i];
      }
    }
    frame.revision++;
  }

  function resize({ width, height, layout }) {
    scale = layout.scale;
    offsetX = layout.x;
    offsetY = layout.y;
    const firstWorldX = Math.max(0, Math.min(SCENE.width, -offsetX / scale));
    frame.top = Math.max(
      0,
      Math.min(
        height,
        offsetY + (shoreline(firstWorldX) + WATER.shoreFadeStart) * scale,
      ),
    );
    frame.spanWidth = Math.max(0, width);
    frame.spanHeight = Math.max(0, height - frame.top);
    frame.width = Math.max(128, Math.min(192, Math.ceil(width / 8)));
    frame.height =
      frame.spanHeight > 0 && width > 0
        ? Math.max(
            8,
            Math.min(
              256,
              Math.ceil((frame.width * frame.spanHeight * 2.35) / width),
            ),
          )
        : 1;
    const cells = frame.width * frame.height;
    heights = new Float32Array(cells);
    nextHeights = new Float32Array(cells);
    velocities = new Float32Array(cells);
    mask = new Uint8Array(cells);
    edgeDamping = new Float32Array(cells);
    frame.data = new Uint8Array(cells * 4);
    for (let y = 0; y < frame.height; y++) {
      const worldY =
        (frame.top + ((y + 0.5) * frame.spanHeight) / frame.height - offsetY) /
        scale;
      for (let x = 0; x < frame.width; x++) {
        const worldX = (((x + 0.5) * width) / frame.width - offsetX) / scale;
        const i = y * frame.width + x;
        mask[i] =
          frame.spanHeight > 0 && width > 0 && inWaterSurface(worldX, worldY)
            ? 255
            : 0;
      }
    }
    for (let y = 1; y < frame.height - 1; y++) {
      for (let x = 1; x < frame.width - 1; x++) {
        const i = y * frame.width + x;
        edgeDamping[i] =
          mask[i - 1] &&
          mask[i + 1] &&
          mask[i - frame.width] &&
          mask[i + frame.width]
            ? 1
            : 0.9;
      }
    }
    accumulator = 0;
    lastTime = NaN;
    nextDropAt = NaN;
    // Keep the consumed serial across resizes; pooled taps are not new events.
    encode();
  }

  function inject(gx, gy, amplitude, radius) {
    const nx = frame.width;
    const startX = Math.max(1, Math.floor(gx - radius * 2));
    const endX = Math.min(nx - 2, Math.ceil(gx + radius * 2));
    const startY = Math.max(1, Math.floor(gy - radius * 2));
    const endY = Math.min(frame.height - 2, Math.ceil(gy + radius * 2));
    let injected = false;
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const i = y * nx + x;
        if (!mask[i]) continue;
        const distance = ((x - gx) ** 2 + (y - gy) ** 2) / (radius * radius);
        if (distance > 4) continue;
        heights[i] += amplitude * Math.exp(-distance * 1.5);
        injected = true;
      }
    }
    return injected;
  }

  function consumeRipples(ripples, cursor, reduced) {
    if (cursor === consumedCursor) return false;
    const start = Math.max(
      cursor < consumedCursor ? 0 : consumedCursor,
      cursor - ripples.length,
    );
    consumedCursor = cursor;
    let changed = false;
    if (!frame.spanWidth || !frame.spanHeight) return false;
    for (let serial = start; serial < cursor; serial++) {
      const ripple = ripples[serial % ripples.length];
      if (!ripple?.active || !inWaterSurface(ripple.x, ripple.y)) continue;
      const x = ripple.x * scale + offsetX;
      const y = ripple.y * scale + offsetY;
      if (
        x < 0 ||
        x >= frame.spanWidth ||
        y < frame.top ||
        y >= frame.top + frame.spanHeight
      )
        continue;
      changed =
        inject(
          (x * frame.width) / frame.spanWidth - 0.5,
          ((y - frame.top) * frame.height) / frame.spanHeight - 0.5,
          TAP_AMPLITUDE * (reduced ? 0.3 : 1),
          2.5,
        ) || changed;
    }
    return changed;
  }

  function ambientDrop() {
    for (let attempt = 0; attempt < 24; attempt++) {
      const x = 3 + Math.floor(random() * Math.max(1, frame.width - 6));
      const y = 3 + Math.floor(random() * Math.max(1, frame.height - 6));
      if (y >= frame.height - 2 || !mask[y * frame.width + x]) continue;
      return inject(x, y, 0.42, 1.7);
    }
    return false;
  }

  function step() {
    const nx = frame.width;
    for (let y = 1; y < frame.height - 1; y++) {
      for (let x = 1; x < nx - 1; x++) {
        const i = y * nx + x;
        if (!mask[i]) continue;
        const laplacian =
          heights[i - 1] +
          heights[i + 1] +
          heights[i - nx] +
          heights[i + nx] -
          4 * heights[i];
        velocities[i] =
          (velocities[i] + WAVE_SPEED * WAVE_SPEED * laplacian * STEP) *
          VELOCITY_DAMPING *
          edgeDamping[i];
        nextHeights[i] = (heights[i] + velocities[i] * STEP) * HEIGHT_DAMPING;
      }
    }
    const previous = heights;
    heights = nextHeights;
    nextHeights = previous;
  }

  function update({ time, reduced = false, ripples, rippleCursor }) {
    let changed = consumeRipples(ripples, rippleCursor, reduced);
    const elapsed = time - lastTime;
    const firstUpdate = !Number.isFinite(lastTime);
    if (firstUpdate || elapsed < 0 || elapsed > 0.25) {
      accumulator = 0;
      nextDropAt = time + (firstUpdate ? 0.6 + random() * 0.3 : 1.2 + random());
    } else {
      accumulator = Math.min(accumulator + elapsed, STEP * MAX_STEPS);
    }
    lastTime = time;
    if (reduced) {
      nextDropAt = time + 1.2 + random();
    } else if (time >= nextDropAt) {
      changed = ambientDrop() || changed;
      nextDropAt = time + 1.2 + random();
    }
    let steps = 0;
    while (accumulator + 1e-9 >= STEP && steps < MAX_STEPS) {
      step();
      accumulator -= STEP;
      steps++;
    }
    if (changed || steps) encode();
  }

  return {
    resize,
    update,
    get frame() {
      return frame;
    },
  };
}
