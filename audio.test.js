import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLAYLIST } from "./audio.js";

test("the built-in playlist keeps the requested song and artist order", () => {
  assert.deepEqual(
    DEFAULT_PLAYLIST.map(({ title, artist }) => [title, artist]),
    [
      ["In The Night", "Fly By Midnight"],
      ["The Weather", "Fly By Midnight"],
      ["like 1999", "Valley"],
      ["Natural", "Valley"],
    ],
  );
  assert.equal(new Set(DEFAULT_PLAYLIST.map(({ src }) => src)).size, 4);
});
