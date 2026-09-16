import { createWaterLoop } from "./water-audio.js?v=20260915-95";

export function setupAudio() {
  const ambientButton = document.querySelector(".ambient-toggle");
  const fileInput = document.querySelector("#music-files");
  const trackName = document.querySelector(".track-name");
  const previousButton = document.querySelector(".track-previous");
  const playButton = document.querySelector(".track-play");
  const nextButton = document.querySelector(".track-next");
  const volumeInput = document.querySelector("#music-volume");
  const waterVolumeInput = document.querySelector("#water-volume");
  let waterVolume = Number(waterVolumeInput?.value ?? 0.45);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ambientContext = null;
  let ambientGain = null;
  let waterReady = null;
  let ambientWanted = false;
  let ambientVersion = 0;

  function renderAmbient() {
    if (!ambientButton) return;
    ambientButton.setAttribute("aria-pressed", String(ambientWanted));
    const label = ambientButton.querySelector("span");
    const icon = ambientButton.querySelector("i");
    if (label) label.textContent = ambientWanted ? "Water on" : "Water off";
    if (icon)
      icon.className = `fa-solid fa-volume-${ambientWanted ? "low" : "xmark"}`;
  }

  function createWaterSound() {
    const context = new AudioContextClass();
    ambientContext = context;
    ambientGain = context.createGain();
    ambientGain.gain.value = 0;
    ambientGain.connect(context.destination);
    return fetch(new URL("./assets/audio/flowing-water.mp3", import.meta.url))
      .then((response) => {
        if (!response.ok) throw new Error("Water recording could not load");
        return response.arrayBuffer();
      })
      .then((bytes) => context.decodeAudioData(bytes))
      .then((recording) => {
        if (context.state === "closed") return;
        const source = context.createBufferSource();
        source.buffer = createWaterLoop(context, recording);
        source.loop = true;
        source.connect(ambientGain);
        source.start();
      });
  }

  async function startAmbient() {
    const version = ++ambientVersion;
    const context = ambientContext;
    try {
      await context.resume();
      await waterReady;
      if (version !== ambientVersion) return;
      if (!ambientWanted) {
        await context.suspend();
        return;
      }
      ambientGain.gain.cancelScheduledValues(context.currentTime);
      ambientGain.gain.setValueAtTime(0, context.currentTime);
      ambientGain.gain.linearRampToValueAtTime(
        waterVolume * 0.65,
        context.currentTime + 0.8,
      );
    } catch {
      if (version !== ambientVersion) return;
      ambientWanted = false;
      context.close().catch(() => {});
      renderAmbient();
      ambientButton.title = "Sound could not start. Try again.";
    }
  }

  function suspendAmbient() {
    ambientVersion += 1;
    if (ambientContext && ambientContext.state !== "closed") {
      ambientContext.suspend().catch(() => {});
    }
  }

  function enableWater() {
    if (!AudioContextClass) return;
    ambientWanted = true;
    ambientButton?.removeAttribute("title");
    try {
      if (!ambientContext || ambientContext.state === "closed")
        waterReady = createWaterSound();
      startAmbient();
    } catch {
      ambientWanted = false;
      ambientContext?.close().catch(() => {});
      ambientContext = null;
      ambientGain = null;
      if (ambientButton)
        ambientButton.title = "Water audio is unavailable in this browser.";
    }
    renderAmbient();
  }

  if (ambientButton && AudioContextClass) {
    ambientButton.addEventListener("click", () => {
      if (!ambientWanted) enableWater();
      else {
        ambientWanted = false;
        suspendAmbient();
        renderAmbient();
      }
    });
    waterVolumeInput?.addEventListener("input", () => {
      waterVolume = Math.min(
        1,
        Math.max(0, Number(waterVolumeInput.value) || 0),
      );
      if (!ambientWanted && waterVolume > 0) enableWater();
      else if (ambientGain) {
        ambientGain.gain.cancelScheduledValues(ambientContext.currentTime);
        ambientGain.gain.setTargetAtTime(
          waterVolume * 0.65,
          ambientContext.currentTime,
          0.08,
        );
      }
    });
  } else {
    if (ambientButton) ambientButton.disabled = true;
    if (waterVolumeInput) waterVolumeInput.disabled = true;
  }

  let player = null;
  try {
    if (
      typeof window.Audio === "function" &&
      typeof URL.createObjectURL === "function"
    ) {
      player = new window.Audio();
      player.preload = "metadata";
    }
  } catch {
    player = null;
  }
  let playlist = [];
  let currentTrack = 0;
  let playbackWanted = false;
  let playbackVersion = 0;

  function renderPlayer() {
    const hasTracks = playlist.length > 0;
    const playing = player && !player.paused && !player.ended && playbackWanted;
    if (playButton) {
      playButton.disabled = !hasTracks;
      playButton.textContent = playing ? "Pause" : "Play";
      playButton.setAttribute(
        "aria-label",
        playing ? "Pause track" : "Play track",
      );
      playButton.setAttribute("aria-pressed", String(Boolean(playing)));
    }
    if (previousButton) previousButton.disabled = playlist.length < 2;
    if (nextButton) nextButton.disabled = playlist.length < 2;
  }

  function pauseTrack() {
    playbackVersion += 1;
    playbackWanted = false;
    player?.pause();
    renderPlayer();
  }

  async function playTrack() {
    if (!player || !playlist.length) return;
    if (!ambientWanted) enableWater();
    const version = ++playbackVersion;
    playbackWanted = true;
    if (trackName) trackName.textContent = playlist[currentTrack].name;
    try {
      await player.play();
      if (version === playbackVersion) renderPlayer();
    } catch {
      if (version !== playbackVersion) return;
      playbackWanted = false;
      if (trackName)
        trackName.textContent = `Could not play ${playlist[currentTrack].name}. Try another audio file.`;
      renderPlayer();
    }
  }

  function selectTrack(index, shouldPlay = false) {
    pauseTrack();
    currentTrack = (index + playlist.length) % playlist.length;
    player.src = playlist[currentTrack].url;
    if (trackName) trackName.textContent = playlist[currentTrack].name;
    renderPlayer();
    if (shouldPlay) playTrack();
  }

  function clearPlaylist() {
    pauseTrack();
    if (player) {
      player.removeAttribute("src");
      player.load();
    }
    playlist.forEach((track) => URL.revokeObjectURL(track.url));
    playlist = [];
    currentTrack = 0;
    if (trackName) trackName.textContent = "Your playlist, on this device.";
    renderPlayer();
  }

  if (player) {
    if (volumeInput) {
      const updateVolume = () => {
        const volume = Number(volumeInput.value);
        player.volume = Number.isFinite(volume)
          ? Math.min(1, Math.max(0, volume))
          : 0.35;
      };
      updateVolume();
      volumeInput.addEventListener("input", updateVolume);
    }
    fileInput?.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      clearPlaylist();
      for (const file of files) {
        if (
          !file.type.startsWith("audio/") &&
          !/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|aiff|aif|webm)$/i.test(
            file.name,
          )
        )
          continue;
        playlist.push({ name: file.name, url: URL.createObjectURL(file) });
      }
      fileInput.value = "";
      if (playlist.length) selectTrack(0);
      else if (trackName)
        trackName.textContent = "Choose an audio file to make a playlist.";
    });
    playButton?.addEventListener("click", () => {
      if (playbackWanted) pauseTrack();
      else playTrack();
    });
    previousButton?.addEventListener("click", () => {
      if (playlist.length) selectTrack(currentTrack - 1, playbackWanted);
    });
    nextButton?.addEventListener("click", () => {
      if (playlist.length) selectTrack(currentTrack + 1, playbackWanted);
    });
    player.addEventListener("play", renderPlayer);
    player.addEventListener("pause", renderPlayer);
    player.addEventListener("ended", () => {
      if (playbackWanted && currentTrack + 1 < playlist.length) {
        selectTrack(currentTrack + 1, true);
      } else {
        pauseTrack();
      }
    });
    player.addEventListener("error", () => {
      if (!player.error || !playlist.length) return;
      pauseTrack();
      if (trackName)
        trackName.textContent = `Could not play ${playlist[currentTrack].name}. Try another audio file.`;
    });
  } else {
    if (fileInput) fileInput.disabled = true;
    if (volumeInput) volumeInput.disabled = true;
    if (trackName)
      trackName.textContent =
        "Local music playback is unavailable in this browser.";
  }
  renderPlayer();

  window.addEventListener("pagehide", () => {
    clearPlaylist();
    ambientWanted = false;
    ambientVersion += 1;
    if (ambientContext && ambientContext.state !== "closed")
      ambientContext.close().catch(() => {});
    ambientContext = null;
    ambientGain = null;
    renderAmbient();
  });
}
