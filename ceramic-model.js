import * as THREE from './vendor/three/three.module.min.js';

function roundedSquare(size, radius, Path = THREE.Shape) {
  const p = new Path(), h = size / 2;
  p.moveTo(-h + radius, -h);
  p.lineTo(h - radius, -h);
  p.quadraticCurveTo(h, -h, h, -h + radius);
  p.lineTo(h, h - radius);
  p.quadraticCurveTo(h, h, h - radius, h);
  p.lineTo(-h + radius, h);
  p.quadraticCurveTo(-h, h, -h, h - radius);
  p.lineTo(-h, -h + radius);
  p.quadraticCurveTo(-h, -h, -h + radius, -h);
  return p;
}

export function createCeramicBlock() {
  const block = new THREE.Group();
  const glaze = new THREE.MeshPhysicalMaterial({
    color: 0x285341, roughness: 0.20, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.1,
  });
  const relief = glaze.clone();
  relief.color.setHex(0x416650);
  const clay = new THREE.MeshStandardMaterial({color: 0xb8b198, roughness: 0.82});
  function extrude(shape, depth, z, material = glaze, bevel = 0.045) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 4, steps: 1,
      bevelSize: bevel, bevelThickness: bevel, curveSegments: 24,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = z;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    block.add(mesh);
    return mesh;
  }
  function frame(size, inner, depth, z, material, bevel) {
    const shape = roundedSquare(size, 0.26);
    shape.holes.push(roundedSquare(inner, 0.11, THREE.Path));
    return extrude(shape, depth, z, material, bevel);
  }
  frame(3.92, 3.12, 0.53, -0.34, clay, 0.055);
  frame(3.94, 3.12, 0.13, 0.18, glaze, 0.055);
  frame(3.21, 3.00, 0.53, -0.32, glaze, 0.026);
  frame(3.93, 3.12, 0.055, -0.37, glaze, 0.025);

  const corner = new THREE.Shape();
  corner.moveTo(1.56, 1.56);
  corner.lineTo(1.19, 1.56);
  corner.bezierCurveTo(0.96, 1.57, 0.96, 1.31, 1.10, 1.27);
  corner.bezierCurveTo(1.20, 1.24, 1.29, 1.32, 1.24, 1.40);
  corner.bezierCurveTo(1.39, 1.27, 1.05, 1.09, 1.20, 0.99);
  corner.bezierCurveTo(1.38, 0.87, 1.59, 1.03, 1.56, 1.24);
  corner.lineTo(1.56, 1.56);
  for (let i = 0; i < 4; i++) extrude(corner, 0.51, -0.27, glaze, 0.065).rotation.z = i * Math.PI / 2;

  // Four deep, curled ribs join the central flower to the surrounding frame.
  const rib = new THREE.Shape();
  rib.moveTo(0, 1.62);
  rib.bezierCurveTo(0.05, 1.26, 0.49, 1.16, 0.72, 0.95);
  rib.bezierCurveTo(0.98, 0.69, 0.71, 0.47, 0.55, 0.62);
  rib.bezierCurveTo(0.46, 0.72, 0.54, 0.84, 0.66, 0.80);
  rib.bezierCurveTo(0.57, 0.99, 0.15, 1.06, 0, 1.32);
  rib.bezierCurveTo(-0.15, 1.06, -0.57, 0.99, -0.66, 0.80);
  rib.bezierCurveTo(-0.54, 0.84, -0.46, 0.72, -0.55, 0.62);
  rib.bezierCurveTo(-0.71, 0.47, -0.98, 0.69, -0.72, 0.95);
  rib.bezierCurveTo(-0.49, 1.16, -0.05, 1.26, 0, 1.62);
  for (let i = 0; i < 4; i++) extrude(rib, 0.48, -0.25, glaze, 0.075).rotation.z = i * Math.PI / 2;

  const petal = new THREE.Shape();
  petal.moveTo(-0.10, 0.12);
  petal.bezierCurveTo(-0.34, 0.37, -0.27, 0.68, 0, 0.99);
  petal.bezierCurveTo(0.26, 0.67, 0.34, 0.36, 0.10, 0.12);
  petal.quadraticCurveTo(0, 0.05, -0.10, 0.12);
  for (let i = 0; i < 4; i++) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    extrude(petal, 0.48, -0.24, glaze, 0.075).rotation.z = angle;
    const vein = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.30, 0.34), new THREE.Vector3(0.01, 0.56, 0.36),
      new THREE.Vector3(0, 0.83, 0.31),
    ]);
    const raisedVein = new THREE.Mesh(new THREE.TubeGeometry(vein, 20, 0.017, 8, false), relief);
    raisedVein.rotation.z = angle;
    block.add(raisedVein);
  }

  const centre = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.58, 48), glaze);
  centre.rotation.x = Math.PI / 2;
  block.add(centre);
  const seedGeometry = new THREE.SphereGeometry(0.065, 12, 8);
  for (const side of [-1, 1]) {
    for (const [count, radius] of [[1, 0], [7, 0.13], [13, 0.275]]) {
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2 + radius;
        const seed = new THREE.Mesh(seedGeometry, relief);
        seed.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, side * 0.32);
        seed.scale.z = 0.75;
        block.add(seed);
      }
    }
  }

  // Low relief scrollwork follows all four edges of the glazed rim.
  for (let edge = 0; edge < 4; edge++) {
    for (let motif = 0; motif < 5; motif++) {
      const points = [];
      for (let j = 0; j <= 40; j++) {
        const t = j / 40, angle = t * Math.PI * 2.0;
        const radius = 0.13 * (1 - t * 0.80);
        points.push(new THREE.Vector3(-1.35 + motif * 0.67 + Math.cos(angle) * radius * 1.55, 1.76 + Math.sin(angle) * radius, 0.365));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const scroll = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.019, 6, false), relief);
      scroll.rotation.z = edge * Math.PI / 2;
      block.add(scroll);
    }
  }
  return block;
}
