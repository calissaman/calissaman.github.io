export const CAMELLIA_BLOOMS = [
  [249, 485, 20, -0.15],
  [284, 478, 17, 0.18],
  [220, 502, 19, -0.24],
  [313, 496, 22, 0.12],
  [183, 526, 18, -0.2],
  [259, 518, 24, 0.08],
  [348, 515, 19, 0.25],
  [291, 538, 21, -0.13],
  [210, 549, 23, 0.16],
  [370, 542, 18, -0.22],
  [242, 570, 19, -0.1],
  [326, 567, 24, 0.16],
  [175, 569, 17, 0.25],
  [282, 592, 18, -0.18],
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
      ctx.filter = `brightness(${0.93 - night * 0.3}) saturate(0.85)`;
      CAMELLIA_BLOOMS.forEach(([x, y, size, angle], index) => {
        amounts[index] +=
          (targets[index] - amounts[index]) *
          (reduced ? 1 : 1 - Math.exp(-dt * 1.2));
        const open = amounts[index];
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        const budSize = size * (0.53 + open * 0.08);
        ctx.globalAlpha = 1 - open;
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
        const bloomSize = size * (0.58 + open * 0.42);
        ctx.globalAlpha = open;
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
      });
      ctx.restore();
    },
  };
}
