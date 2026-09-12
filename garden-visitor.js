const SPRITE_X = 1181;
const SPRITE_TOP = 625;
const SPRITE_WIDTH = 80;
const RISE = 90;
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
    announce(
      `The blonde raccoon ${revealed ? "peeks out from behind" : "settles back behind"} the hydrangeas.`,
    );
  });

  return {
    setImage(nextImage) {
      image = nextImage;
      button.disabled = !image;
      revealed = false;
      amount = 0;
      updateLabel();
    },
    resize(layout) {
      const width = Math.max(44, 130 * layout.scale);
      const height = Math.max(44, 202 * layout.scale);
      Object.assign(button.style, {
        left: `${layout.x + 1245 * layout.scale - width / 2}px`,
        top: `${layout.y + 726 * layout.scale - height / 2}px`,
        width: `${width}px`,
        height: `${height}px`,
      });
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
      ctx.moveTo(1174, 610);
      ctx.lineTo(1268, 610);
      ctx.lineTo(1268, 677);
      ctx.lineTo(1254, 674);
      ctx.lineTo(1242, 667);
      ctx.lineTo(1227, 668);
      ctx.lineTo(1214, 674);
      ctx.lineTo(1207, 687);
      ctx.lineTo(1205, 699);
      ctx.lineTo(1194, 704);
      ctx.lineTo(1186, 714);
      ctx.lineTo(1174, 718);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.filter = `brightness(${0.96 - Math.max(0, Math.min(1, night)) * 0.18})`;
      ctx.drawImage(
        image,
        SPRITE_X,
        SPRITE_TOP + RISE * (1 - eased),
        SPRITE_WIDTH,
        (SPRITE_WIDTH * height) / width,
      );
      ctx.restore();
    },
  };
}
