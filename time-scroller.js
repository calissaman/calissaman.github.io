const clampMinutes = (minutes) =>
  Math.max(0, Math.min(1439, Math.round(minutes)));

function fadeBetween(start, end, value) {
  const fraction = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return fraction * fraction * (3 - 2 * fraction);
}

function clockParts(minutes) {
  if (!Number.isFinite(minutes)) return { digits: "—", period: "", iso: "" };
  const value = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(value / 60);
  const mins = String(value % 60).padStart(2, "0");
  return {
    digits: `${hours % 12 || 12}:${mins}`,
    period: hours < 12 ? "a.m." : "p.m.",
    iso: `${String(hours).padStart(2, "0")}:${mins}`,
  };
}

export function setupTimeScroller({ panel, onTimeChange }) {
  const range = panel.querySelector("#environment-time");
  const toolbar = panel.querySelector(".time-toolbar");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const names = {
    singapore: "Singapore",
    san_francisco: "San Francisco",
    local: "Local time",
  };
  let state = {
    minutes: clampMinutes(Number(range.value)),
    city: "singapore",
    live: true,
    sgMinutes: null,
    sfMinutes: null,
  };
  let drag = null;
  let wheelRemainder = 0;
  let visualMinutes = state.minutes;
  let animationFrame = 0;

  const choices = document.createElement("div");
  choices.className = "time-view-options";
  choices.setAttribute("role", "group");
  choices.setAttribute("aria-label", "Time control view");
  choices.innerHTML = `
    <button type="button" data-time-view="breeze" aria-pressed="true">Breeze blocks</button>
    <button type="button" data-time-view="slider" aria-pressed="false">Tile slider</button>`;
  toolbar.prepend(choices);

  const view = document.createElement("div");
  const railId = `${panel.id || "time-panel"}-breeze`;
  view.className = "breeze-time-view";
  view.innerHTML = `
    <div class="breeze-time-stage">
      <div class="breeze-time-clock breeze-time-sg" role="group" aria-label="Singapore time">
        <time><span class="breeze-clock-digits">—</span><span class="breeze-clock-period"></span></time>
        <span class="breeze-city-label">Singapore</span>
      </div>
      <div class="breeze-time-rail" id="${railId}" tabindex="0" role="slider"
        aria-label="Time of day" aria-orientation="vertical" aria-valuemin="0"
        aria-valuemax="1439" aria-valuenow="720" aria-describedby="${railId}-hint">
        <div class="breeze-block-stack" aria-hidden="true">
          ${Array.from(
            { length: 11 },
            () => `
            <img class="breeze-time-block breeze-time-block-flow"
              src="assets/scene/time-breeze-block.png?v=20260912-18" alt="" width="512" height="512"
              draggable="false"/>`,
          ).join("")}
        </div>
      </div>
      <div class="breeze-time-clock breeze-time-sf" role="group" aria-label="San Francisco time">
        <time><span class="breeze-clock-digits">—</span><span class="breeze-clock-period"></span></time>
        <span class="breeze-city-label">San Francisco</span>
      </div>
    </div>
    <p class="breeze-time-hint" id="${railId}-hint">Drag, scroll, or use arrow keys.</p>`;
  panel.querySelector(".city-clocks").before(view);

  const rail = view.querySelector(".breeze-time-rail");
  const flowingTiles = Array.from(
    view.querySelectorAll(".breeze-time-block-flow"),
  );
  const cityClocks = [
    [view.querySelector(".breeze-time-sg"), "sgMinutes"],
    [view.querySelector(".breeze-time-sf"), "sfMinutes"],
  ];
  const viewButtons = Array.from(choices.querySelectorAll("button"));
  viewButtons.forEach((button) =>
    button.setAttribute(
      "aria-controls",
      button.dataset.timeView === "breeze" ? railId : range.id,
    ),
  );

  function update(next) {
    const externalChange =
      (next.minutes !== undefined &&
        clampMinutes(next.minutes) !== state.minutes) ||
      (next.city !== undefined && next.city !== state.city) ||
      (next.live !== undefined && next.live !== state.live);
    state = { ...state, ...next };
    state.minutes = clampMinutes(state.minutes);
    const selected = clockParts(state.minutes);
    const label = `${selected.digits} ${selected.period}`;
    range.value = String(state.minutes);
    range.setAttribute("aria-valuetext", label);
    rail.setAttribute("aria-valuenow", String(state.minutes));
    rail.setAttribute(
      "aria-valuetext",
      `${names[state.city] || "Local time"}, ${label}`,
    );
    panel.dataset.timeMode = state.live ? "live" : "exploring";
    for (const [clock, key] of cityClocks) {
      const parts = clockParts(state[key]);
      clock.querySelector(".breeze-clock-digits").textContent = parts.digits;
      clock.querySelector(".breeze-clock-period").textContent = parts.period;
      clock.querySelector("time").dateTime = parts.iso;
    }
    if (externalChange) cancel();
    else if (!animationFrame) paintTiles();
  }

  function focus() {
    paintTiles();
    (panel.dataset.view === "breeze" ? rail : range).focus({
      preventScroll: true,
    });
  }

  function releaseDrag() {
    wheelRemainder = 0;
    if (!drag) return;
    const pointerId = drag.id;
    drag = null;
    rail.removeAttribute("data-dragging");
    if (rail.hasPointerCapture(pointerId))
      rail.releasePointerCapture(pointerId);
  }

  function paintTiles() {
    const visibleTiles =
      Number(getComputedStyle(rail).getPropertyValue("--time-visible-tiles")) ||
      7;
    const edge = visibleTiles / 2;
    const hours = preference.matches ? 0 : visualMinutes / 60;
    flowingTiles.forEach((tile, index) => {
      // Recycle each tile beyond the visible edges, keeping its visible travel continuous.
      const offset = ((((index - hours + 5.5) % 11) + 11) % 11) - 5.5;
      const distance = Math.abs(offset);
      const awayFromCenter = fadeBetween(0, 1, distance);
      const opacity =
        (1 - fadeBetween(edge - 0.55, edge, distance)) *
        Math.max(0, 1 - distance * 0.18);
      tile.style.setProperty("--tile-offset", String(offset));
      tile.style.setProperty(
        "--tile-scale",
        String(
          distance <= 1
            ? 0.4 + 0.6 * (1 - awayFromCenter) ** 2
            : Math.max(0.28, 0.4 - (distance - 1) * 0.05),
        ),
      );
      tile.style.setProperty("--tile-opacity", String(opacity));
      tile.style.setProperty("--tile-rotation", `${45 * awayFromCenter}deg`);
      tile.hidden = opacity < 0.001;
    });
  }

  function cancel() {
    releaseDrag();
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    visualMinutes = state.minutes;
    paintTiles();
  }

  function moveTiles(minutes, immediate) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    if (
      immediate ||
      preference.matches ||
      document.hidden ||
      panel.hidden ||
      panel.dataset.view !== "breeze" ||
      Math.abs(minutes - visualMinutes) > 180
    ) {
      visualMinutes = minutes;
      paintTiles();
      return;
    }
    const start = visualMinutes;
    const startedAt = performance.now();
    function animate(now) {
      animationFrame = 0;
      if (document.hidden || panel.hidden || panel.dataset.view !== "breeze") {
        cancel();
        return;
      }
      const progress = Math.min(1, Math.max(0, (now - startedAt) / 280));
      visualMinutes = start + (minutes - start) * (1 - (1 - progress) ** 3);
      paintTiles();
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    }
    animationFrame = requestAnimationFrame(animate);
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      cancel();
      panel.dataset.view = button.dataset.timeView;
      view.hidden = panel.dataset.view !== "breeze";
      viewButtons.forEach((choice) => {
        choice.setAttribute("aria-pressed", String(choice === button));
      });
      focus();
    });
  });

  function tileStep() {
    const visibleTiles =
      Number(getComputedStyle(rail).getPropertyValue("--time-visible-tiles")) ||
      7;
    return rail.getBoundingClientRect().height / visibleTiles || 68;
  }

  function changeMinutes(minutes, immediate = false) {
    const next = clampMinutes(minutes);
    if (next === state.minutes) return;
    // Commit first so syncTime's reentrant update preserves this visual transition.
    state.minutes = next;
    state.live = false;
    update({});
    moveTiles(next, immediate);
    onTimeChange(next);
  }

  rail.addEventListener("keydown", (event) => {
    const changes = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 60,
      PageDown: -60,
    };
    if (event.key === "Home") {
      event.preventDefault();
      changeMinutes(0);
    } else if (event.key === "End") {
      event.preventDefault();
      changeMinutes(1439);
    } else if (Object.hasOwn(changes, event.key)) {
      event.preventDefault();
      changeMinutes(state.minutes + changes[event.key]);
    }
  });

  rail.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || !event.deltaY || drag) return;
      event.preventDefault();
      const step = tileStep();
      const unit =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? rail.clientHeight
            : 1;
      const delta =
        Math.max(-60, Math.min(60, (-event.deltaY * unit * 60) / step)) +
        wheelRemainder;
      const minutes = Math.trunc(delta);
      wheelRemainder = delta - minutes;
      changeMinutes(state.minutes + minutes);
    },
    { passive: false },
  );

  rail.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    cancel();
    rail.focus({ preventScroll: true });
    rail.setPointerCapture(event.pointerId);
    const step = tileStep();
    drag = {
      id: event.pointerId,
      y: event.clientY,
      minutes: state.minutes,
      step,
      moved: false,
    };
    rail.dataset.dragging = "true";
  });
  rail.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    const distance = drag.y - event.clientY;
    if (!drag.moved && Math.abs(distance) < 3) return;
    drag.moved = true;
    changeMinutes(drag.minutes + (distance * 60) / drag.step, true);
  });
  rail.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    let hours = 0;
    if (!drag.moved) {
      const rect = rail.getBoundingClientRect();
      hours = Math.round(
        (event.clientY - rect.top - rect.height / 2) / drag.step,
      );
    }
    releaseDrag();
    if (hours) changeMinutes(state.minutes - hours * 60);
  });
  for (const eventName of ["pointercancel", "lostpointercapture"]) {
    rail.addEventListener(eventName, (event) => {
      if (drag?.id === event.pointerId) cancel();
    });
  }
  rail.addEventListener("blur", cancel);
  preference.addEventListener("change", cancel);
  new ResizeObserver(paintTiles).observe(rail);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancel();
  });

  panel.dataset.view = "breeze";
  update({});
  return { update, focus, cancel };
}
