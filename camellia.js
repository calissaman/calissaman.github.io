export const CAMELLIA_BLOOMS = [
  [276, 486, 15, -0.18, 2, 0.82],
  [224, 509, 23, -0.12, 0, 0.95],
  [326, 516, 17, 0.20, 2, 0.85],
  [182, 544, 19, -0.23, 0, 0.90],
  [263, 539, 26, 0.10, 1, 1],
  [280, 561, 12, 0.20, 2, 0.86],
  [352, 549, 22, 0.15, 2, 0.96],
  [224, 578, 19, -0.22, 1, 0.92],
  [311, 584, 15, 0.19, 0, 0.86],
];

function smooth(a, b, value) {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function camelliaOpenness(minutes, index) {
  const offset = (index % 5) * 22;
  return (
    smooth(360 + offset, 810 + offset, minutes) *
    (1 - smooth(1080 + offset, 1320 + offset, minutes))
  );
}

export function createCamellia(sprite) {
  let amounts = null;
  let lastTime = 0;
  return {
    draw(ctx, { minutes, night, time, reduced }) {
      if (!sprite) return;
      const dt = Math.min(0.1, Math.max(0, time - lastTime));
      lastTime = time;
      const targets = CAMELLIA_BLOOMS.map((_, index) =>
        camelliaOpenness(minutes, index),
      );
      if (!amounts) amounts = reduced ? targets.slice() : targets.map(() => 0);
      ctx.save();
      CAMELLIA_BLOOMS.forEach(([x, y, size, angle, variant, light], index) => {
        amounts[index] += (targets[index] - amounts[index]) *
          (reduced ? 1 : 1 - Math.exp(-dt * 1.2));
        const open = smooth(0, 1, amounts[index]);
        const cell = sprite.width / 3;
        const row = sprite.height / 2;
        const width = size * 1.6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.filter = `brightness(${light * (0.93 - night * 0.34)}) saturate(0.83)`;
        ctx.globalAlpha = 1 - open;
        ctx.drawImage(sprite, variant * cell, row, cell, row,
          -width / 2, -width * 0.39, width, width);
        ctx.globalAlpha = open;
        ctx.drawImage(sprite, variant * cell, 0, cell, row,
          -width / 2, -width * 0.39, width, width);
        ctx.restore();
      });
      ctx.restore();
    },
  };
}
