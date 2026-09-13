export const FACADE_PANELS = [
  {
    house: "green",
    quad: [
      [477, 442],
      [535, 434],
      [535, 468],
      [477, 476],
    ],
  },
  {
    house: "green",
    quad: [
      [565, 432],
      [630, 422],
      [630, 458],
      [565, 467],
    ],
  },
  {
    house: "cream",
    quad: [
      [692, 428],
      [761, 418],
      [761, 455],
      [692, 465],
    ],
  },
  {
    house: "cream",
    quad: [
      [802, 418],
      [876, 408],
      [876, 442],
      [802, 453],
    ],
  },
  {
    house: "blue",
    quad: [
      [967, 406],
      [1048, 394],
      [1048, 434],
      [967, 447],
    ],
  },
  {
    house: "blue",
    quad: [
      [1094, 390],
      [1186, 376],
      [1186, 422],
      [1094, 435],
    ],
    visible: [
      [1094, 390],
      [1167, 379],
      [1162, 388],
      [1154, 398],
      [1155, 401],
      [1162, 398],
      [1168, 390],
      [1166, 404],
      [1169, 417],
      [1162, 419],
      [1167, 425],
      [1094, 435],
    ],
  },
];

export function panelProjection(quad) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2,
    dx2 = x3 - x2,
    dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2,
    dy2 = y3 - y2,
    dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const a = x1 - x0 + g * x1,
    b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1,
    e = y3 - y0 + h * y3;
  return (x, y) => {
    const A = a - x * g,
      B = b - x * h,
      C = d - y * g,
      D = e - y * h;
    const determinant = A * D - B * C;
    return [
      ((x - x0) * D - B * (y - y0)) / determinant,
      (A * (y - y0) - (x - x0) * C) / determinant,
    ];
  };
}

export function drawFacadePanels(
  ctx,
  images,
  {
    night = false,
    pixelRatio = 1,
    createCanvas = () => document.createElement("canvas"),
  } = {},
) {
  const textures = new Map();
  for (const [house, image] of Object.entries(images)) {
    if (!image) continue;
    const canvas = createCanvas();
    canvas.width = 512;
    canvas.height = 256;
    const paint = canvas.getContext("2d");
    paint.drawImage(image, 0, 0, 512, 256);
    textures.set(house, paint.getImageData(0, 0, 512, 256).data);
  }
  for (const panel of FACADE_PANELS) {
    const texture = textures.get(panel.house);
    if (!texture) continue;
    const x = Math.floor(Math.min(...panel.quad.map((p) => p[0])));
    const y = Math.floor(Math.min(...panel.quad.map((p) => p[1])));
    const width = Math.ceil(Math.max(...panel.quad.map((p) => p[0]))) - x;
    const height = Math.ceil(Math.max(...panel.quad.map((p) => p[1]))) - y;
    const canvas = createCanvas();
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    const paint = canvas.getContext("2d"),
      pixels = paint.createImageData(canvas.width, canvas.height);
    const project = panelProjection(panel.quad);
    const light = night ? [0.66, 0.58, 0.49] : [0.98, 0.97, 0.94];
    for (let py = 0; py < canvas.height; py++)
      for (let px = 0; px < canvas.width; px++) {
        const [u, v] = project(
          x + (px + 0.5) / pixelRatio,
          y + (py + 0.5) / pixelRatio,
        );
        if (u < 0 || u > 1 || v < 0 || v > 1) continue;
        // Mirror the same half-pattern; both members of a pair share one texture.
        const sx = Math.min(u, 1 - u) * 511,
          sy = v * 255;
        const ix = Math.floor(sx),
          iy = Math.floor(sy),
          fx = sx - ix,
          fy = sy - iy;
        const i = (py * canvas.width + px) * 4;
        for (let k = 0; k < 3; k++) {
          const top =
            texture[(iy * 512 + ix) * 4 + k] * (1 - fx) +
            texture[(iy * 512 + Math.min(ix + 1, 511)) * 4 + k] * fx;
          const bottom =
            texture[(Math.min(iy + 1, 255) * 512 + ix) * 4 + k] * (1 - fx) +
            texture[
              (Math.min(iy + 1, 255) * 512 + Math.min(ix + 1, 511)) * 4 + k
            ] *
              fx;
          pixels.data[i + k] = (top * (1 - fy) + bottom * fy) * light[k];
        }
        pixels.data[i + 3] = 255;
      }
    paint.putImageData(pixels, 0, 0);
    ctx.save();
    if (panel.visible) {
      ctx.beginPath();
      panel.visible.forEach(([x, y], i) =>
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y),
      );
      ctx.closePath();
      ctx.clip();
    }
    ctx.drawImage(canvas, x, y, width, height);
    ctx.restore();
  }
}
