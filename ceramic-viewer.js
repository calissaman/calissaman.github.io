import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { createCeramicBlock } from './ceramic-model.js?v=20260917-113';

export function mountCeramicViewer(section) {
  const host = section.querySelector('.ceramic-stage');
  const status = section.querySelector('.ceramic-status');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
  } catch {
    status.textContent = 'The 3D view needs WebGL. Here is the original ceramic block.';
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', 'Interactive celadon ceramic block. Drag or use arrow keys to turn. Use plus and minus to zoom.');
  canvas.setAttribute('aria-describedby', 'ceramic-help');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  const block = createCeramicBlock();
  scene.add(block);
  scene.add(new THREE.HemisphereLight(0xfbf4dd, 0x314239, 0.85));
  const light = new THREE.DirectionalLight(0xffeed5, 2.5);
  light.position.set(-3, 5, 6);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = light.shadow.camera.bottom = -3;
  light.shadow.camera.right = light.shadow.camera.top = 3;
  light.shadow.bias = -0.0003;
  light.shadow.normalBias = 0.015;
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xe2f6ff, 1.1);
  fill.position.set(4, 1, -3);
  scene.add(fill);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.minDistance = 4.5;
  controls.maxDistance = 13;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI - 0.15;
  controls.rotateSpeed = 0.7;
  controls.autoRotateSpeed = 1.0;
  let visible = false, frame = 0, last = 0, disposed = false;
  const spin = section.querySelector('[data-ceramic="spin"]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function render() {
    if (!disposed) renderer.render(scene, camera);
  }
  function stopSpin() {
    controls.autoRotate = false;
    spin.setAttribute('aria-pressed', 'false');
    spin.textContent = 'Slow spin';
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function animate(now) {
    frame = 0;
    if (!visible || document.hidden || !controls.autoRotate || disposed) return;
    controls.update(last ? Math.min((now - last) / 1000, 0.05) : 0);
    last = now;
    frame = requestAnimationFrame(animate);
  }
  function resume() {
    if (visible && !document.hidden && controls.autoRotate && !frame) {
      last = 0;
      frame = requestAnimationFrame(animate);
    }
  }
  function reset() {
    stopSpin();
    camera.position.set(-4.2, 2.1, 8.4);
    controls.target.set(0, 0, 0);
    controls.update();
    render();
  }
  function turn(delta) {
    const spherical = new THREE.Spherical().setFromVector3(camera.position);
    spherical.theta += delta;
    camera.position.setFromSpherical(spherical);
    controls.update();
  }
  function zoom(factor) {
    camera.position.multiplyScalar(factor);
    camera.position.setLength(THREE.MathUtils.clamp(camera.position.length(), controls.minDistance, controls.maxDistance));
    controls.update();
  }
  function keydown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(event.key)) return;
    event.preventDefault();
    stopSpin();
    if (event.key === 'Home') reset();
    else if (event.key === '+' || event.key === '=') zoom(0.9);
    else if (event.key === '-') zoom(1.1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') turn(event.key === 'ArrowLeft' ? -0.15 : 0.15);
    else {
      const s = new THREE.Spherical().setFromVector3(camera.position);
      s.phi = THREE.MathUtils.clamp(s.phi + (event.key === 'ArrowUp' ? -0.12 : 0.12), 0.15, Math.PI - 0.15);
      camera.position.setFromSpherical(s);
      controls.update();
    }
  }
  function action(event) {
    const button = event.target.closest('[data-ceramic]');
    if (!button) return;
    switch (button.dataset.ceramic) {
      case 'reset': reset(); break;
      case 'left': stopSpin(); turn(-0.25); break;
      case 'right': stopSpin(); turn(0.25); break;
      case 'in': zoom(0.9); break;
      case 'out': zoom(1.1); break;
      case 'spin':
        if (controls.autoRotate) stopSpin();
        else {
          controls.autoRotate = true;
          spin.setAttribute('aria-pressed', 'true');
          spin.textContent = 'Pause spin';
          resume();
        }
    }
  }
  function resize() {
    const {width, height} = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  controls.addEventListener('change', render);
  controls.addEventListener('start', stopSpin);
  canvas.addEventListener('keydown', keydown);
  section.addEventListener('click', action);
  document.addEventListener('visibilitychange', resume);
  reduced.addEventListener('change', stopSpin);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  });
  observer.observe(host);
  const resizer = new ResizeObserver(resize);
  resizer.observe(host);
  reset();
  host.append(canvas);
  section.dataset.ready = 'true';
  section.querySelector('.ceramic-controls').hidden = false;
  status.textContent = 'Drag to turn · Pinch or scroll to zoom';
  resize();
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    stopSpin();
    section.dataset.ready = 'false';
    section.querySelector('.ceramic-controls').hidden = true;
    status.textContent = 'The 3D view was interrupted. Reload to explore again.';
  });
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    resizer.disconnect();
    document.removeEventListener('visibilitychange', resume);
    reduced.removeEventListener('change', stopSpin);
    section.removeEventListener('click', action);
    canvas.removeEventListener('keydown', keydown);
    controls.dispose();
    const geometries = new Set(), materials = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    environment.dispose();
    renderer.dispose();
  });
}
