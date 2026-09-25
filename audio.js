import { createWaterLoop } from "./water-audio.js?v=20260915-95";

export const DEFAULT_PLAYLIST = Object.freeze([
  {
    title: "Natural",
    artist: "Valley",
    src: "./assets/audio/playlist/valley-natural.mp3?v=20260918-122",
  },
  {
    title: "like 1999",
    artist: "Valley",
    src: "./assets/audio/playlist/valley-like-1999.mp3?v=20260918-122",
  },
  {
    title: "In The Night",
    artist: "Fly By Midnight",
    src: "./assets/audio/playlist/fly-by-midnight-in-the-night.mp3?v=20260918-122",
  },
  {
    title: "The Weather",
    artist: "Fly By Midnight",
    src: "./assets/audio/playlist/fly-by-midnight-the-weather.mp3?v=20260918-122",
  },
  {
    title: "Same Page",
    artist: "The Band CAMINO",
    src: "./assets/audio/playlist/the-band-camino-same-page.mp3?v=20260918-122",
  },
  {
    title: "See Through",
    artist: "The Band CAMINO",
    src: "./assets/audio/playlist/the-band-camino-see-through.mp3?v=20260918-122",
  },
  {
    title: "Caramel (Acoustic Cover)",
    artist: "Sleep Token",
    src: "./assets/audio/playlist/sleep-token-caramel-acoustic-cover.mp3?v=20260918-122",
  },
  {
    title: "Infinite Baths Cover",
    artist: "ANTOINETTE",
    src: "./assets/audio/playlist/antoinette-infinite-baths-cover.mp3?v=20260918-122",
  },
  {
    title: "Kataomoi「カタオモイ」(Unrequited Love)",
    artist: "Aimer",
    src: "./assets/audio/playlist/aimer-kataomoi-unrequited-love.mp3?v=20260918-122",
  },
  {
    title: "After Rain",
    artist: "Aimer",
    src: "./assets/audio/playlist/aimer-after-rain.mp3?v=20260918-122",
  },
  {
    title: "Adakah Kau Mendengar (Are You Listening)",
    artist: "ALYPH",
    src: "./assets/audio/playlist/alyph-adakah-kau-mendengar.mp3?v=20260918-122",
  },
  {
    title: "Ingat (Remember)",
    artist: "ALYPH",
    src: "./assets/audio/playlist/alyph-ingat.mp3?v=20260918-122",
  },
]);

export const PINK_DOOR_TRACK = Object.freeze({
  title: "Ain't In LA",
  artist: "ADÉLA",
  src: "./assets/audio/interactions/adela-aint-in-la.mp3?v=20260925-144",
});

export function pickShuffledTrack(currentTrack, playlistLength, random = Math.random) {
  if (playlistLength < 1) return -1;
  if (playlistLength === 1) return 0;
  const draw = Math.min(0.999999, Math.max(0, Number(random()) || 0));
  const offset = 1 + Math.floor(draw * (playlistLength - 1));
  return (currentTrack + offset) % playlistLength;
}

export function pickTrackAfterEnd({
  currentTrack,
  playlistLength,
  replayEnabled,
  shuffleEnabled,
  random = Math.random,
}) {
  if (playlistLength < 1) return -1;
  if (replayEnabled) return currentTrack;
  if (shuffleEnabled && playlistLength > 1)
    return pickShuffledTrack(currentTrack, playlistLength, random);
  return currentTrack + 1 < playlistLength ? currentTrack + 1 : -1;
}

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
  const shuffleButton = document.querySelector(".track-shuffle");
  const replayButton = document.querySelector(".track-replay");
  const volumeInput = document.querySelector("#music-volume");
  const waterVolumeInput = document.querySelector("#water-volume");
  let waterVolume = Number(waterVolumeInput?.value ?? 0.2);
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
  let activeTrack = null;
  let hiddenPlayback = false;
  let playbackWanted = false;
  let playbackVersion = 0;
  let shuffleEnabled = false;
  let replayEnabled = false;

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
    const hasTracks = Boolean(activeTrack || playlist.length);
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
    if (shuffleButton) {
      shuffleButton.disabled = playlist.length < 2;
      shuffleButton.setAttribute("aria-pressed", String(shuffleEnabled));
      shuffleButton.title = shuffleEnabled ? "Turn shuffle off" : "Shuffle tracks";
    }
    if (replayButton) {
      replayButton.disabled = !hasTracks;
      replayButton.setAttribute("aria-pressed", String(replayEnabled));
      replayButton.title = replayEnabled ? "Turn replay off" : "Replay this track";
    }
    playlistList
      ?.querySelectorAll(".playlist-track")
      .forEach((button, index) =>
        button.setAttribute(
          "aria-current",
          !hiddenPlayback && index === currentTrack ? "true" : "false",
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
    if (!player || !activeTrack) return;
    if (!ambientWanted) enableWater();
    const version = ++playbackVersion;
    playbackWanted = true;
    renderTrackMeta(activeTrack);
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
        activeTrack,
        `Could not play ${activeTrack.name}.`,
      );
      renderPlayer();
    }
  }

  function selectTrack(index, shouldPlay = false) {
    pauseTrack();
    currentTrack = (index + playlist.length) % playlist.length;
    activeTrack = playlist[currentTrack];
    hiddenPlayback = false;
    player.src = activeTrack.url;
    renderTrackMeta(activeTrack);
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
    activeTrack = null;
    hiddenPlayback = false;
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
        const displayName = file.name.replace(/\.[^.]+$/, "");
        const [artist, ...titleParts] = displayName.split(/\s+-\s+/);
        const title = titleParts.join(" - ") || displayName;
        const uploadedArtist = titleParts.length ? artist : "Uploaded track";
        playlist.push({
          title,
          artist: uploadedArtist,
          name: `${title} — ${uploadedArtist}`,
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
      if (!playlist.length) return;
      const nextTrack = shuffleEnabled
        ? pickShuffledTrack(currentTrack, playlist.length)
        : currentTrack + 1;
      selectTrack(nextTrack, playbackWanted);
    });
    shuffleButton?.addEventListener("click", () => {
      shuffleEnabled = !shuffleEnabled;
      renderPlayer();
    });
    replayButton?.addEventListener("click", () => {
      replayEnabled = !replayEnabled;
      renderPlayer();
    });
    player.addEventListener("play", renderPlayer);
    player.addEventListener("pause", renderPlayer);
    player.addEventListener("ended", () => {
      if (!playbackWanted) return;
      if (hiddenPlayback) {
        if (replayEnabled) {
          player.currentTime = 0;
          playTrack();
        } else pauseTrack();
        return;
      }
      const nextTrack = pickTrackAfterEnd({
        currentTrack,
        playlistLength: playlist.length,
        replayEnabled,
        shuffleEnabled,
      });
      if (nextTrack === currentTrack) {
        player.currentTime = 0;
        playTrack();
      } else if (nextTrack >= 0) selectTrack(nextTrack, true);
      else pauseTrack();
    });
    player.addEventListener("error", () => {
      if (!player.error || !activeTrack) return;
      pauseTrack();
      renderTrackMeta(
        activeTrack,
        `Could not play ${activeTrack.name}.`,
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

  return {
    playHiddenTrack(track = PINK_DOOR_TRACK) {
      if (!player) return;
      pauseTrack();
      activeTrack = {
        ...track,
        name: `${track.title} — ${track.artist}`,
        url: new URL(track.src, import.meta.url).href,
        local: false,
      };
      hiddenPlayback = true;
      player.src = activeTrack.url;
      renderTrackMeta(activeTrack);
      renderPlayer();
      playTrack();
    },
  };
}
