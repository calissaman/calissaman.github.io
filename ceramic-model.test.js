import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from './vendor/three/three.module.min.js';
import { createCeramicBlock } from './ceramic-model.js';

test('ceramic block has depth, a solid flower and frame, and open ventilation holes', () => {
  const block = createCeramicBlock();
  block.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(block).getSize(new THREE.Vector3());
  assert.ok(size.z > 0.65 && size.z < 0.9);
  assert.ok(Math.abs(size.x - size.y) < 0.001);
  const ray = new THREE.Raycaster();
  function hits(x, y) {
    ray.set(new THREE.Vector3(x, y, 3), new THREE.Vector3(0, 0, -1));
    return ray.intersectObject(block, true).length;
  }
  assert.ok(hits(0, 0) > 0, 'central flower is solid');
  assert.ok(hits(1.8, 0) > 0, 'frame is solid');
  assert.equal(hits(1.1, 0), 0, 'opening passes through the entire block');
});
