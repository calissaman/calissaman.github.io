import { windowVisitorAt } from "./scene-model.js?v=20260912-29";

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
  const blue = document.createElement("button");
  blue.type = "button";
  blue.className = "scene-hotspot blue-window-hotspot";
  blue.setAttribute(
    "aria-label",
    "Look into the blue shophouse upstairs window",
  );
  blue.setAttribute("aria-pressed", "false");
  blue.title = "Take a closer look";
  stage.append(green, blue);

  let closed = false;
  let closedAmount = 0;
  let visitor = null;
  let revealed = false;
  let revealAmount = 0;
  green.addEventListener("click", () => {
    closed = !closed;
    green.setAttribute("aria-pressed", String(closed));
    green.setAttribute(
      "aria-label",
      `${closed ? "Open" : "Close"} the upstairs shutters of the red, green and white shophouse`,
    );
    announce(`The green shophouse shutters are ${closed ? "closed" : "open"}.`);
  });
  blue.addEventListener("click", () => {
    if (visitor && !(visitor === "otter" ? otter : merlion)) {
      announce(
        "The blue upstairs visitor is unavailable because its image could not load.",
      );
      return;
    }
    revealed = visitor ? !revealed : false;
    blue.setAttribute("aria-pressed", String(revealed));
    announce(
      visitor
        ? `${visitor === "otter" ? "A little otter" : "A white Merlion plushie"} ${revealed ? "peeks out from" : "settles back inside"} the blue upstairs window.`
        : "The blue upstairs window is quiet at this hour.",
    );
  });

  return {
    update(minutes) {
      const nextVisitor = windowVisitorAt(minutes);
      if (nextVisitor !== visitor) {
        visitor = nextVisitor;
        revealed = false;
        revealAmount = 0;
        blue.setAttribute("aria-pressed", "false");
      }
      blue.dataset.visitor = visitor || "none";
    },
    resize(layout) {
      for (const [button, rect] of [
        [green, [444, 279, 194, 151]],
        [blue, [963, 206, 88, 175]],
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
      revealAmount += (Number(revealed) - revealAmount) * easing;
    },
    draw(ctx, night) {
      if (closedShutters && closedAmount > 0.001) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(442, 306);
        ctx.lineTo(638, 273);
        ctx.lineTo(640, 413);
        ctx.lineTo(447, 434);
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = closedAmount;
        ctx.filter = `brightness(${1 - night * 0.6})`;
        ctx.drawImage(closedShutters, 434, 267, 212, 170);
        ctx.restore();
      }
      const image =
        visitor === "otter" ? otter : visitor === "merlion" ? merlion : null;
      if (!image) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(1007, 233);
      ctx.lineTo(1035, 224);
      ctx.lineTo(1036, 371);
      ctx.lineTo(1007, 377);
      ctx.closePath();
      ctx.clip();
      const width = 28;
      const crop =
        visitor === "otter" ? [33, 25, 324, 298] : [114, 18, 154, 354];
      const height = (width * crop[3]) / crop[2];
      const concealed = height * 0.58 * (1 - revealAmount);
      ctx.globalAlpha = 0.88;
      ctx.filter = `brightness(${0.86 + night * 0.1})`;
      ctx.drawImage(
        image,
        ...crop,
        1007,
        374 - height + concealed,
        width,
        height,
      );
      ctx.restore();
    },
  };
}
