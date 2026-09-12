const fieldCaches = new WeakMap();

function appendSegment(
  ctx,
  points,
  first,
  second,
  a,
  b,
  c,
  d,
  level,
  x,
  y,
  dx,
  dy,
) {
  const ax = points[first];
  const ay = points[first + 1];
  const bx = points[second];
  const by = points[second + 1];
  if (Math.abs(ax - bx) + Math.abs(ay - by) < 1e-6) return 0;
  const mx = (ax + bx) * 0.5;
  const my = (ay + by) * 0.5;
  const value =
    a * (1 - mx) * (1 - my) +
    b * mx * (1 - my) +
    c * mx * my +
    d * (1 - mx) * my;
  const gx = (b - a) * (1 - my) + (c - d) * my;
  const gy = (d - a) * (1 - mx) + (c - b) * mx;
  const gradient = gx * gx + gy * gy;
  const correction = gradient > 1e-8 ? (level - value) / gradient : 0;
  const bendX = Math.max(-0.2, Math.min(0.2, correction * gx));
  const bendY = Math.max(-0.2, Math.min(0.2, correction * gy));
  const controlX = Math.max(0, Math.min(1, mx + 2 * bendX));
  const controlY = Math.max(0, Math.min(1, my + 2 * bendY));
  ctx.moveTo(x + ax * dx, y + ay * dy);
  ctx.quadraticCurveTo(
    x + controlX * dx,
    y + controlY * dy,
    x + bx * dx,
    y + by * dy,
  );
  return 1;
}

function contour(ctx, field, values, points, level, left, top, dx, dy) {
  const nx = field.width;
  let segments = 0;
  for (let y = 0; y < field.height - 1; y++) {
    for (let x = 0; x < nx - 1; x++) {
      const i = y * nx + x;
      if (
        !field.data[i * 4 + 3] ||
        !field.data[(i + 1) * 4 + 3] ||
        !field.data[(i + nx) * 4 + 3] ||
        !field.data[(i + nx + 1) * 4 + 3]
      )
        continue;
      const a = values[i];
      const b = values[i + 1];
      const c = values[i + nx + 1];
      const d = values[i + nx];
      let n = 0;
      if (a >= level !== b >= level) {
        points[n++] = (level - a) / (b - a);
        points[n++] = 0;
      }
      if (b >= level !== c >= level) {
        points[n++] = 1;
        points[n++] = (level - b) / (c - b);
      }
      if (d >= level !== c >= level) {
        points[n++] = (level - d) / (c - d);
        points[n++] = 1;
      }
      if (a >= level !== d >= level) {
        points[n++] = 0;
        points[n++] = (level - a) / (d - a);
      }
      if (!n) continue;
      const px = left + x * dx;
      const py = top + y * dy;
      if (n === 4) {
        segments += appendSegment(
          ctx,
          points,
          0,
          2,
          a,
          b,
          c,
          d,
          level,
          px,
          py,
          dx,
          dy,
        );
      } else if (a >= level === (a + b + c + d) * 0.25 >= level) {
        segments += appendSegment(
          ctx,
          points,
          0,
          2,
          a,
          b,
          c,
          d,
          level,
          px,
          py,
          dx,
          dy,
        );
        segments += appendSegment(
          ctx,
          points,
          4,
          6,
          a,
          b,
          c,
          d,
          level,
          px,
          py,
          dx,
          dy,
        );
      } else {
        segments += appendSegment(
          ctx,
          points,
          0,
          6,
          a,
          b,
          c,
          d,
          level,
          px,
          py,
          dx,
          dy,
        );
        segments += appendSegment(
          ctx,
          points,
          2,
          4,
          a,
          b,
          c,
          d,
          level,
          px,
          py,
          dx,
          dy,
        );
      }
    }
  }
  return segments;
}

export function drawWaterFieldFallback(
  ctx,
  field,
  layout,
  night = 0,
  strength = 1,
) {
  if (
    !field ||
    field.width < 2 ||
    field.height < 2 ||
    field.spanWidth <= 0 ||
    field.spanHeight <= 0
  )
    return;
  let cache = fieldCaches.get(field);
  if (!cache || cache.values.length !== field.width * field.height) {
    cache = {
      values: new Float32Array(field.width * field.height),
      points: new Float64Array(8),
      data: null,
      revision: -1,
    };
    fieldCaches.set(field, cache);
  }
  if (cache.data !== field.data || cache.revision !== field.revision) {
    for (let i = 0; i < cache.values.length; i++) {
      cache.values[i] =
        -0.45 * (field.data[i * 4] - 128) -
        0.89 * (field.data[i * 4 + 1] - 128);
    }
    cache.data = field.data;
    cache.revision = field.revision;
  }
  const dx = field.spanWidth / field.width / layout.scale;
  const dy = field.spanHeight / field.height / layout.scale;
  const left = (field.left - layout.x) / layout.scale + dx * 0.5;
  const top = (field.top - layout.y) / layout.scale + dy * 0.5;
  const darkness = Math.max(0, Math.min(1, night));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let pass = 0; pass < 4; pass++) {
    const shadow = pass < 2;
    const strong = pass % 2 === 1;
    const level = (strong ? 10 : 3.5) * (shadow ? -1 : 1);
    ctx.strokeStyle = shadow ? "#123b40" : "#eee9cf";
    ctx.globalAlpha =
      (shadow
        ? 0.13 + darkness * 0.04 + (strong ? 0.06 : 0)
        : 0.21 + darkness * 0.07 + (strong ? 0.08 : 0)) * strength;
    ctx.lineWidth = (strong ? 0.75 : 0.6) / layout.scale;
    ctx.beginPath();
    if (
      contour(ctx, field, cache.values, cache.points, level, left, top, dx, dy)
    )
      ctx.stroke();
  }
  ctx.restore();
}
