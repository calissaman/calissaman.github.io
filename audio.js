import { createWaterLoop } from "./water-audio.js?v=20260915-95";

export const DEFAULT_PLAYLIST = Object.freeze([
  {
    title: "In The Night",
    artist: "Fly By Midnight",
    src: "./assets/audio/playlist/fly-by-midnight-in-the-night.mp3?v=20260918-120",
  },
  {
    title: "The Weather",
    artist: "Fly By Midnight",
    src: "./assets/audio/playlist/fly-by-midnight-the-weather.mp3?v=20260918-120",
  },
  {
    title: "like 1999",
    artist: "Valley",
    src: "./assets/audio/playlist/valley-like-1999.mp3?v=20260918-120",
  },
  {
    title: "Natural",
    artist: "Valley",
    src: "./assets/audio/playlist/valley-natural.mp3?v=20260918-120",
  },
]);

export function setupAudio() {
  const ambientButton = document.querySelector(".ambient-toggle");
  const fileInput = document.querySelector("#music-files");
  const trackName = document.querySelector(".track-name");
  const trackTitle = document.querySelector(".track-title");
  const trackArtist = document.querySelector(".track-artist");
  const playlistList = document.querySelector(".playlist-list");
  const previousButton = document.querySelector(".track-previous");
  const playButton = document.querySelector(".track-play");
  const nextButton = document.querySelector(".track-next");
  const volumeInput = document.querySelector("#music-volume");
  const waterVolumeInput = document.querySelector("#water-volume");
  let waterVolume = Number(waterVolumeInput?.value ?? 0.45);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ambientContext = null;
  let ambientGain = null;
  let mixBus = null;
  let musicSource = null;
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
    mixBus = context.createDynamicsCompressor();
    mixBus.threshold.value = -6;
    mixBus.knee.value = 6;
    mixBus.ratio.value = 12;
    mixBus.attack.value = 0.003;
    mixBus.release.value = 0.25;
    const output = context.createGain();
    output.gain.value = 0.85;
    mixBus.connect(output).connect(context.destination);
    ambientGain.connect(mixBus);
    return loadWaterRecording(context);
  }

  function loadWaterRecording(context) {
    return fetch(
      new URL("./assets/audio/flowing-water.ogg?v=20260917-112", import.meta.url),
    )
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
        const rumble = context.createBiquadFilter();
        rumble.type = "highpass";
        rumble.frequency.value = 90;
        rumble.Q.value = 0.707;
        const soften = context.createBiquadFilter();
        soften.type = "lowpass";
        soften.frequency.value = 5500;
        soften.Q.value = 0.707;
        source.connect(rumble).connect(soften).connect(ambientGain);
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
        return;
      }
      setWaterGain(waterVolume * 0.65);
    } catch {
      if (version !== ambientVersion) return;
      ambientWanted = false;
      setWaterGain(0);
      waterReady = null;
      renderAmbient();
      ambientButton.title = "Sound could not start. Try again.";
    }
  }

  function setWaterGain(value) {
    if (!ambientGain || ambientContext.state === "closed") return;
    const now = ambientContext.currentTime;
    ambientGain.gain.cancelAndHoldAtTime(now);
    ambientGain.gain.setTargetAtTime(value, now, 0.08);
  }

  function muteWater() {
    ambientVersion += 1;
    setWaterGain(0);
  }

  function enableWater() {
    if (!AudioContextClass) return;
    ambientWanted = true;
    ambientButton?.removeAttribute("title");
    try {
      if (!ambientContext || ambientContext.state === "closed")
        waterReady = createWaterSound();
      else if (!waterReady) waterReady = loadWaterRecording(ambientContext);
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
        muteWater();
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
        setWaterGain(waterVolume * 0.65);
      }
    });
  } else {
    if (ambientButton) ambientButton.disabled = true;
    if (waterVolumeInput) waterVolumeInput.disabled = true;
  }

  let player = null;
  try {
    if (typeof window.Audio === "function") {
      player = new window.Audio();
      player.preload = "metadata";
    }
  } catch {
    player = null;
  }
  let playlist = DEFAULT_PLAYLIST.map((track) => ({
    ...track,
    name: `${track.title} — ${track.artist}`,
    url: new URL(track.src, import.meta.url).href,
    local: false,
  }));
  let currentTrack = 0;
  let playbackWanted = false;
  let playbackVersion = 0;

  function renderTrackMeta(track, message = "") {
    if (trackTitle) trackTitle.textContent = message || track?.title || "";
    if (trackArtist)
      trackArtist.textContent = message ? "Try another track." : track?.artist || "";
    if (!trackTitle && trackName)
      trackName.textContent = message || track?.name || "";
  }

  function renderPlaylist() {
    if (!playlistList) return;
    playlistList.replaceChildren();
    playlist.forEach((track, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const title = document.createElement("span");
      const artist = document.createElement("span");
      button.type = "button";
      button.className = "playlist-track";
      button.setAttribute("aria-current", index === currentTrack ? "true" : "false");
      button.addEventListener("click", () =>
        selectTrack(index, playbackWanted),
      );
      title.className = "playlist-track-title";
      title.textContent = track.title;
      artist.className = "playlist-track-artist";
      artist.textContent = track.artist;
      button.append(title, artist);
      item.append(button);
      playlistList.append(item);
    });
  }

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
    playlistList
      ?.querySelectorAll(".playlist-track")
      .forEach((button, index) =>
        button.setAttribute(
          "aria-current",
          index === currentTrack ? "true" : "false",
        ),
      );
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
    renderTrackMeta(playlist[currentTrack]);
    try {
      if (ambientContext && ambientContext.state !== "closed") {
        await ambientContext.resume();
        if (!musicSource) {
          musicSource = ambientContext.createMediaElementSource(player);
          musicSource.connect(mixBus);
        }
      }
      await player.play();
      if (version === playbackVersion) renderPlayer();
    } catch {
      if (version !== playbackVersion) return;
      playbackWanted = false;
      renderTrackMeta(
        playlist[currentTrack],
        `Could not play ${playlist[currentTrack].name}.`,
      );
      renderPlayer();
    }
  }

  function selectTrack(index, shouldPlay = false) {
    pauseTrack();
    currentTrack = (index + playlist.length) % playlist.length;
    player.src = playlist[currentTrack].url;
    renderTrackMeta(playlist[currentTrack]);
    renderPlayer();
    if (shouldPlay) playTrack();
  }

  function clearPlaylist() {
    pauseTrack();
    if (player) {
      player.removeAttribute("src");
      player.load();
    }
    playlist
      .filter((track) => track.local)
      .forEach((track) => URL.revokeObjectURL(track.url));
    playlist = [];
    currentTrack = 0;
    renderTrackMeta(null, "Your playlist, on this device.");
    renderPlaylist();
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
        const name = file.name.replace(/\.[^.]+$/, "");
        const [artist, ...titleParts] = name.split(/\s+-\s+/);
        const title = titleParts.join(" - ") || name;
        playlist.push({
          title,
          artist: titleParts.length ? artist : "Uploaded track",
          name: file.name,
          url: URL.createObjectURL(file),
          local: true,
        });
      }
      fileInput.value = "";
      if (playlist.length) {
        renderPlaylist();
        selectTrack(0);
      } else renderTrackMeta(null, "Choose an audio file to make a playlist.");
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
      renderTrackMeta(
        playlist[currentTrack],
        `Could not play ${playlist[currentTrack].name}.`,
      );
    });
  } else {
    if (fileInput) fileInput.disabled = true;
    if (volumeInput) volumeInput.disabled = true;
    renderTrackMeta(null, "Music playback is unavailable in this browser.");
  }
  if (player && playlist.length) {
    renderPlaylist();
    selectTrack(0);
  } else renderPlayer();

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
