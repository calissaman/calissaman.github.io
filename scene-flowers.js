import {
  clamp,
  constrainToWater,
  addRipple,
  breakFlower,
  flowerSize,
} from "./scene-model.js?v=20260912-29";

export function prepareFlowerImage(
  image,
  createCanvas = () => document.createElement("canvas"),
) {
  const canvas = createCanvas();
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let alpha = 3; alpha < pixels.data.length; alpha += 4) {
    if (pixels.data[alpha] >= 240) pixels.data[alpha] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return canvas;
}

export function createFlowers({
  stage,
  sim,
  sprites,
  sourcePoint,
  getLayout,
  isReduced,
  announce,
}) {
  const preparedSprites = sprites.map((sprite) => ({
    ...sprite,
    image: prepareFlowerImage(sprite.image),
  }));
  const cancelGestures = [];
  const buttons = sim.flowers.map((flower) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floating-flower";
    button.hidden = true;
    stage.append(button);
    let gesture = null;
    let suppressClick = false;

    button.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || gesture || !flower.active || flower.breaking)
        return;
      suppressClick = false;
      gesture = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        previous: { x: flower.x, y: flower.y, time: event.timeStamp },
        falling: flower.falling,
      };
      flower.dragged = !flower.falling;
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointermove", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 8)
        suppressClick = true;
      if (gesture.falling || !suppressClick) return;
      const point = constrainToWater(sourcePoint(event), 25);
      const dt = Math.max(
        (event.timeStamp - gesture.previous.time) / 1000,
        0.016,
      );
      flower.vx = clamp((point.x - gesture.previous.x) / dt, -35, 35);
      flower.vy = clamp((point.y - gesture.previous.y) / dt, -12, 12);
      flower.x = point.x;
      flower.y = point.y;
      gesture.previous = { ...point, time: event.timeStamp };
    });
    const finish = (event, canceled) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      suppressClick ||=
        canceled ||
        Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) >= 8;
      if (flower.dragged && suppressClick && !canceled)
        addRipple(sim, flower.x, flower.y);
      flower.dragged = false;
      gesture = null;
      if (button.hasPointerCapture(event.pointerId))
        button.releasePointerCapture(event.pointerId);
    };
    button.addEventListener("pointerup", (event) => finish(event, false));
    button.addEventListener("pointercancel", (event) => finish(event, true));
    button.addEventListener("lostpointercapture", (event) =>
      finish(event, true),
    );
    cancelGestures.push(() => {
      if (gesture) finish({ pointerId: gesture.id }, true);
    });
    button.addEventListener("click", (event) => {
      if (suppressClick && event.detail !== 0) {
        suppressClick = false;
        return;
      }
      if (!breakFlower(sim, flower, isReduced())) return;
      if (document.activeElement === button)
        stage.querySelector(".branch-hotspot").focus({ preventScroll: true });
      button.hidden = true;
      announce("The trumpet flower separates into five soft petals.");
    });
    button.addEventListener("keydown", (event) => {
      const moves = {
        ArrowLeft: [-15, 0],
        ArrowRight: [15, 0],
        ArrowUp: [0, -10],
        ArrowDown: [0, 10],
      };
      if (!moves[event.key] || flower.falling || flower.breaking) return;
      event.preventDefault();
      const [x, y] = moves[event.key];
      Object.assign(
        flower,
        constrainToWater({ x: flower.x + x, y: flower.y + y }, 25),
      );
      addRipple(sim, flower.x, flower.y);
    });
    return button;
  });

  function paintFlower(ctx, size, sprite) {
    const [x, y, width, height] = sprite.crop;
    const drawnHeight = (size * height) / width;
    ctx.drawImage(
      sprite.image,
      x,
      y,
      width,
      height,
      -size / 2,
      -drawnHeight / 2,
      size,
      drawnHeight,
    );
  }

  return {
    cancel() {
      cancelGestures.forEach((cancel) => cancel());
    },
    draw(ctx, night) {
      const layout = getLayout();
      for (const flower of sim.flowers) {
        const button = buttons[flower.id];
        const state = !flower.active
          ? "inactive"
          : flower.breaking
            ? "petals"
            : flower.falling
              ? "falling"
              : "floating";
        if (button.dataset.state !== state) {
          button.dataset.state = state;
          button.setAttribute(
            "aria-label",
            `${flower.falling ? "Falling" : "Floating"} trumpet flower ${flower.id + 1}. Click to separate its petals.${flower.falling ? "" : " Drag or use arrow keys to move."}`,
          );
        }
        button.hidden = !flower.active || flower.breaking;
        if (!flower.active) continue;
        const sprite = preparedSprites[flower.variant % preparedSprites.length];
        if (button.dataset.view !== sprite.view)
          button.dataset.view = sprite.view;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.filter = `brightness(${1 - night * 0.3})`;
        if (flower.breaking) {
          const size = flower.fragmentSize;
          for (const petal of flower.petals) {
            if (!petal.active) continue;
            ctx.save();
            ctx.translate(petal.x, petal.y);
            ctx.rotate(petal.angle);
            ctx.globalAlpha = petal.opacity;
            ctx.beginPath();
            const originX = (sprite.origin[0] - 0.5) * size;
            const originY =
              ((sprite.origin[1] - 0.5) * size * sprite.crop[3]) /
              sprite.crop[2];
            ctx.moveTo(originX, originY);
            ctx.arc(
              originX,
              originY,
              size * 2,
              sprite.edges[petal.index],
              sprite.edges[petal.index + 1],
            );
            ctx.closePath();
            ctx.clip();
            paintFlower(ctx, size, sprite);
            ctx.restore();
          }
        } else {
          const size = flowerSize(sim, flower);
          ctx.translate(flower.x, flower.y);
          ctx.rotate(flower.angle);
          if (!flower.falling) {
            ctx.save();
            ctx.translate(0, size * 0.2);
            ctx.scale(1, 0.25);
            ctx.globalAlpha = 0.16;
            paintFlower(ctx, size, sprite);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
          paintFlower(ctx, size, sprite);
          button.style.transform = `translate(${layout.x + flower.x * layout.scale - 22}px,${layout.y + flower.y * layout.scale - 22}px)`;
        }
        ctx.restore();
      }
    },
  };
}
