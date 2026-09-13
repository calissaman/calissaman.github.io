import { windowVisitorAt } from "./scene-model.js?v=20260913-42";
import { traceGreenWindows } from "./scene-facade.js?v=20260913-58";

export function prepareMerlionImage(
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

export function createWindows({
  stage,
  closedShutters,
  otter,
  merlion,
  announce,
}) {
  const green = document.createElement("button");
  green.type = "button";
  green.className = "scene-hotspot green-window-hotspot";
  green.setAttribute("aria-pressed", "false");
  green.setAttribute(
    "aria-label",
    "Close the upstairs shutters of the red, green and white shophouse",
  );
  green.title = "Open or close the upstairs shutters";
  green.disabled = !closedShutters;
  stage.append(green);

  const blueWindows = [
    {
      visitor: "otter",
      name: "A little otter",
      side: "left",
      className: "blue-window-hotspot",
      image: otter,
      rect: [963, 206, 88, 175],
      opening: [
        [1007, 233],
        [1035, 224],
        [1036, 371],
        [1007, 377],
      ],
      crop: [33, 25, 324, 298],
      x: 1007,
      width: 28,
      baseline: 374,
    },
    {
      visitor: "merlion",
      name: "A white Merlion plushie",
      side: "right",
      className: "merlion-window-hotspot",
      image: merlion,
      rect: [1094, 209, 87, 153],
      opening: [
        [1100, 222],
        [1128, 218],
        [1130, 353],
        [1101, 357],
      ],
      crop: [114, 18, 154, 354],
      x: 1101,
      width: 27,
      baseline: 355,
    },
  ].map((window) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `scene-hotspot ${window.className}`;
    button.setAttribute(
      "aria-label",
      `Look for ${window.visitor === "otter" ? "the otter" : "the Merlion plushie"} in the ${window.side} blue shophouse upstairs window`,
    );
    button.setAttribute("aria-pressed", "false");
    button.title = "Take a closer look";
    stage.append(button);
    return {
      ...window,
      button,
      active: false,
      revealed: false,
      revealAmount: 0,
    };
  });

  let closed = false;
  let closedAmount = 0;
  green.addEventListener("click", () => {
    closed = !closed;
    green.setAttribute("aria-pressed", String(closed));
    green.setAttribute(
      "aria-label",
      `${closed ? "Open" : "Close"} the upstairs shutters of the red, green and white shophouse`,
    );
    announce(`The green shophouse shutters are ${closed ? "closed" : "open"}.`);
  });
  for (const window of blueWindows) {
    window.button.addEventListener("click", () => {
      if (!window.active) {
        announce(
          `The ${window.side} blue upstairs window is quiet at this hour.`,
        );
        return;
      }
      if (!window.image) {
        announce(
          "The blue upstairs visitor is unavailable because its image could not load.",
        );
        return;
      }
      window.revealed = !window.revealed;
      window.button.setAttribute("aria-pressed", String(window.revealed));
      announce(
        `${window.name} ${window.revealed ? "peeks out from" : "settles back inside"} the ${window.side} blue upstairs window.`,
      );
    });
  }

  return {
    update(minutes) {
      const visitor = windowVisitorAt(minutes);
      for (const window of blueWindows) {
        const active = visitor === window.visitor;
        if (active !== window.active) {
          window.active = active;
          window.revealed = false;
          window.revealAmount = 0;
          window.button.setAttribute("aria-pressed", "false");
        }
        window.button.dataset.visitor = active ? window.visitor : "none";
      }
    },
    resize(layout) {
      for (const [button, rect] of [
        [green, [444, 279, 194, 151]],
        ...blueWindows.map((window) => [window.button, window.rect]),
      ]) {
        const [x, y, width, height] = rect;
        Object.assign(button.style, {
          left: `${layout.x + x * layout.scale}px`,
          top: `${layout.y + y * layout.scale}px`,
          width: `${width * layout.scale}px`,
          height: `${height * layout.scale}px`,
        });
      }
    },
    step(easing) {
      closedAmount += (Number(closed) - closedAmount) * easing;
      for (const window of blueWindows) {
        window.revealAmount +=
          (Number(window.revealed) - window.revealAmount) * easing;
      }
    },
    draw(ctx, night) {
      if (closedShutters && closedAmount > 0.001) {
        ctx.save();
        ctx.beginPath();
        traceGreenWindows(ctx);
        ctx.clip();
        ctx.globalAlpha = closedAmount;
        ctx.filter = `brightness(${1 - night * 0.6})`;
        ctx.drawImage(closedShutters, 434, 267, 212, 170);
        ctx.restore();
      }
      for (const window of blueWindows) {
        if (!window.active || !window.image) continue;
        ctx.save();
        ctx.beginPath();
        window.opening.forEach(([x, y], index) => {
          if (index === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.clip();
        if (window.visitor === "merlion") {
          const recess = ctx.createLinearGradient(1100, 218, 1130, 357);
          recess.addColorStop(0, "#0b1c24");
          recess.addColorStop(0.6, "#122a31");
          recess.addColorStop(1, "#1b292a");
          ctx.globalAlpha = 1;
          ctx.fillStyle = recess;
          ctx.fillRect(1100, 218, 30, 139);
        }
        const height = (window.width * window.crop[3]) / window.crop[2];
        const hiddenTravel =
          window.visitor === "otter"
            ? height +
              Math.max(...window.opening.map(([, y]) => y)) -
              window.baseline +
              1
            : height * 0.58;
        const concealed = hiddenTravel * (1 - window.revealAmount);
        ctx.globalAlpha = window.visitor === "merlion" ? 1 : 0.88;
        ctx.filter =
          window.visitor === "merlion"
            ? "none"
            : `brightness(${0.86 + night * 0.1})`;
        ctx.drawImage(
          window.image,
          ...window.crop,
          window.x,
          window.baseline - height + concealed,
          window.width,
          height,
        );
        ctx.restore();
      }
    },
  };
}
