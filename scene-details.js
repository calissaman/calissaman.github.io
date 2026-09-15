import { drawFacadePanels } from "./facade-panels.js?v=20260915-82";
import {
  drawPinkWindowTrim,
  drawPinkVineJoin,
} from "./pink-facade.js?v=20260914-77";
import {
  BISTRO_ROOM_RECT,
  prepareBistroDetails,
} from "./bistro-scene.js?v=20260914-77";
import { drawBluePillar } from "./pillar-art.js?v=20260914-74";
import { drawMorningGloryVine } from "./morning-glory.js?v=20260914-75";
import {
  drawMatchingBlueShutter,
  drawBlueWindowTrim,
  drawWhiteFacade,
} from "./scene-facade.js?v=20260914-78";

const RECT = { x: 410, y: 0, width: 860, height: 832 };
const OUTLINE = [
  [425, 204],
  [675, 144],
  [675, 129],
  [902, 73],
  [914, 48],
  [1005, 27],
  [1005, 0],
  [1260, 0],
  [1260, 824],
  [425, 781],
];

export function createSceneDetails({
  stage,
  day,
  night,
  bistro,
  pillars = [],
  vines = [],
  blueShutters = [],
  blueTrim = [],
  pinkTrim = [],
  panels = {},
  whiteFacades = [],
  whiteSill,
  pinkVineJoins = [],
}) {
  if (!day || !night) return { resize() {}, draw() {} };
  const canvas = document.createElement("canvas");
  canvas.className = "scene-details";
  canvas.setAttribute("aria-hidden", "true");
  stage.append(canvas);
  const ctx = canvas.getContext("2d");
  const bistroImages = bistro
    ? [prepareBistroDetails(bistro), prepareBistroDetails(bistro, true)]
    : [];
  const facadePanels = Object.keys(panels).length
    ? [false, true].map((night) => {
        const panel = document.createElement("canvas");
        panel.width = 2190;
        panel.height = 327;
        const paint = panel.getContext("2d");
        paint.scale(3, 3);
        paint.translate(-465, -376);
        drawFacadePanels(paint, panels, { night, pixelRatio: 3 });
        return panel;
      })
    : [];
  let geometry = "",
    lastTone = -1;

  return {
    resize(layout, dpr) {
      const width = RECT.width * layout.scale;
      const height = RECT.height * layout.scale;
      const density = Math.min(dpr, 3, Math.sqrt(3_000_000 / (width * height)));
      const next = `${width}/${height}/${density}/${layout.portrait}`;
      Object.assign(canvas.style, {
        left: `${layout.x + RECT.x * layout.scale}px`,
        top: `${layout.y}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
      if (next === geometry) return;
      geometry = next;
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      lastTone = -1;
    },
    draw(amount) {
      const tone = Math.round(amount * 255);
      if (!geometry || tone === lastTone) return;
      lastTone = tone;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(canvas.width / RECT.width, canvas.height / RECT.height);
      ctx.translate(-RECT.x, -RECT.y);
      ctx.imageSmoothingQuality = "high";
      ctx.beginPath();
      OUTLINE.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();
      for (const [i, source] of [day, night].entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        if (!ctx.globalAlpha) continue;
        ctx.drawImage(source, 0, 0, 1536, 1024);
      }
      for (const [i, image] of bistroImages.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        const { x, y, width, height } = BISTRO_ROOM_RECT;
        ctx.drawImage(image, x, y, width, height);
      }
      for (const [i, image] of pillars.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawBluePillar(ctx, image);
      }
      for (const [i, image] of whiteFacades.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawWhiteFacade(ctx, image, i ? whiteSill : null);
      }
      for (const [i, image] of pinkTrim.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawPinkWindowTrim(ctx, image);
      }
      for (const [i, image] of facadePanels.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        ctx.drawImage(image, 465, 376, 730, 109);
      }
      for (const [i, image] of vines.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawMorningGloryVine(ctx, image);
      }
      for (const [i, image] of pinkVineJoins.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawPinkVineJoin(ctx, image);
      }
      for (const [i, image] of blueTrim.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawBlueWindowTrim(ctx, image);
      }
      for (const [i, image] of blueShutters.entries()) {
        ctx.globalAlpha = i ? tone / 255 : 1;
        drawMatchingBlueShutter(ctx, image);
      }
      ctx.restore();
    },
  };
}
