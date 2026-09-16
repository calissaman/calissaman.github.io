export const CAMELLIA_BLOOMS = [
  [277, 486, 16, -0.48, 0.64, 0.76],
  [224, 509, 25, -0.3, 0.88, 0.91],
  [326, 516, 18, 0.52, 0.69, 0.79],
  [182, 544, 20, -0.62, 0.75, 0.84],
  [263, 539, 30, 0.18, 0.96, 1],
  [279, 560, 14, 0.63, 0.63, 0.78],
  [352, 549, 25, 0.38, 0.84, 0.9],
  [224, 578, 22, -0.38, 0.79, 0.88],
  [311, 584, 17, 0.55, 0.67, 0.79],
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
      CAMELLIA_BLOOMS.forEach(
        ([x, y, size, angle, foreshortening, light], index) => {
          amounts[index] +=
            (targets[index] - amounts[index]) *
            (reduced ? 1 : 1 - Math.exp(-dt * 1.2));
          const open = amounts[index];
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(foreshortening, 1);
          ctx.filter = `brightness(${light * (0.91 - night * 0.3)}) saturate(0.78)`;
          ctx.shadowColor = `rgba(13, 35, 18, ${0.26 + night * 0.12})`;
          ctx.shadowBlur = size * 0.08;
          ctx.shadowOffsetY = size * 0.05;
          const budSize = size * (0.45 + open * 0.22);
          ctx.globalAlpha = 1 - smooth(0.25, 0.85, open);
          ctx.drawImage(
            sprite,
            990,
            300,
            490,
            515,
            -budSize / 2,
            -budSize / 2,
            budSize,
            budSize,
          );
          const bloomSize = size * (0.35 + open * 0.65);
          ctx.globalAlpha = smooth(0.08, 0.75, open);
          ctx.drawImage(
            sprite,
            30,
            110,
            845,
            820,
            -bloomSize / 2,
            -bloomSize / 2,
            bloomSize,
            bloomSize,
          );
          ctx.restore();
        },
      );
      ctx.restore();
    },
  };
}
