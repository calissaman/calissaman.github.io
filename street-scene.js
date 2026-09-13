export function streetLightsAt(minutes) {
  return minutes >= 17 * 60 + 30 || minutes < 4 * 60;
}

// Every edit stays left of the shophouses (which begin around x=425).
export const STREET_EDIT_LIMIT = 400;

export async function prepareStreetScene(original, patch, { lit, night }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1536;
  canvas.height = 1024;
  const mask = document.createElement("canvas");
  mask.width = canvas.width;
  mask.height = canvas.height;
  const paint = mask.getContext("2d");
  paint.fillStyle = "white";
  paint.filter = "blur(2px)";
  paint.fillRect(148, 695, 177, 51);
  if (!lit) {
    paint.fillRect(139, 613, 218, 141);
    paint.beginPath();
    paint.ellipse(85, 650, 27, 30, 0, 0, Math.PI * 2);
    paint.fill();
    if (night) {
      paint.beginPath();
      [
        [166, 751],
        [363, 751],
        [391, 1024],
        [302, 1024],
        [239, 928],
        [202, 863],
        [165, 804],
      ].forEach(([x, y], i) => (i ? paint.lineTo(x, y) : paint.moveTo(x, y)));
      paint.closePath();
      paint.fill();
    }
  }
  paint.filter = "none";
  paint.globalCompositeOperation = "source-in";
  paint.drawImage(patch, 0, 0, 1536, 1024);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(original, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, STREET_EDIT_LIMIT, 1024);
  ctx.clip();
  ctx.drawImage(mask, 0, 0);
  ctx.restore();
  const image = new Image();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve));
  image.src = URL.createObjectURL(blob);
  await image.decode();
  return image;
}
