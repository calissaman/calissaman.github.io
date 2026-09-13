import { prepareStreetScene } from "./street-scene.js?v=20260913-43";
import {
  nightAt,
  bloomAt,
  minutesInZone,
  formatMinutes,
  pairedClockMinutes,
  sceneLayout,
  inWaterSurface,
  createSimulation,
  addRipple,
  addFlower,
  stepSimulation,
  maintainWaterFlowers,
} from "./scene-model.js?v=20260913-63";
import {
  createRenderer,
  drawWaterFallback,
} from "./scene-renderer.js?v=20260913-60";
import {
  createSceneLighting,
  prepareLightPatches,
  SCENE_LIGHTS,
} from "./scene-lighting.js?v=20260913-64";
import { createYellowWindows } from "./yellow-windows.js?v=20260913-64";
import { createFlowers } from "./scene-flowers.js?v=20260913-63";
import { setupAudio } from "./audio.js?v=20260912-6";
import { setupTimeScroller } from "./time-scroller.js?v=20260913-61";
import {
  createWindows,
  prepareMerlionImage,
} from "./scene-windows.js?v=20260913-60";
import { prepareFacadeScene } from "./scene-facade.js?v=20260913-62";
import { createGardenVisitor } from "./garden-visitor.js?v=20260913-57";
import { prepareBistroScene } from "./bistro-scene.js?v=20260913-55";
import { createWaterSurface } from "./water-surface.js?v=20260912-29";
import { createSceneResolution } from "./scene-resolution.js?v=20260913-40";
import {
  morningGloryAt,
  drawMorningGlory,
} from "./morning-glory.js?v=20260912-31";
import {
  drawTableSetting,
  prepareTableImage,
  prepareDinnerSprite,
} from "./scene-table.js?v=20260913-56";

import {
  createTreeBlooms,
  TREE_FLOWER_CAPACITY,
  TREE_HOTSPOTS,
} from "./tree-blooms.js?v=20260913-63";
import { prepareTreeScene } from "./tree-art.js?v=20260913-63";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

export async function createScene({
  onThemeChange,
  onLiveMode,
  initialTheme,
} = {}) {
  const hero = document.querySelector(".shophouse-hero");
  if (!hero) return null;
  setupAudio();
  const stage = hero.querySelector(".scene-stage"),
    canvas = hero.querySelector(".scene-canvas"),
    objects = hero.querySelector(".scene-objects"),
    ctx = objects.getContext("2d");
  let morningGlory = null;
  loadImage("assets/scene/morning-glory.png?v=20260912-31").then(
    (image) => {
      morningGlory = image;
    },
    () => {},
  );
  const tableAssets = {
    kopiCup: null,
    nightTable: null,
    dayTable: null,
    unlitTable: null,
  };
  for (const [key, file] of [
    ["kopiCup", "kopi-cup-level.png"],
    ["dinner", "tiffin-cocktails.png"],
  ]) {
    loadImage(
      `assets/scene/${file}?v=${key === "kopiCup" ? "20260913-54" : "20260913-55"}`,
    ).then(
      (image) => {
        if (key === "kopiCup") tableAssets.kopiCup = prepareTableImage(image);
        else {
          tableAssets.dayTable = prepareDinnerSprite(image);
          tableAssets.nightTable = prepareDinnerSprite(image, { night: true });
          tableAssets.unlitTable = prepareDinnerSprite(image, { unlit: true });
        }
      },
      () => {},
    );
  }
  const images = await Promise.allSettled(
    [
      "day-v12.png",
      "night-v12.png",
      "trumpet-front-v3.png",
      "trumpet-side-v3.png",
      "bud.png",
      "bloom.png",
      "green-shutters-closed.jpg",
      "otter-window.png",
      "merlion-plush.png",
      "bistro-day-patch.png",
      "bistro-night-patch.png",
      "facade-day-floral.png",
      "facade-night-floral.png",
      "wall-lamp-day-removed.png",
      "wall-lamp-night-removed.png",
      "panel-green-symmetric.png",
      "panel-cream-symmetric.png",
      "panel-blue-symmetric.png",
      "canopy-day.png",
      "canopy-night.png",
      "angsana-flower.png",
      "yellow-window-interior.png",
    ].map((name, index) =>
      loadImage(
        `assets/scene/${name}?v=${index >= 21 ? "20260913-64" : index >= 18 ? "20260913-63" : index >= 15 ? "20260913-62" : index < 2 ? "20260913-46" : index >= 13 ? "20260913-59" : index >= 11 ? "20260913-58" : index >= 9 ? "20260913-55" : "20260912-27"}`,
      ),
    ),
  );
  const [
    originalDay,
    originalNight,
    flowerFront,
    flowerSide,
    bud,
    bloom,
    closedShutters,
    otter,
    merlion,
    bistroDayPatch,
    bistroNightPatch,
    facadeDayPatch,
    facadeNightPatch,
    wallLampDayPatch,
    wallLampNightPatch,
    panelGreen,
    panelCream,
    panelBlue,
    canopyDay,
    canopyNight,
    angsanaFlower,
    yellowInterior,
  ] = images.map((result) =>
    result.status === "fulfilled" ? result.value : null,
  );
  const panels = { green: panelGreen, cream: panelCream, blue: panelBlue };
  let day = originalDay,
    night = originalNight;
  if (day && night && canopyDay && canopyNight) {
    [day, night] = await Promise.all([
      prepareTreeScene(day, canopyDay),
      prepareTreeScene(night, canopyNight),
    ]);
  }
  if (day && night) {
    try {
      [day, night] = await Promise.all([
        prepareFacadeScene(day, {
          floral: facadeDayPatch,
          wallLamp: wallLampDayPatch,
          panels,
        }),
        prepareFacadeScene(night, {
          floral: facadeNightPatch,
          wallLamp: wallLampNightPatch,
          panels,
          night: true,
        }),
      ]);
    } catch (error) {
      console.warn("Facade artwork could not load.", error);
    }
  }
  if (day && night && bistroDayPatch && bistroNightPatch) {
    try {
      [day, night] = await Promise.all([
        prepareBistroScene(day, bistroDayPatch),
        prepareBistroScene(night, bistroNightPatch),
      ]);
    } catch (error) {
      console.warn("Bistro artwork patches could not load.", error);
    }
  }
  let dayOn = day,
    nightOn = night;
  if (day && night) {
    try {
      const [dayPatch, nightPatch] = await Promise.all([
        loadImage("assets/scene/street-day-patch.jpg?v=20260913-43"),
        loadImage("assets/scene/street-night-patch.jpg?v=20260913-43"),
      ]);
      [day, night, dayOn, nightOn] = await Promise.all([
        prepareStreetScene(day, dayPatch, { lit: false, night: false }),
        prepareStreetScene(night, nightPatch, {
          lit: false,
          night: true,
        }),
        prepareStreetScene(day, dayPatch, { lit: true, night: false }),
        prepareStreetScene(night, nightPatch, {
          lit: true,
          night: true,
        }),
      ]);
    } catch (error) {
      console.warn("Street artwork patches could not load.", error);
    }
  }
  const flower = flowerFront || flowerSide;
  const sprites = [
    {
      image: flowerFront,
      view: "front",
      crop: [16, 16, 480, 480],
      origin: [232 / 480, 300 / 480],
      edges: [-2.16, -0.78, 0.2, 1.58, 2.95, Math.PI * 2 - 2.16],
    },
    {
      image: flowerSide,
      view: "side",
      crop: [34, 28, 456, 456],
      origin: [309 / 456, 210 / 456],
      edges: [-2.7, -1.1, 0.2, 1.3, 2.9, Math.PI * 2 - 2.7],
    },
  ].filter((sprite) => sprite.image);
  const fallback = hero.querySelector(".scene-fallback");
  if (!day || !night) {
    const message =
      "Scene images could not load. Sound, music, and the rest of the site are available.";
    const available = day || night;
    if (available) fallback.src = available.src;
    else fallback.hidden = true;
    hero
      .querySelectorAll(
        ".scene-hotspot,.clock-toggle,.time-panel button,.time-panel input",
      )
      .forEach((button) => {
        button.disabled = true;
        button.title =
          "This control is unavailable because scene images could not load.";
        button.setAttribute("aria-label", button.title);
        button.removeAttribute("aria-pressed");
      });
    hero.querySelector(".clock-value").textContent = "Unavailable";
    hero.querySelector(".clock-hint").textContent =
      "Scene images could not load";
    const notice = document.createElement("p");
    notice.className = "scene-notice";
    notice.setAttribute("role", "status");
    notice.textContent = message;
    hero.append(notice);
    return null;
  }
  let renderer;
  try {
    renderer = createRenderer(canvas, day, night, { dayOn, nightOn });
  } catch (error) {
    console.warn("Using static scene fallback.", error);
  }
  const nightFallback = day.cloneNode();
  nightFallback.src = night.src;
  nightFallback.className = "scene-fallback";
  nightFallback.alt = "";
  nightFallback.setAttribute("aria-hidden", "true");
  stage.insertBefore(nightFallback, canvas);
  let greenBud = null;
  if (bud) {
    greenBud = document.createElement("canvas");
    greenBud.width = bud.width;
    greenBud.height = bud.height;
    const budContext = greenBud.getContext("2d");
    budContext.drawImage(bud, 0, 0);
    budContext.globalCompositeOperation = "source-atop";
    budContext.fillStyle = "rgba(91,119,39,.68)";
    budContext.fillRect(0, 0, bud.width, bud.height);
  }
  const sim = createSimulation({ maxFlowers: TREE_FLOWER_CAPACITY });
  const waterSurface = createWaterSurface();
  let down = null;
  const resolution = createSceneResolution();
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  if (flower) {
    [
      [555, 920],
      [780, 895],
      [930, 980],
      [1105, 951],
    ].forEach(([x, y]) => addFlower(sim, x, y));
  }
  let reduced = media.matches,
    visible = true,
    frame = 0,
    last = 0,
    width = 0,
    height = 0,
    layout,
    pixelRatio = 1;
  let city = "singapore",
    live = !initialTheme,
    environmentTime = initialTheme
      ? initialTheme === "dark"
        ? 1320
        : 720
      : minutesInZone(new Date(), city),
    targetNight = nightAt(environmentTime),
    displayNight = targetNight,
    targetBloom = bloomAt(environmentTime),
    displayBloom = targetBloom,
    targetMorningGlory = morningGloryAt(environmentTime),
    displayMorningGlory = targetMorningGlory;
  let displayedTheme = "",
    lastClock = 0;
  const clockToggle = hero.querySelector(".clock-toggle"),
    clockValue = hero.querySelector(".clock-value"),
    clockCity = hero.querySelector(".clock-city"),
    timePanel = hero.querySelector(".time-panel"),
    range = hero.querySelector("#environment-time"),
    mode = hero.querySelector(".time-mode"),
    status = hero.querySelector(".scene-status");
  const lightPatches = prepareLightPatches({
    day: dayOn,
    night: nightOn,
    dayOff: day,
    nightOff: night,
  });
  const lighting = createSceneLighting({
    stage,
    patches: lightPatches,
    announce(message) {
      status.textContent = message;
    },
  });
  lighting.update(environmentTime);
  lighting.step(1);
  const yellowWindows = createYellowWindows({
    stage,
    day: dayOn,
    night: nightOn,
    interior: yellowInterior,
    lightPatches,
    lights: SCENE_LIGHTS,
    getLightAmount: (id) => lighting.amountFor(id),
    announce: (message) => {
      status.textContent = message;
    },
  });
  const windows = createWindows({
    stage,
    closedShutters,
    otter,
    merlion: merlion ? prepareMerlionImage(merlion) : null,
    announce(message) {
      status.textContent = message;
    },
  });
  const gardenVisitor = createGardenVisitor({
    stage,
    announce(message) {
      status.textContent = message;
    },
  });
  loadImage("assets/scene/blonde-raccoon-cream.png?v=20260913-57").then(
    (image) => {
      gardenVisitor.setImage(image);
      draw();
    },
    () => {},
  );
  const timeScroller = setupTimeScroller({
    panel: timePanel,
    onTimeChange(minutes) {
      environmentTime = minutes;
      live = false;
      syncTime();
    },
  });
  const names = {
    singapore: "Singapore",
    san_francisco: "San Francisco",
    local: "Local time",
  };
  const musicMenu = hero.querySelector(".music-menu");
  musicMenu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      musicMenu.open = false;
      musicMenu.querySelector("summary").focus();
    }
  });
  function syncTime() {
    if (live) environmentTime = minutesInZone(new Date(), city);
    targetNight = nightAt(environmentTime);
    targetBloom = bloomAt(environmentTime);
    targetMorningGlory = morningGloryAt(environmentTime);
    clockValue.textContent = formatMinutes(environmentTime);
    clockCity.textContent = names[city];
    range.value = String(environmentTime);
    range.setAttribute("aria-valuetext", formatMinutes(environmentTime));
    mode.textContent = live
      ? `Live ${names[city].toLowerCase()}`
      : `Exploring ${formatMinutes(environmentTime)}`;
    const paired = pairedClockMinutes(environmentTime, city);
    hero.querySelector("#sg-clock").textContent = formatMinutes(
      paired.singapore,
    );
    hero.querySelector("#sf-clock").textContent = formatMinutes(
      paired.san_francisco,
    );
    timeScroller.update({
      minutes: environmentTime,
      city,
      live,
      sgMinutes: paired.singapore,
      sfMinutes: paired.san_francisco,
    });
    windows.update(environmentTime);
    lighting.update(environmentTime);
    const theme = targetNight > 0.45 ? "dark" : "light";
    if (displayedTheme !== theme) {
      displayedTheme = theme;
      onThemeChange?.(theme);
    }
  }
  function openTime(open) {
    if (!open) timeScroller.cancel();
    timePanel.hidden = !open;
    clockToggle.setAttribute("aria-expanded", String(open));
    if (open) timeScroller.focus();
    else clockToggle.focus();
  }
  clockToggle.addEventListener("click", () => openTime(timePanel.hidden));
  hero
    .querySelector(".time-close")
    .addEventListener("click", () => openTime(false));
  document.addEventListener("pointerdown", (e) => {
    if (musicMenu.open && !e.target.closest(".scene-sound"))
      musicMenu.open = false;
    if (!timePanel.hidden && !e.target.closest(".scene-clock")) {
      timeScroller.cancel();
      timePanel.hidden = true;
      clockToggle.setAttribute("aria-expanded", "false");
    }
  });
  timePanel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      openTime(false);
    }
  });
  range.addEventListener("input", () => {
    environmentTime = Number(range.value);
    live = false;
    syncTime();
  });
  hero.querySelectorAll("[data-city]").forEach((button) =>
    button.addEventListener("click", () => {
      timeScroller.cancel();
      city = button.dataset.city;
      live = true;
      onLiveMode?.();
      hero
        .querySelectorAll("[data-city]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      syncTime();
    }),
  );
  hero.querySelector(".return-local").addEventListener("click", () => {
    timeScroller.cancel();
    city = "local";
    live = true;
    onLiveMode?.();
    hero
      .querySelectorAll("[data-city]")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.city === city)),
      );
    syncTime();
  });
  const hotspots = TREE_HOTSPOTS;
  function resizeCanvasBuffers() {
    const bufferWidth = Math.round(width * pixelRatio);
    const bufferHeight = Math.round(height * pixelRatio);
    for (const c of [canvas, objects]) {
      if (c.width !== bufferWidth || c.height !== bufferHeight) {
        c.width = bufferWidth;
        c.height = bufferHeight;
      }
    }
  }
  function resize() {
    down = null;
    const geometryChanged =
      width !== stage.clientWidth || height !== stage.clientHeight;
    width = stage.clientWidth;
    height = stage.clientHeight;
    layout = sceneLayout(width, height);
    if (geometryChanged) waterSurface.resize({ width, height, layout });
    pixelRatio = resolution.resize(
      { width, height, dpr: window.devicePixelRatio || 1 },
      performance.now(),
    );
    resizeCanvasBuffers();
    for (const img of [fallback, nightFallback]) {
      Object.assign(img.style, {
        width: `${1536 * layout.scale}px`,
        maxWidth: "none",
        height: `${1024 * layout.scale}px`,
        left: `${layout.x}px`,
        top: `${layout.y}px`,
        objectFit: "fill",
        maskImage: layout.portrait
          ? "linear-gradient(transparent,black 11%)"
          : "none",
      });
    }
    for (const {
      selector,
      clip,
      rect: [x, y, w, h],
    } of hotspots) {
      Object.assign(hero.querySelector(selector).style, {
        clipPath: clip,
        left: `${layout.x + x * layout.scale}px`,
        top: `${layout.y + y * layout.scale}px`,
        width: `${w * layout.scale}px`,
        height: `${h * layout.scale}px`,
      });
    }
    windows.resize(layout);
    lighting.resize(layout);
    yellowWindows.resize(layout);
    gardenVisitor.resize(layout);
    draw();
  }
  function sourcePoint(e) {
    const rect = stage.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - layout.x) / layout.scale,
      y: (e.clientY - rect.top - layout.y) / layout.scale,
    };
  }
  stage.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !e.isPrimary || e.target.closest("button")) return;
    down = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  stage.addEventListener("pointercancel", (e) => {
    if (down?.id === e.pointerId) down = null;
  });
  stage.addEventListener("pointerup", (e) => {
    if (!down || down.id !== e.pointerId) return;
    const tap = Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8;
    down = null;
    const p = sourcePoint(e);
    if (tap && inWaterSurface(p.x, p.y)) {
      addRipple(sim, p.x, p.y);
      status.textContent = "Ripples spread across the water.";
    }
  });
  const flowers = createFlowers({
    stage,
    sim,
    sprites,
    sourcePoint,
    getLayout: () => layout,
    isReduced: () => reduced,
    announce: (message) => {
      status.textContent = message;
    },
  });
  const treeBlooms = createTreeBlooms(sim, {
    enabled: { trumpet: Boolean(flower), angsana: Boolean(angsanaFlower) },
    getBounds: () => ({
      left: -layout.x / layout.scale,
      right: (width - layout.x) / layout.scale,
    }),
  });
  for (const { kind, selector } of TREE_HOTSPOTS) {
    const button = hero.querySelector(selector);
    const name = kind === "trumpet" ? "trumpet" : "angsana";
    button.dataset.remaining = String(treeBlooms.remaining(kind));
    if (!(kind === "trumpet" ? flower : angsanaFlower)) {
      button.disabled = true;
      button.title = `${name} flower image could not load.`;
      button.setAttribute("aria-label", button.title);
      continue;
    }
    button.addEventListener("click", () => {
      const result = treeBlooms.release(kind, { reduced });
      button.dataset.remaining = String(result.remaining);
      button.disabled = result.remaining === 0;
      button.setAttribute(
        "aria-label",
        `Release ${name} flowers. ${result.remaining} clicks remaining.`,
      );
      status.textContent =
        kind === "trumpet"
          ? `${result.count} trumpet ${result.count === 1 ? "flower drifts" : "flowers drift"} toward the water. ${result.remaining} clicks remaining.`
          : `An angsana bloom falls onto the ground. ${result.remaining} clicks remaining.`;
    });
  }
  function draw() {
    if (!layout) return;
    waterSurface.update({
      time: sim.time,
      reduced,
      ripples: sim.ripples,
      rippleCursor: sim.rippleCursor,
    });
    const streetDay = dayOn;
    const streetNight = nightOn;
    stage.dataset.streetLights = lighting.streetLights ? "on" : "off";
    if (renderer)
      renderer.render({
        width,
        height,
        layout,
        time: sim.time,
        night: displayNight,
        reduced,
        streetLights: true,
        waterField: waterSurface.frame,
      });
    if (!renderer) {
      if (fallback.src !== streetDay.src) fallback.src = streetDay.src;
      if (nightFallback.src !== streetNight.src)
        nightFallback.src = streetNight.src;
      nightFallback.style.opacity = String(displayNight);
      stage.style.background = `rgb(${Math.round(79 - displayNight * 75)},${Math.round(163 - displayNight * 140)},${Math.round(212 - displayNight * 164)})`;
    }
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.translate(layout.x, layout.y);
    ctx.scale(layout.scale, layout.scale);
    if (!renderer)
      drawWaterFallback(ctx, {
        day: streetDay,
        nightImage: streetNight,
        layout,
        width,
        height,
        time: sim.time,
        night: displayNight,
        reduced,
        waterField: waterSurface.frame,
      });
    lighting.draw(ctx, displayNight);
    yellowWindows.draw(ctx, displayNight);
    windows.draw(ctx, displayNight);
    drawTableSetting(ctx, tableAssets, {
      night: displayNight,
      bistroLight: lighting.bistroLight,
      minutes: environmentTime,
      time: sim.time,
      reduced,
    });
    gardenVisitor.draw(ctx, displayNight);
    drawMorningGlory(ctx, morningGlory, displayMorningGlory, displayNight);
    flowers.draw(ctx, displayNight);
    treeBlooms.draw(ctx, angsanaFlower, displayNight);
    for (const [x, y, angle] of [
      [701, 690, -0.24],
      [744, 681, 0.18],
    ]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      if (greenBud && displayBloom < 0.999) {
        ctx.globalAlpha = 1 - displayBloom;
        ctx.drawImage(greenBud, -4, -13, 8, 22);
      }
      if (bloom && displayBloom > 0.001) {
        ctx.globalAlpha = displayBloom;
        const size = 12 + displayBloom * 24;
        ctx.drawImage(bloom, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    }
  }

  function tick(now) {
    frame = 0;
    if (document.hidden || !visible) return;
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    stepSimulation(sim, dt, reduced);
    treeBlooms.step(reduced);
    if (flower) maintainWaterFlowers(sim);
    const easing = 1 - Math.exp(-Math.min(dt, 0.05) * (reduced ? 16 : 4));
    displayNight += (targetNight - displayNight) * easing;
    displayBloom += (targetBloom - displayBloom) * easing;
    displayMorningGlory = reduced
      ? targetMorningGlory
      : displayMorningGlory +
        (targetMorningGlory - displayMorningGlory) * easing;
    windows.step(easing);
    gardenVisitor.step(dt, reduced);
    lighting.step(easing);
    yellowWindows.step(easing, reduced);
    if (now - lastClock > 1000) {
      syncTime();
      lastClock = now;
    }
    const nextRatio = resolution.sample(now);
    if (nextRatio !== pixelRatio) {
      pixelRatio = nextRatio;
      resizeCanvasBuffers();
    }
    draw();
    frame = requestAnimationFrame(tick);
  }
  function resume() {
    if (document.hidden || !visible) return;
    hero.dataset.motion = reduced ? "reduced" : "running";
    last = 0;
    resolution.resume(performance.now());
    if (!frame) frame = requestAnimationFrame(tick);
  }
  function pause() {
    down = null;
    hero.dataset.motion = "paused";
    if (!visible) {
      musicMenu.open = false;
      timeScroller.cancel();
      timePanel.hidden = true;
      clockToggle.setAttribute("aria-expanded", "false");
    }
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    flowers.cancel();
  }
  document.addEventListener("visibilitychange", () =>
    document.hidden ? pause() : resume(),
  );
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      visible ? resume() : pause();
    },
    { threshold: 0 },
  ).observe(hero);
  new ResizeObserver(resize).observe(stage);
  window.addEventListener("resize", resize);
  media.addEventListener("change", () => {
    reduced = media.matches;
    resume();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    renderer = null;
    canvas.classList.remove("is-ready");
    status.textContent =
      "Using image mode. Lights, windows, flowers and time remain interactive.";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    try {
      renderer = createRenderer(canvas, day, night, { dayOn, nightOn });
    } catch (error) {
      renderer = null;
      console.warn(error);
    }
    canvas.classList.toggle("is-ready", Boolean(renderer));
    if (renderer)
      status.textContent = "Interactive lighting controls are available again.";
    resume();
  });
  window.addEventListener("pagehide", pause);
  window.addEventListener("pageshow", resume);
  syncTime();
  resize();
  if (renderer) canvas.classList.add("is-ready");
  resume();
  return {
    setTheme(theme) {
      timeScroller.cancel();
      live = false;
      environmentTime = theme === "dark" ? 22 * 60 : 12 * 60;
      syncTime();
    },
  };
}
