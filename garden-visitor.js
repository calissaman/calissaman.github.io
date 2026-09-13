const SPRITE_X = 1158;
const SPRITE_TOP = 605;
const SPRITE_WIDTH = 120;
const RISE = 140;
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
      const width = Math.max(44, 160 * layout.scale);
      const height = Math.max(44, 228 * layout.scale);
      Object.assign(button.style, {
        left: `${layout.x + 1230 * layout.scale - width / 2}px`,
        top: `${layout.y + 714 * layout.scale - height / 2}px`,
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
      ctx.moveTo(1140, 590);
      ctx.lineTo(1275, 590);
      ctx.lineTo(1275, 677);
      ctx.lineTo(1260, 674);
      ctx.lineTo(1252, 667);
      ctx.lineTo(1243, 665);
      ctx.lineTo(1236, 668);
      ctx.lineTo(1232, 673);
      ctx.lineTo(1225, 676);
      ctx.lineTo(1221, 681);
      ctx.lineTo(1216, 687);
      ctx.lineTo(1212, 696);
      ctx.lineTo(1208, 704);
      ctx.lineTo(1206, 712);
      ctx.lineTo(1196, 716);
      ctx.lineTo(1190, 724);
      ctx.lineTo(1184, 732);
      ctx.lineTo(1177, 738);
      ctx.lineTo(1140, 738);
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
