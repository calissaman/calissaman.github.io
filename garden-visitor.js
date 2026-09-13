const SPRITE_X = 1108.9;
const SPRITE_TOP = 706.7;
const SPRITE_WIDTH = 70.2;
const STEP_OUT = 140;
const DURATION = 0.6;

export function createGardenVisitor({ stage, announce = () => {} }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "scene-hotspot raccoon-hotspot";
  button.disabled = true;
  button.setAttribute(
    "aria-label",
    "Reveal the blonde raccoon behind the hydrangeas",
  );
  button.setAttribute("aria-pressed", "false");
  button.title = "Look behind the hydrangeas";
  button.style.touchAction = "pan-y";
  stage.append(button);

  let image = null;
  let revealed = false;
  let amount = 0;
  let quiet = false;
  let layout = null;

  function placeButton() {
    if (!layout) return;
    const spriteHeight = image
      ? (SPRITE_WIDTH * image.naturalHeight) / image.naturalWidth
      : SPRITE_WIDTH * 1.5;
    const [x, y, w, h] = revealed
      ? [SPRITE_X, SPRITE_TOP, SPRITE_WIDTH, spriteHeight]
      : [1178, 660, 118, 168];
    const width = Math.max(44, w * layout.scale);
    const height = Math.max(44, h * layout.scale);
    Object.assign(button.style, {
      left: `${layout.x + (x + w / 2) * layout.scale - width / 2}px`,
      top: `${layout.y + (y + h / 2) * layout.scale - height / 2}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
  }

  function updateLabel() {
    button.setAttribute("aria-pressed", String(revealed));
    button.setAttribute(
      "aria-label",
      `${revealed ? "Hide" : "Reveal"} the blonde raccoon behind the hydrangeas`,
    );
  }

  button.addEventListener("click", () => {
    if (!image) return;
    revealed = !revealed;
    if (quiet) amount = Number(revealed);
    updateLabel();
    placeButton();
    announce(
      `The blonde raccoon ${revealed ? "steps out from behind" : "settles back behind"} the hydrangeas.`,
    );
  });

  return {
    setImage(nextImage) {
      image = nextImage;
      button.disabled = !image;
      revealed = false;
      amount = 0;
      updateLabel();
      placeButton();
    },
    resize(nextLayout) {
      layout = nextLayout;
      placeButton();
    },
    step(dt, reduced) {
      quiet = Boolean(reduced);
      if (quiet) {
        amount = Number(revealed);
        return;
      }
      const increment = dt / DURATION;
      amount = revealed
        ? Math.min(1, amount + increment)
        : Math.max(0, amount - increment);
    },
    draw(ctx, night = 0) {
      if (!image || amount <= 0) return;
      const eased = amount * amount * (3 - 2 * amount);
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(1040, 628);
      ctx.lineTo(1198, 628);
      ctx.lineTo(1198, 840);
      ctx.lineTo(1040, 840);
      ctx.closePath();
      ctx.clip();
      const x = SPRITE_X + STEP_OUT * (1 - eased);
      const y = SPRITE_TOP + 14 * (1 - eased);
      const spriteHeight = (SPRITE_WIDTH * height) / width;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.18 * eased;
      ctx.fillStyle = "#14271f";
      ctx.beginPath();
      ctx.ellipse(
        x + SPRITE_WIDTH * 0.6,
        y + spriteHeight * 0.977,
        SPRITE_WIDTH * 0.31,
        1.95,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = `brightness(${0.96 - Math.max(0, Math.min(1, night)) * 0.18})`;
      ctx.drawImage(image, x, y, SPRITE_WIDTH, spriteHeight);
      ctx.restore();
    },
  };
}
