import test from "node:test";
import assert from "node:assert/strict";
import { camelliaOpenness, CAMELLIA_BLOOMS } from "./camellia.js";
test("camellias gradually bloom during the day and close after dusk", () => {
  CAMELLIA_BLOOMS.forEach((_, i) => {
    assert.equal(camelliaOpenness(360, i), 0);
    assert.equal(camelliaOpenness(960, i), 1);
    assert.equal(camelliaOpenness(1439, i), 0);
    let previous = 0;
    for (let minute = 360; minute <= 960; minute++) {
      const open = camelliaOpenness(minute, i);
      assert.ok(open >= previous && open - previous < 0.01);
      previous = open;
    }
  });
  assert.notEqual(camelliaOpenness(600, 0), camelliaOpenness(600, 4));
});
