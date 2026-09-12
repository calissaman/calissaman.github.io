export function setupEvalTiles() {
  document.querySelectorAll(".eval-tile-art").forEach(setupFigure);
}

function setupFigure(figure) {
  const panel = figure.querySelector(".eval-tile-panel");
  const replay = figure.querySelector(".eval-tiles-replay");
  if (!panel || !replay) return;

  const tiles = Array.from(panel.querySelectorAll(".eval-tile"));
  const rows = figure.dataset.tileMotion === "rows";
  panel.dataset.assembly = "ready";
  replay.hidden = true;
  if (
    tiles.length !== (rows ? 8 : 12) ||
    tiles.some((tile) => typeof tile.animate !== "function") ||
    !("IntersectionObserver" in window)
  ) {
    panel.dataset.assembly = "assembled";
    return;
  }

  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animations = [];
  let generation = 0;
  let hasPlayed = false;
  let visible = false;
  let arrivalVisible = false;
  let textureReady = false;
  let textureSettled = false;

  function finishImmediately() {
    generation++;
    animations.forEach((animation) => {
      animation.finish();
      animation.cancel();
    });
    animations = [];
    hasPlayed = true;
    panel.dataset.assembly = "assembled";
  }

  function assemble() {
    if (!textureReady || preference.matches) return;
    const currentGeneration = ++generation;
    animations.forEach((animation) => animation.cancel());
    hasPlayed = true;
    animations = tiles.flatMap((tile, index) => {
      if (rows) {
        const row = Math.floor(index / 2);
        const column = index % 2;
        const direction = row % 2 === 0 ? -1 : 1;
        const arrival = tile.animate(
          [
            {
              transform: `translateX(${direction * 50}px) rotateY(${-direction * 10}deg)`,
              opacity: 0.2,
            },
            { transform: "none", opacity: 1 },
          ],
          {
            duration: 1100,
            delay: row * 180 + column * 60,
            easing: "cubic-bezier(0.2, 0.65, 0.3, 1)",
            fill: "both",
          },
        );
        const glint = tile.querySelector(".eval-tile-glint");
        if (typeof glint?.animate !== "function") return arrival;
        const glaze = glint.animate(
          [
            { transform: "translateX(-160%) skewX(-16deg)", opacity: 0 },
            { opacity: 0.55, offset: 0.35 },
            { opacity: 0.4, offset: 0.7 },
            { transform: "translateX(360%) skewX(-16deg)", opacity: 0 },
          ],
          {
            duration: 900,
            delay: 700 + row * 180 + column * 60,
            easing: "ease-in-out",
            fill: "both",
          },
        );
        return [arrival, glaze];
      }
      const row = Math.floor(index / 3);
      const column = index % 3;
      const x = (column - 1) * 28;
      const y = (row - 1.5) * 16;
      const rotation = (row + column) % 2 === 0 ? -5 : 5;
      return tile.animate(
        [
          {
            transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
            opacity: 0.25,
          },
          { transform: "none", opacity: 1 },
        ],
        {
          duration: 820,
          delay: index * 60,
          easing: "cubic-bezier(0.2, 0.65, 0.3, 1)",
          fill: "both",
        },
      );
    });
    Promise.all(animations.map((animation) => animation.finished))
      .then(() => {
        if (currentGeneration !== generation) return;
        animations.forEach((animation) => animation.cancel());
        animations = [];
        panel.dataset.assembly = "assembled";
      })
      .catch(() => {});
    syncPlayback();
  }

  function syncPlayback() {
    if (animations.length) {
      const playing = visible && !document.hidden;
      animations.forEach((animation) => {
        if (animation.playState === "finished") return;
        if (playing) animation.play();
        else animation.pause();
      });
      panel.dataset.assembly = playing ? "assembling" : "paused";
    } else if (
      textureReady &&
      !hasPlayed &&
      arrivalVisible &&
      !document.hidden &&
      !preference.matches
    ) {
      assemble();
    }
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      arrivalVisible = visible && entry.intersectionRatio >= 0.3;
      syncPlayback();
    },
    { threshold: [0, 0.3] },
  );
  observer.observe(panel);
  document.addEventListener("visibilitychange", syncPlayback);
  replay.addEventListener("click", assemble);
  preference.addEventListener("change", () => {
    replay.hidden = preference.matches || !textureReady;
    if (preference.matches) finishImmediately();
  });
  if (preference.matches) finishImmediately();

  const textureUrl = getComputedStyle(tiles[0]).backgroundImage.match(
    /url\(["']?([^"')]+)["']?\)/,
  )?.[1];
  if (!textureUrl) {
    finishImmediately();
    return;
  }

  const image = new Image();
  const timeout = window.setTimeout(() => settleTexture(false), 6000);
  function settleTexture(loaded) {
    if (textureSettled) return;
    textureSettled = true;
    window.clearTimeout(timeout);
    image.onload = null;
    image.onerror = null;
    textureReady = loaded;
    replay.hidden = !loaded || preference.matches;
    if (loaded) syncPlayback();
    else finishImmediately();
  }
  image.onload = () => {
    if (typeof image.decode === "function") {
      image.decode().then(
        () => settleTexture(true),
        () => settleTexture(false),
      );
    } else {
      settleTexture(true);
    }
  };
  image.onerror = () => settleTexture(false);
  image.src = textureUrl;
}
