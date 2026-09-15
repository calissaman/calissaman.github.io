const REGIONS = [
  [
    [1270, 0],
    [1536, 0],
    [1536, 850],
    [1350, 824],
    [1300, 799],
    [1310, 760],
    [1310, 710],
    [1265, 666],
    [1210, 648],
    [1208, 565],
    [1195, 508],
    [1196, 380],
    [1180, 310],
    [1210, 250],
    [1190, 185],
  ],
  [
    [382, 615],
    [420, 615],
    [420, 744],
    [323, 742],
    [334, 700],
    [354, 673],
  ],
];

export function prepareFoliage(image) {
  if (!image) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.scale(image.width / 1536, image.height / 1024);
  ctx.beginPath();
  for (const points of REGIONS) {
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.clip();
  ctx.drawImage(image, 0, 0, 1536, 1024);
  return canvas;
}

export function drawFoliage(ctx, images, night) {
  ctx.save();
  images.forEach((image, index) => {
    if (!image) return;
    ctx.globalAlpha = index ? night : 1;
    ctx.drawImage(image, 0, 0, 1536, 1024);
  });
  ctx.restore();
}
