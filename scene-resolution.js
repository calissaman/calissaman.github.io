export function createSceneResolution() {
  let ratio = 1,
    ceiling = 1,
    floor = 1,
    dimensions = "",
    last = null,
    warmUntil = 0,
    elapsed = 0,
    frames = 0,
    slow = 0,
    healthy = 0,
    stalled = false;

  function resume(now) {
    last = null;
    warmUntil = now + 2000;
    elapsed = frames = slow = healthy = 0;
    stalled = false;
  }

  return {
    resize({ width, height, dpr }, now) {
      const next = `${width}/${height}/${dpr}`;
      if (next !== dimensions) {
        dimensions = next;
        ceiling = Math.min(
          dpr,
          2,
          Math.sqrt(6_000_000 / Math.max(1, width * height)),
        );
        floor = Math.min(ceiling, dpr > 1 ? 1.25 : 1);
        ratio = ceiling;
      }
      resume(now);
      return ratio;
    },
    resume,
    sample(now) {
      let interval = last === null ? 0 : now - last;
      last = now;
      if (now < warmUntil || interval <= 0) return ratio;
      // Ignore a one-off stall; repeated long frames still indicate load.
      if (interval > 100) {
        if (!stalled) {
          stalled = true;
          return ratio;
        }
        interval = 100;
      } else stalled = false;
      elapsed += interval;
      frames++;
      if (elapsed < 500) return ratio;
      const average = elapsed / frames;
      slow = average > 24 ? slow + elapsed : 0;
      healthy = average <= 20 ? healthy + elapsed : 0;
      elapsed = frames = 0;
      const next =
        slow >= 2000
          ? Math.max(floor, ratio - 0.25)
          : healthy >= 9000
            ? Math.min(ceiling, ratio + 0.25)
            : ratio;
      if (next !== ratio) {
        ratio = next;
        resume(now);
      }
      return ratio;
    },
  };
}
