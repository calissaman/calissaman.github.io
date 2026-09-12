export function setupAudio() {
  const ambientButton = document.querySelector('.ambient-toggle');
  const fileInput = document.querySelector('#music-files');
  const trackName = document.querySelector('.track-name');
  const previousButton = document.querySelector('.track-previous');
  const playButton = document.querySelector('.track-play');
  const nextButton = document.querySelector('.track-next');
  const volumeInput = document.querySelector('#music-volume');
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ambientContext = null;
  let ambientGain = null;
  let ambientWanted = false;
  let resumeAmbient = false;
  let ambientVersion = 0;

  function renderAmbient() {
    if (!ambientButton) return;
    ambientButton.setAttribute('aria-pressed', String(ambientWanted));
    const label = ambientButton.querySelector('span');
    const icon = ambientButton.querySelector('i');
    if (label) label.textContent = ambientWanted ? 'Sound on' : 'Sound off';
    if (icon)
      icon.className = `fa-solid fa-volume-${ambientWanted ? 'low' : 'xmark'}`;
  }

  function createWaterSound() {
    const context = new AudioContextClass();
    ambientContext = context;
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 5,
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);
    let previous = 0;
    for (let index = 0; index < samples.length; index += 1) {
      previous = (previous + (Math.random() * 2 - 1) * 0.035) / 1.035;
      samples[index] = previous * 3.5;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lowpass = context.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 700;
    lowpass.Q.value = 0.5;
    const highpass = context.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 100;
    ambientGain = context.createGain();
    ambientGain.gain.value = 0;
    noise
      .connect(lowpass)
      .connect(highpass)
      .connect(ambientGain)
      .connect(context.destination);
    const flow = context.createOscillator();
    flow.frequency.value = 0.09;
    const flowDepth = context.createGain();
    flowDepth.gain.value = 220;
    flow.connect(flowDepth).connect(lowpass.frequency);
    noise.start();
    flow.start();
  }

  async function startAmbient() {
    const version = ++ambientVersion;
    const context = ambientContext;
    try {
      await context.resume();
      if (version !== ambientVersion) return;
      if (!ambientWanted || document.hidden) {
        await context.suspend();
        return;
      }
      ambientGain.gain.cancelScheduledValues(context.currentTime);
      ambientGain.gain.setValueAtTime(0, context.currentTime);
      ambientGain.gain.linearRampToValueAtTime(0.06, context.currentTime + 0.8);
    } catch {
      if (version !== ambientVersion) return;
      ambientWanted = false;
      renderAmbient();
      ambientButton.title = 'Sound could not start. Try again.';
    }
  }

  function suspendAmbient() {
    ambientVersion += 1;
    if (ambientContext && ambientContext.state !== 'closed') {
      ambientContext.suspend().catch(() => {});
    }
  }

  if (ambientButton && AudioContextClass) {
    ambientButton.addEventListener('click', () => {
      ambientWanted = !ambientWanted;
      resumeAmbient = false;
      ambientButton.removeAttribute('title');
      if (ambientWanted) {
        try {
          if (!ambientContext || ambientContext.state === 'closed')
            createWaterSound();
          startAmbient();
        } catch {
          ambientWanted = false;
          if (ambientContext && ambientContext.state !== 'closed')
            ambientContext.close().catch(() => {});
          ambientContext = null;
          ambientGain = null;
          ambientButton.title = 'Ambient sound is unavailable in this browser.';
        }
      } else {
        suspendAmbient();
      }
      renderAmbient();
    });
  } else if (ambientButton) {
    ambientButton.disabled = true;
    ambientButton.title = 'Ambient sound is unavailable in this browser.';
  }

  let player = null;
  try {
    if (
      typeof window.Audio === 'function' &&
      typeof URL.createObjectURL === 'function'
    ) {
      player = new window.Audio();
      player.preload = 'metadata';
    }
  } catch {
    player = null;
  }
  let playlist = [];
  let currentTrack = 0;
  let playbackWanted = false;
  let resumeTrack = false;
  let playbackVersion = 0;

  function renderPlayer() {
    const hasTracks = playlist.length > 0;
    const playing = player && !player.paused && !player.ended && playbackWanted;
    if (playButton) {
      playButton.disabled = !hasTracks;
      playButton.textContent = playing ? 'Pause' : 'Play';
      playButton.setAttribute(
        'aria-label',
        playing ? 'Pause track' : 'Play track',
      );
      playButton.setAttribute('aria-pressed', String(Boolean(playing)));
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
    if (!player || !playlist.length || document.hidden) return;
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
    resumeTrack = false;
    currentTrack = (index + playlist.length) % playlist.length;
    player.src = playlist[currentTrack].url;
    if (trackName) trackName.textContent = playlist[currentTrack].name;
    renderPlayer();
    if (shouldPlay) playTrack();
  }

  function clearPlaylist() {
    pauseTrack();
    resumeTrack = false;
    if (player) {
      player.removeAttribute('src');
      player.load();
    }
    playlist.forEach((track) => URL.revokeObjectURL(track.url));
    playlist = [];
    currentTrack = 0;
    if (trackName) trackName.textContent = 'Your playlist, on this device.';
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
      volumeInput.addEventListener('input', updateVolume);
    }
    fileInput?.addEventListener('change', () => {
      const files = Array.from(fileInput.files || []);
      if (!files.length) return;
      clearPlaylist();
      for (const file of files) {
        if (
          !file.type.startsWith('audio/') &&
          !/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|aiff|aif|webm)$/i.test(
            file.name,
          )
        )
          continue;
        playlist.push({ name: file.name, url: URL.createObjectURL(file) });
      }
      fileInput.value = '';
      if (playlist.length) selectTrack(0);
      else if (trackName)
        trackName.textContent = 'Choose an audio file to make a playlist.';
    });
    playButton?.addEventListener('click', () => {
      resumeTrack = false;
      if (playbackWanted) pauseTrack();
      else playTrack();
    });
    previousButton?.addEventListener('click', () => {
      if (playlist.length) selectTrack(currentTrack - 1, playbackWanted);
    });
    nextButton?.addEventListener('click', () => {
      if (playlist.length) selectTrack(currentTrack + 1, playbackWanted);
    });
    player.addEventListener('play', renderPlayer);
    player.addEventListener('pause', renderPlayer);
    player.addEventListener('ended', () => {
      if (
        playbackWanted &&
        currentTrack + 1 < playlist.length &&
        !document.hidden
      ) {
        selectTrack(currentTrack + 1, true);
      } else {
        pauseTrack();
      }
    });
    player.addEventListener('error', () => {
      if (!player.error || !playlist.length) return;
      pauseTrack();
      resumeTrack = false;
      if (trackName)
        trackName.textContent = `Could not play ${playlist[currentTrack].name}. Try another audio file.`;
    });
  } else {
    if (fileInput) fileInput.disabled = true;
    if (volumeInput) volumeInput.disabled = true;
    if (trackName)
      trackName.textContent =
        'Local music playback is unavailable in this browser.';
  }
  renderPlayer();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeAmbient = ambientWanted && ambientContext?.state === 'running';
      suspendAmbient();
      resumeTrack = Boolean(
        player && !player.paused && !player.ended && playbackWanted,
      );
      pauseTrack();
    } else {
      if (resumeAmbient && ambientWanted) startAmbient();
      if (resumeTrack) playTrack();
      resumeAmbient = false;
      resumeTrack = false;
    }
  });

  window.addEventListener('pagehide', () => {
    clearPlaylist();
    ambientWanted = false;
    resumeAmbient = false;
    ambientVersion += 1;
    if (ambientContext && ambientContext.state !== 'closed')
      ambientContext.close().catch(() => {});
    ambientContext = null;
    ambientGain = null;
    renderAmbient();
  });
}
