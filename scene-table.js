export const KOPI_CUPS = Object.freeze([
  { x: 1030, baseY: 716, width: 38, steamY: 693 },
  { x: 1097, baseY: 716, width: 40, steamY: 692 },
]);

export const NIGHT_TABLE_RECT = Object.freeze({
  x: 1016,
  y: 662,
  width: 152,
  height: 56,
});

export function prepareDinnerPatch(image, { unlit = false } = {}) {
  const rect = NIGHT_TABLE_RECT;
  const canvas = document.createElement("canvas");
  canvas.width = rect.width;
  canvas.height = rect.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height,
  );
  if (unlit) {
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(22% 29% 37%)";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }
  ctx.globalCompositeOperation = "destination-in";
  for (const [x0, y0, x1, y1] of [
    [0, 0, rect.width, 0],
    [0, 0, 0, rect.height],
  ]) {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    const fade = 3 / (x1 || y1);
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(fade, "white");
    gradient.addColorStop(1 - fade, "white");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
  }
  return canvas;
}

const preparedImages = new WeakMap();

export function prepareTableImage(
  image,
  createCanvas = () => document.createElement("canvas"),
) {
  const prepared = preparedImages.get(image);
  if (prepared) return prepared;
  const canvas = createCanvas();
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let alpha = 3; alpha < pixels.data.length; alpha += 4) {
    if (pixels.data[alpha] >= 240) pixels.data[alpha] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  preparedImages.set(image, canvas);
  preparedImages.set(canvas, canvas);
  return canvas;
}

export function tableSettingAt(minutes) {
  const time = ((minutes % 1440) + 1440) % 1440;
  if (time >= 360 && time < 1080) return "coffee";
  return "night";
}

const dinnerFrames = new WeakMap();

export function prepareDinnerFrame(
  assets,
  night,
  bistroLight,
  createCanvas = () => document.createElement("canvas"),
) {
  const dayImage = assets.dayTable || assets.nightTable;
  const nightImage = assets.nightTable || dayImage;
  const unlitImage = assets.unlitTable || nightImage;
  if (!dayImage) return null;
  const sources = [dayImage, nightImage, unlitImage];
  const weights = [1 - night, night * bistroLight, night * (1 - bistroLight)];
  const full = weights.indexOf(1);
  if (full !== -1) return prepareTableImage(sources[full]);
  let frame = dinnerFrames.get(assets);
  if (!frame) {
    const canvas = createCanvas();
    canvas.width = NIGHT_TABLE_RECT.width;
    canvas.height = NIGHT_TABLE_RECT.height;
    frame = { canvas, sources: [], weights: [] };
    dinnerFrames.set(assets, frame);
  }
  if (
    sources.every((image, i) => image === frame.sources[i]) &&
    weights.every((weight, i) => weight === frame.weights[i])
  )
    return frame.canvas;
  const ctx = frame.canvas.getContext("2d");
  ctx.clearRect(0, 0, frame.canvas.width, frame.canvas.height);
  ctx.globalCompositeOperation = "lighter";
  sources.forEach((image, i) => {
    if (weights[i] === 0) return;
    ctx.globalAlpha = weights[i];
    ctx.drawImage(
      prepareTableImage(image),
      0,
      0,
      frame.canvas.width,
      frame.canvas.height,
    );
  });
  frame.sources = sources;
  frame.weights = weights;
  return frame.canvas;
}

function drawSteam(ctx, time, reduced) {
  ctx.strokeStyle = "#fff3df";
  ctx.lineWidth = 1;
  ctx.lineCap = "round";
  for (const [cupIndex, cup] of KOPI_CUPS.entries()) {
    for (let wisp = 0; wisp < 2; wisp++) {
      const phase = reduced
        ? 0.35 + wisp * 0.3
        : (((time * 0.2 + wisp * 0.5 + cupIndex * 0.23) % 1) + 1) % 1;
      const x = cup.x + (wisp - 0.5) * 3;
      const y = cup.steamY - phase * 8;
      const length = 18 + phase * 3;
      const curl = Math.sin(phase * Math.PI * 2 + cupIndex) * 1.8;
      ctx.globalAlpha = reduced ? 0.16 : Math.sin(phase * Math.PI) * 0.25;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(
        x - 3 + curl,
        y - length * 0.3,
        x + 4 + curl,
        y - length * 0.5,
        x + 1,
        y - length * 0.65,
      );
      ctx.bezierCurveTo(
        x - 2,
        y - length * 0.8,
        x - 2 + curl,
        y - length * 0.9,
        x + curl,
        y - length,
      );
      ctx.stroke();
    }
  }
}

export function drawTableSetting(
  ctx,
  assets,
  { minutes, time, reduced = false, night = 1, bistroLight = 1 },
) {
  const setting = tableSettingAt(minutes);
  const image =
    setting === "coffee"
      ? assets.kopiCup && prepareTableImage(assets.kopiCup)
      : prepareDinnerFrame(assets, night, bistroLight);
  if (!image) return;
  ctx.save();
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  if (setting === "coffee") {
    for (const cup of KOPI_CUPS) {
      const height = (cup.width * image.height) / image.width;
      ctx.globalAlpha = 1;
      ctx.drawImage(
        image,
        cup.x - cup.width / 2,
        cup.baseY - height,
        cup.width,
        height,
      );
    }
    drawSteam(ctx, time, reduced);
  } else {
    const rect = NIGHT_TABLE_RECT;
    const scale = Math.min(
      rect.width / image.width,
      rect.height / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;
    ctx.globalAlpha = 1;
    ctx.drawImage(
      image,
      rect.x + (rect.width - width) / 2,
      rect.y + rect.height - height,
      width,
      height,
    );
  }
  ctx.restore();
}
