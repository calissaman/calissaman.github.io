import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PLAYLIST,
  PINK_DOOR_TRACK,
  pickShuffledTrack,
  pickTrackAfterEnd,
} from "./audio.js";

test("the built-in playlist keeps the requested song and artist order", () => {
  assert.deepEqual(
    DEFAULT_PLAYLIST.map(({ title, artist }) => [title, artist]),
    [
      ["Natural", "Valley"],
      ["like 1999", "Valley"],
      ["In The Night", "Fly By Midnight"],
      ["The Weather", "Fly By Midnight"],
      ["Same Page", "The Band CAMINO"],
      ["See Through", "The Band CAMINO"],
      ["Caramel (Acoustic Cover)", "Sleep Token"],
      ["Infinite Baths Cover", "ANTOINETTE"],
      ["Kataomoi「カタオモイ」(Unrequited Love)", "Aimer"],
      ["After Rain", "Aimer"],
      ["Adakah Kau Mendengar (Are You Listening)", "ALYPH"],
      ["Ingat (Remember)", "ALYPH"],
    ],
  );
  assert.equal(new Set(DEFAULT_PLAYLIST.map(({ src }) => src)).size, 12);
});

test("the pink-door song stays outside the visible playlist", () => {
  assert.deepEqual(
    [PINK_DOOR_TRACK.title, PINK_DOOR_TRACK.artist],
    ["Ain't In LA", "ADÉLA"],
  );
  assert.equal(
    DEFAULT_PLAYLIST.some(({ src }) => src === PINK_DOOR_TRACK.src),
    false,
  );
});

test("shuffle always selects another track when alternatives exist", () => {
  assert.equal(pickShuffledTrack(1, 4, () => 0), 2);
  assert.equal(pickShuffledTrack(1, 4, () => 0.999), 0);
  assert.equal(pickShuffledTrack(3, 4, () => 0.5), 1);
  assert.equal(pickShuffledTrack(0, 1, () => 0.5), 0);
  assert.equal(pickShuffledTrack(0, 0, () => 0.5), -1);
});

test("replay repeats the current track before shuffle or sequential playback", () => {
  const base = { currentTrack: 2, playlistLength: 4, random: () => 0 };
  assert.equal(
    pickTrackAfterEnd({ ...base, replayEnabled: true, shuffleEnabled: true }),
    2,
  );
  assert.equal(
    pickTrackAfterEnd({ ...base, replayEnabled: false, shuffleEnabled: true }),
    3,
  );
  assert.equal(
    pickTrackAfterEnd({ ...base, replayEnabled: false, shuffleEnabled: false }),
    3,
  );
  assert.equal(
    pickTrackAfterEnd({
      ...base,
      currentTrack: 3,
      replayEnabled: false,
      shuffleEnabled: false,
    }),
    -1,
  );
});
