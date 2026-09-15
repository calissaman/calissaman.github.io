import { play } from "./vendor/cuelume-0.2.2/dist/index.js";

export function setupInteractionAudio() {
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".clock-toggle, .time-close")) {
      play("pulse", { volume: 0.5 });
    } else if (
      event.target.closest(
        ".ambient-toggle, .music-menu summary, .music-controls button:not(:disabled)",
      )
    ) {
      play("press", { volume: 0.5 });
    }
  });

  let lastVolumeCue = -Infinity;
  document.addEventListener("input", (event) => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    if (!event.target.matches("#water-volume, #music-volume")) return;
    const now = performance.now();
    if (now - lastVolumeCue < 90) return;
    lastVolumeCue = now;
    play("press", { volume: 0.35 });
  });
}
