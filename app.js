const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

root.dataset.theme = "dark";

const canvas = document.querySelector(".ambient-canvas");
const context = canvas?.getContext("2d");
const flowItems = Array.from(document.querySelectorAll("[data-reveal]"));
let width = 0;
let height = 0;
let pixelRatio = 1;
let frame = 0;

const scrollState = {
  target: 0,
  eased: 0,
  previous: 0,
  velocity: 0,
  direction: 1,
  progress: 0,
};

const goldenAngle = Math.PI * (3 - Math.sqrt(5));
const petalPalette = [
  [255, 255, 255],
  [198, 249, 247],
  [99, 230, 230],
  [0, 184, 196],
  [0, 150, 168],
  [0, 112, 130],
];

const centerPalette = [
  [255, 255, 255],
  [236, 254, 249],
  [122, 230, 228],
];

const tilePalette = [
  [232, 244, 235],
  [198, 249, 247],
  [99, 230, 230],
  [0, 184, 196],
  [0, 150, 168],
  [0, 112, 130],
];

const tileCreamPalette = [
  [255, 255, 246],
  [236, 254, 249],
  [217, 255, 248],
];

const rosePalette = [
  [99, 230, 230],
  [198, 249, 247],
  [0, 184, 196],
];

const leafPalette = [
  [0, 112, 130],
  [0, 150, 168],
  [99, 230, 230],
];

const petalCount = 86;
const petals = Array.from({ length: petalCount }, (_, index) => {
  const ring = Math.sqrt(index / petalCount);
  const flowerTypes = [
    "camellia",
    "whiteCamellia",
    "plum",
    "peony",
    "orchid",
    "tileCamellia",
    "plum",
    "camellia",
    "blueFive",
    "tileCamellia",
    "peony",
    "plum",
    "whiteCamellia",
    "camellia",
    "tileCamellia",
    "orchid",
    "camellia",
    "peony",
    "blueFive",
    "plum",
    "tileCamellia",
  ];
  const depth = 0.72 + ((index * 23) % 9) / 9;
  const type = flowerTypes[index % flowerTypes.length];
  return {
    angle: index * goldenAngle,
    delay: (index % 17) / 17,
    depth,
    ring,
    size: 11 + ((index * 19) % 22),
    turn: index % 2 === 0 ? 1 : -1,
    color: type === "whiteCamellia" ? [248, 252, 246] : type === "blueFive" ? [88, 135, 232] : petalPalette[index % petalPalette.length],
    center: type === "blueFive" ? [236, 254, 249] : type === "whiteCamellia" ? [255, 255, 255] : centerPalette[index % centerPalette.length],
    bloom: 5 + (index % 4),
    type,
    tileMotif: index % 4,
    tileAccent: tilePalette[2 + (index % 3)],
    tileLine: tilePalette[4 + (index % 2)],
    tileCream: tileCreamPalette[index % tileCreamPalette.length],
    rose: rosePalette[index % rosePalette.length],
    roseShadow: rosePalette[(index + 2) % rosePalette.length],
    leaf: leafPalette[index % leafPalette.length],
    stemBend: Math.sin(index * 1.7) * 44,
    leafTurn: index % 2 === 0 ? -1 : 1,
  };
});

const foregroundBlooms = Array.from({ length: 14 }, (_, index) => {
  const flowerTypes = ["peony", "whiteCamellia", "plum", "orchid", "camellia", "blueFive", "tileCamellia", "peony", "plum", "camellia", "whiteCamellia", "tileCamellia", "orchid", "blueFive"];
  const row = Math.floor(index / 4);
  const rowIndex = index % 4;
  const type = flowerTypes[index % flowerTypes.length];
  return {
    angle: index * goldenAngle,
    delay: (index % 9) / 9,
    depth: 1.08 + row * 0.18 + ((index * 7) % 5) * 0.08,
    ring: 1,
    size: 52 + row * 20 + ((index * 29) % 42),
    turn: index % 2 === 0 ? 1 : -1,
    color: type === "whiteCamellia" ? [248, 252, 246] : type === "blueFive" ? [88, 135, 232] : petalPalette[(index + row + 1) % petalPalette.length],
    center: type === "blueFive" ? [236, 254, 249] : type === "whiteCamellia" ? [255, 255, 255] : centerPalette[index % centerPalette.length],
    bloom: 6 + (index % 4),
    type,
    tileMotif: index % 4,
    tileAccent: tilePalette[2 + (index % 3)],
    tileLine: tilePalette[4 + (index % 2)],
    tileCream: tileCreamPalette[index % tileCreamPalette.length],
    rose: rosePalette[index % rosePalette.length],
    roseShadow: rosePalette[(index + 1) % rosePalette.length],
    leaf: leafPalette[index % leafPalette.length],
    stemBend: Math.sin(index * 1.7) * 44,
    leafTurn: index % 2 === 0 ? -1 : 1,
    x: (rowIndex + 0.28 + 0.42 * (row % 2)) / 4.2 + Math.sin(index * 1.9) * 0.025,
    y: 0.74 + row * 0.082 + ((index * 47) % 6) / 100,
    rotation: -0.52 + ((index * 37) % 104) / 100,
    row,
  };
});

const resizeCanvas = () => {
  if (!canvas || !context) return;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
};

const mix = (from, to, amount) => from + (to - from) * amount;
const inverseMix = (from, to, value) => clamp((value - from) / (to - from), 0, 1);
const pulsePop = (value) => {
  const eased = smoothstep(0, 1, value);
  return eased + Math.sin(eased * Math.PI) * 0.32;
};

const updateScrollState = () => {
  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollState.target = window.scrollY;
  scrollState.previous = scrollState.eased;
  scrollState.eased += (scrollState.target - scrollState.eased) * 0.085;
  scrollState.velocity += (scrollState.eased - scrollState.previous - scrollState.velocity) * 0.14;
  scrollState.direction = scrollState.velocity >= 0 ? 1 : -1;
  scrollState.progress = scrollState.eased / maxScroll;
};

const updateFlowText = () => {
  const viewportCenter = window.innerHeight * 0.5;
  const focusBand = window.innerHeight * 0.92;
  const easedOffset = scrollState.target - scrollState.eased;
  const washHue = 188 + Math.sin(scrollState.progress * Math.PI * 2.2) * 18;
  const washAlpha = root.dataset.theme === "dark" ? 0.64 : 0.52;

  flowItems.forEach((item) => {
    const rect = item.getBoundingClientRect();
    const center = rect.top + easedOffset + rect.height * 0.5;
    const distance = Math.abs(center - viewportCenter);
    const focus = 1 - inverseMix(0, focusBand, distance);
    const isHero = item.classList.contains("hero-copy");
    const easedFocus = smoothstep(0.04, 0.92, focus);
    const opacity = isHero && scrollState.progress < 0.12 ? 1 : mix(0.58, 1, easedFocus);
    const direction = center < viewportCenter ? -1 : 1;
    const drift = direction * mix(18, 0, easedFocus);
    const blur = isHero && scrollState.progress < 0.12 ? 0 : mix(2.8, 0, easedFocus);

    item.style.setProperty("--flow-opacity", opacity.toFixed(3));
    item.style.setProperty("--flow-y", `${drift.toFixed(2)}px`);
    item.style.setProperty("--flow-blur", `${blur.toFixed(2)}px`);
    item.style.setProperty("--wash-color", `hsla(${washHue.toFixed(1)}, 86%, ${root.dataset.theme === "dark" ? 72 : 38}%, ${washAlpha})`);
    item.style.setProperty("--text-wash", `${(opacity * 28).toFixed(2)}%`);
  });
};

const heroTextClearance = (x, y, scrollProgress) => {
  const active = 1 - smoothstep(0.02, 0.2, scrollProgress);
  if (active <= 0) return 0;

  const rect = width < 700
    ? {
        left: width * 0.05,
        right: width * 0.95,
        top: height * 0.16,
        bottom: height * 0.72,
      }
    : {
        left: width * 0.16,
        right: width * 0.84,
        top: height * 0.14,
        bottom: height * 0.66,
      };

  const insideX = smoothstep(rect.left, rect.left + 90, x) * (1 - smoothstep(rect.right - 90, rect.right, x));
  const insideY = smoothstep(rect.top, rect.top + 90, y) * (1 - smoothstep(rect.bottom - 90, rect.bottom, y));
  return insideX * insideY * active;
};

const petalPosition = (petal, index, scrollProgress) => {
  const heroToSwirl = smoothstep(0.14, 0.3, scrollProgress);
  const swirlToSpiral = smoothstep(0.34, 0.58, scrollProgress);
  const spiralHold = smoothstep(0.48, 0.62, scrollProgress) * (1 - smoothstep(0.84, 0.93, scrollProgress));
  const spiralToField = smoothstep(0.86, 0.98, scrollProgress);
  const time = frame * 0.008;
  const pageDrift = scrollProgress * height * 0.22;

  const bouquetBaseY = height * (width < 700 ? 0.78 : 0.75);
  const bouquetRadius = Math.min(width, height) * (0.035 + petal.ring * 0.24);
  const bouquetAngle = petal.angle + Math.sin(index * 0.73) * 0.18;
  const bouquetDomeLift = Math.pow(1 - petal.ring, 0.7) * height * 0.1;
  const bouquetX =
    width * (0.5 + Math.sin(index * 0.31) * 0.012) +
    Math.cos(bouquetAngle) * bouquetRadius * (width < 700 ? 0.76 : 0.92);
  const bouquetY =
    bouquetBaseY +
    Math.sin(bouquetAngle) * bouquetRadius * 0.52 -
    bouquetDomeLift -
    Math.cos(bouquetAngle * 2) * height * 0.012;

  const swirlRadius = Math.min(width, height) * (0.16 + petal.ring * 0.48);
  const swirlAngle = petal.angle + scrollProgress * 3.2;
  const swirlX = width * 0.5 + Math.cos(swirlAngle) * swirlRadius;
  const swirlY =
    height * 0.5 +
    Math.sin(swirlAngle * 0.92) * swirlRadius * 0.62 -
    pageDrift +
    Math.sin(time + index) * 18;

  const spiralProgress = index / (petalCount - 1);
  const spiralRadius = Math.min(width, height) * (0.07 + 0.28 * (1 - spiralProgress) + petal.depth * 0.04);
  const spiralSpin = smoothstep(0.36, 0.74, scrollProgress) * Math.PI * 3.65;
  const spiralAngle = -spiralProgress * Math.PI * 7.8 + spiralSpin;
  const spiralCenterX = width * (0.53 + Math.sin(scrollProgress * Math.PI * 1.6) * 0.025);
  const spiralCenterY = height * (1.04 - spiralProgress * 1.28);
  const spiralX =
    spiralCenterX +
    Math.cos(spiralAngle) * spiralRadius * 1.12 +
    Math.sin(time * 0.9 + index * 0.2) * 7;
  const spiralY =
    spiralCenterY +
    Math.sin(spiralAngle) * spiralRadius * 0.58 +
    Math.cos(time * 0.7 + index * 0.3) * 7;

  const row = index % 5;
  const fieldX =
    ((index * 149) % 1000) / 1000 * (width + 240) -
    120 +
    Math.sin(index * 0.9) * 16 * spiralToField;
  const fieldY =
    height * (0.7 + row * 0.07) +
    Math.sin(time * 0.55 + index * 0.4) * 11;

  const spiralMagnet = smoothstep(0.3, 0.46, scrollProgress);
  const x1 = mix(bouquetX, swirlX, heroToSwirl * (1 - spiralMagnet * 0.55));
  const y1 = mix(bouquetY, swirlY, heroToSwirl * (1 - spiralMagnet * 0.55));
  const x2 = mix(x1, spiralX, swirlToSpiral);
  const y2 = mix(y1, spiralY, swirlToSpiral);

  return {
    x: mix(x2, fieldX, spiralToField),
    y: mix(y2, fieldY, spiralToField),
    rotation: petal.angle * 0.18 + Math.PI * 0.08,
    field: spiralToField,
    bouquet: 1 - heroToSwirl,
    spiral: Math.max(swirlToSpiral * (1 - spiralToField), spiralHold),
    spiralHold,
    order: index / (petalCount - 1),
  };
};

const drawLeaf = (x, y, rotation, size, alpha, dark) => {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.beginPath();
  context.ellipse(0, 0, size * 0.28, size, 0, 0, Math.PI * 2);
  context.fillStyle = dark ? `rgba(99, 230, 230, ${alpha * 0.46})` : `rgba(0, 112, 130, ${alpha * 0.3})`;
  context.fill();
  context.strokeStyle = dark ? `rgba(198, 249, 247, ${alpha * 0.22})` : `rgba(0, 184, 196, ${alpha * 0.18})`;
  context.lineWidth = 0.7;
  context.stroke();
  context.restore();
};

const drawPetalLobe = (distance, petalWidth, petalHeight, color, alpha) => {
  const [r, g, b] = color;
  context.beginPath();
  context.ellipse(0, -distance, petalWidth, petalHeight, 0, 0, Math.PI * 2);
  context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  context.fill();
  context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.48})`;
  context.lineWidth = 0.65;
  context.stroke();
};

const drawBlobPetal = (distance, widthScale, heightScale, color, alpha, lean = 0) => {
  const [r, g, b] = color;
  context.beginPath();
  context.moveTo(0, -distance - heightScale);
  context.bezierCurveTo(
    widthScale * (0.9 + lean),
    -distance - heightScale * 0.78,
    widthScale * 1.08,
    -distance + heightScale * 0.38,
    widthScale * 0.12,
    -distance + heightScale * 0.72
  );
  context.bezierCurveTo(
    -widthScale * 0.92,
    -distance + heightScale * 0.42,
    -widthScale * (0.78 - lean),
    -distance - heightScale * 0.7,
    0,
    -distance - heightScale
  );
  context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  context.fill();
  context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
  context.lineWidth = Math.max(0.55, Math.min(widthScale, heightScale) * 0.035);
  context.stroke();
};

const drawOrchidVeins = (size, alpha, dark) => {
  context.save();
  context.strokeStyle = dark ? `rgba(236, 254, 249, ${alpha * 0.28})` : `rgba(0, 112, 130, ${alpha * 0.22})`;
  context.lineWidth = Math.max(0.45, size * 0.012);
  for (let i = -3; i <= 3; i += 1) {
    const offset = i * size * 0.055;
    context.beginPath();
    context.moveTo(offset * 0.25, -size * 0.02);
    context.quadraticCurveTo(offset * 1.2, -size * 0.34, offset * 1.8, -size * 0.76);
    context.stroke();
  }
  context.restore();
};

const drawMerlionIcon = (petal, size, alpha, dark) => {
  const [mr, mg, mb] = petal.tileAccent;
  const [fr, fg, fb] = petal.tileCream;
  const [lr, lg, lb] = petal.tileLine;

  context.save();
  context.globalAlpha = Math.min(alpha + 0.08, 0.9);

  context.beginPath();
  context.ellipse(0, -size * 0.1, size * 0.56, size * 0.62, 0, 0, Math.PI * 2);
  context.fillStyle = `rgba(${mr}, ${mg}, ${mb}, ${dark ? alpha * 0.72 : alpha * 0.62})`;
  context.fill();

  context.beginPath();
  context.moveTo(-size * 0.42, -size * 0.12);
  context.bezierCurveTo(-size * 0.4, -size * 0.48, -size * 0.2, -size * 0.68, 0, -size * 0.66);
  context.bezierCurveTo(size * 0.2, -size * 0.68, size * 0.4, -size * 0.48, size * 0.42, -size * 0.12);
  context.bezierCurveTo(size * 0.42, size * 0.16, size * 0.24, size * 0.32, 0, size * 0.32);
  context.bezierCurveTo(-size * 0.24, size * 0.32, -size * 0.42, size * 0.16, -size * 0.42, -size * 0.12);
  context.closePath();
  context.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${dark ? alpha * 0.82 : alpha * 0.88})`;
  context.fill();
  context.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha * 0.62})`;
  context.lineWidth = Math.max(0.8, size * 0.028);
  context.stroke();

  context.beginPath();
  context.arc(-size * 0.22, -size * 0.54, size * 0.08, 0, Math.PI * 2);
  context.arc(size * 0.22, -size * 0.54, size * 0.08, 0, Math.PI * 2);
  context.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${dark ? alpha * 0.78 : alpha * 0.86})`;
  context.fill();

  context.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha * 0.82})`;
  context.beginPath();
  context.arc(-size * 0.17, -size * 0.12, size * 0.045, 0, Math.PI * 2);
  context.arc(size * 0.17, -size * 0.12, size * 0.045, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.moveTo(-size * 0.06, size * 0.02);
  context.quadraticCurveTo(0, size * 0.08, size * 0.06, size * 0.02);
  context.moveTo(0, size * 0.08);
  context.quadraticCurveTo(-size * 0.08, size * 0.2, -size * 0.18, size * 0.12);
  context.moveTo(0, size * 0.08);
  context.quadraticCurveTo(size * 0.08, size * 0.2, size * 0.18, size * 0.12);
  context.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha * 0.78})`;
  context.lineCap = "round";
  context.stroke();

  for (let i = 0; i < 3; i += 1) {
    context.beginPath();
    const y = size * (0.45 + i * 0.16);
    context.moveTo(-size * 0.34, y);
    context.quadraticCurveTo(-size * 0.12, y + size * 0.14, size * 0.04, y);
    context.quadraticCurveTo(size * 0.22, y - size * 0.14, size * 0.42, y);
    context.strokeStyle = `rgba(${mr}, ${mg}, ${mb}, ${alpha * (0.5 + i * 0.08)})`;
    context.lineWidth = Math.max(1, size * 0.035);
    context.stroke();
  }

  context.restore();
};

const drawCloverIcon = (petal, size, alpha, dark) => {
  const [fr, fg, fb] = petal.leaf;
  const [lr, lg, lb] = petal.tileLine;

  context.save();
  context.globalAlpha = Math.min(alpha + 0.04, 0.86);

  for (let i = 0; i < 4; i += 1) {
    context.save();
    context.rotate((Math.PI * 2 * i) / 4 + Math.PI / 4);
    context.translate(0, -size * 0.28);
    context.beginPath();
    context.moveTo(0, size * 0.14);
    context.bezierCurveTo(size * 0.34, -size * 0.08, size * 0.22, -size * 0.48, 0, -size * 0.34);
    context.bezierCurveTo(-size * 0.22, -size * 0.48, -size * 0.34, -size * 0.08, 0, size * 0.14);
    context.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${dark ? alpha * 0.7 : alpha * 0.62})`;
    context.fill();
    context.strokeStyle = `rgba(236, 254, 249, ${alpha * 0.28})`;
    context.lineWidth = Math.max(0.55, size * 0.018);
    context.stroke();
    context.restore();
  }

  context.beginPath();
  context.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  context.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha * 0.72})`;
  context.fill();

  context.beginPath();
  context.moveTo(0, size * 0.12);
  context.quadraticCurveTo(size * 0.12, size * 0.58, -size * 0.18, size * 0.9);
  context.strokeStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.54})`;
  context.lineWidth = Math.max(0.8, size * 0.028);
  context.lineCap = "round";
  context.stroke();

  context.restore();
};

const drawOgeeCartouche = (size, fill, stroke, alpha) => {
  const [fr, fg, fb] = fill;
  const [sr, sg, sb] = stroke;
  const half = size * 0.48;
  const notch = size * 0.16;

  context.beginPath();
  context.moveTo(0, -half);
  context.quadraticCurveTo(notch, -half + notch * 0.18, notch, -half + notch);
  context.quadraticCurveTo(half * 0.72, -half * 0.72, half, 0);
  context.quadraticCurveTo(half * 0.72, half * 0.72, notch, half - notch);
  context.quadraticCurveTo(notch, half - notch * 0.18, 0, half);
  context.quadraticCurveTo(-notch, half - notch * 0.18, -notch, half - notch);
  context.quadraticCurveTo(-half * 0.72, half * 0.72, -half, 0);
  context.quadraticCurveTo(-half * 0.72, -half * 0.72, -notch, -half + notch);
  context.quadraticCurveTo(-notch, -half + notch * 0.18, 0, -half);
  context.closePath();
  context.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${alpha * 0.78})`;
  context.fill();
  context.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha * 0.62})`;
  context.lineWidth = Math.max(0.7, size * 0.045);
  context.stroke();
};

const drawTileQuatrefoil = (x, y, size, color, alpha) => {
  const [r, g, b] = color;
  context.save();
  context.translate(x, y);
  context.beginPath();
  for (let i = 0; i < 4; i += 1) {
    context.save();
    context.rotate((Math.PI * 2 * i) / 4);
    context.moveTo(0, -size * 0.08);
    context.quadraticCurveTo(size * 0.34, -size * 0.34, size * 0.62, 0);
    context.quadraticCurveTo(size * 0.34, size * 0.34, 0, size * 0.08);
    context.restore();
  }
  context.fillStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
  context.fill();
  context.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.78})`;
  context.lineWidth = Math.max(0.6, size * 0.09);
  context.stroke();
  context.restore();
};

const drawMiniRose = (x, y, size, rotation, petal, alpha) => {
  const [rr, rg, rb] = petal.rose;
  const [sr, sg, sb] = petal.roseShadow;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  for (let layer = 0; layer < 3; layer += 1) {
    const count = 5 + layer;
    for (let i = 0; i < count; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * (i + layer * 0.33)) / count);
      context.beginPath();
      context.ellipse(0, -size * (0.18 + layer * 0.1), size * (0.18 - layer * 0.025), size * 0.3, 0, 0, Math.PI * 2);
      context.fillStyle = `rgba(${rr}, ${rg}, ${rb}, ${alpha * (0.58 + layer * 0.12)})`;
      context.fill();
      context.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha * 0.5})`;
      context.lineWidth = Math.max(0.45, size * 0.035);
      context.stroke();
      context.restore();
    }
  }

  context.beginPath();
  context.arc(0, 0, size * 0.08, 0, Math.PI * 2);
  context.fillStyle = `rgba(${sr}, ${sg}, ${sb}, ${alpha * 0.72})`;
  context.fill();
  context.restore();
};

const drawRoseCluster = (petal, size, alpha) => {
  const [lr, lg, lb] = petal.leaf;
  const leaves = [
    [-0.34, -0.18, -0.88],
    [0.34, -0.2, 0.88],
    [-0.26, 0.22, -2.26],
    [0.28, 0.24, 2.26],
  ];

  leaves.forEach(([x, y, rotation]) => {
    context.save();
    context.translate(size * x, size * y);
    context.rotate(rotation);
    context.beginPath();
    context.ellipse(0, 0, size * 0.08, size * 0.22, 0, 0, Math.PI * 2);
    context.fillStyle = `rgba(${lr}, ${lg}, ${lb}, ${alpha * 0.68})`;
    context.fill();
    context.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.22})`;
    context.lineWidth = Math.max(0.45, size * 0.018);
    context.stroke();
    context.restore();
  });

  drawMiniRose(-size * 0.12, 0, size * 0.3, -0.18, petal, alpha);
  drawMiniRose(size * 0.18, size * 0.03, size * 0.24, 0.32, petal, alpha * 0.9);
};

const drawPeranakanMotif = (petal, size, alpha, dark) => {
  if (alpha < 0.06 || size < 5.5) return;

  const [ar, ag, ab] = petal.tileAccent;
  const [lr, lg, lb] = petal.tileLine;
  const [cr, cg, cb] = petal.tileCream;
  const porcelainAlpha = dark ? alpha * 0.2 : alpha * 0.32;
  const lineAlpha = dark ? alpha * 0.42 : alpha * 0.4;
  const motifSize = size * 0.42;

  context.save();
  context.globalAlpha = Math.min(alpha + 0.04, 0.72);

  drawOgeeCartouche(size * 0.54, petal.tileCream, petal.tileLine, porcelainAlpha);

  context.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${lineAlpha})`;
  context.lineWidth = Math.max(0.45, size * 0.018);
  context.beginPath();
  context.moveTo(0, -motifSize);
  context.lineTo(motifSize, 0);
  context.lineTo(0, motifSize);
  context.lineTo(-motifSize, 0);
  context.closePath();
  context.stroke();

  context.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${dark ? alpha * 0.42 : alpha * 0.46})`;
  for (let i = 0; i < 4; i += 1) {
    context.save();
    context.rotate((Math.PI * 2 * i) / 4);
    context.beginPath();
    context.moveTo(0, -motifSize * 0.9);
    context.quadraticCurveTo(motifSize * 0.22, -motifSize * 0.32, 0, -motifSize * 0.08);
    context.quadraticCurveTo(-motifSize * 0.22, -motifSize * 0.32, 0, -motifSize * 0.9);
    context.stroke();
    context.restore();
  }

  context.beginPath();
  context.arc(0, 0, size * 0.09, 0, Math.PI * 2);
  context.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${dark ? alpha * 0.46 : alpha * 0.58})`;
  context.fill();
  drawTileQuatrefoil(0, 0, size * 0.13, petal.tileLine, dark ? alpha * 0.32 : alpha * 0.4);

  context.restore();
};

const drawPeranakanTileHalo = (petal, x, y, rotation, size, alpha, dark) => {
  if (alpha < 0.04) return;

  const [ar, ag, ab] = petal.tileAccent;
  const [lr, lg, lb] = petal.tileLine;
  const motifSize = size * 1.28;

  context.save();
  context.translate(x, y);
  context.rotate(rotation + Math.PI / 4);
  context.globalAlpha = Math.min(alpha, dark ? 0.46 : 0.38);

  context.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${dark ? 0.18 : 0.16})`;
  context.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${dark ? 0.82 : 0.68})`;
  context.lineWidth = Math.max(0.9, size * 0.034);

  context.beginPath();
  context.moveTo(0, -motifSize * 0.62);
  context.lineTo(motifSize * 0.54, -motifSize * 0.31);
  context.lineTo(motifSize * 0.54, motifSize * 0.31);
  context.lineTo(0, motifSize * 0.62);
  context.lineTo(-motifSize * 0.54, motifSize * 0.31);
  context.lineTo(-motifSize * 0.54, -motifSize * 0.31);
  context.closePath();
  context.fill();
  context.stroke();

  context.strokeStyle = `rgba(255, 255, 255, ${dark ? 0.2 : 0.36})`;
  context.lineWidth = Math.max(0.55, size * 0.018);
  context.strokeRect(-motifSize * 0.38, -motifSize * 0.38, motifSize * 0.76, motifSize * 0.76);

  context.beginPath();
  for (let i = 0; i < 4; i += 1) {
    context.save();
    context.rotate((Math.PI * 2 * i) / 4);
    context.moveTo(0, -motifSize * 0.48);
    context.lineTo(0, -motifSize * 0.2);
    context.quadraticCurveTo(motifSize * 0.18, -motifSize * 0.18, motifSize * 0.34, 0);
    context.quadraticCurveTo(motifSize * 0.18, motifSize * 0.18, 0, motifSize * 0.2);
    context.lineTo(0, motifSize * 0.48);
    context.restore();
  }
  context.stroke();

  context.fillStyle = `rgba(${ar}, ${ag}, ${ab}, ${dark ? 0.72 : 0.56})`;
  for (let i = 0; i < 4; i += 1) {
    const angle = (Math.PI * 2 * i) / 4;
    drawTileQuatrefoil(
      Math.cos(angle) * motifSize * 0.43,
      Math.sin(angle) * motifSize * 0.43,
      size * 0.12,
      petal.tileLine,
      dark ? 0.62 : 0.7
    );
  }

  context.restore();
};

const drawRoseCore = (petal, size, alpha, dark, showGeometry = false) => {
  const [cr, cg, cb] = petal.center;
  const [lr, lg, lb] = petal.tileLine;
  const [ar, ag, ab] = petal.tileAccent;

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  if (showGeometry) {
    context.strokeStyle = `rgba(${lr}, ${lg}, ${lb}, ${dark ? alpha * 0.26 : alpha * 0.3})`;
    context.lineWidth = Math.max(0.45, size * 0.012);
    context.beginPath();
    context.moveTo(0, -size * 0.24);
    context.lineTo(size * 0.24, 0);
    context.lineTo(0, size * 0.24);
    context.lineTo(-size * 0.24, 0);
    context.closePath();
    context.stroke();
  }

  context.strokeStyle = `rgba(${ar}, ${ag}, ${ab}, ${dark ? alpha * 0.56 : alpha * 0.5})`;
  context.lineWidth = Math.max(0.55, size * 0.022);
  for (let i = 0; i < 3; i += 1) {
    context.beginPath();
    context.ellipse(
      Math.cos(i * 1.7) * size * 0.025,
      Math.sin(i * 1.7) * size * 0.025,
      size * (0.1 + i * 0.04),
      size * (0.052 + i * 0.024),
      i * 0.74,
      Math.PI * 0.16,
      Math.PI * 1.76
    );
    context.stroke();
  }

  context.beginPath();
  context.arc(0, 0, size * 0.075, 0, Math.PI * 2);
  context.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(alpha + 0.12, 0.86)})`;
  context.fill();
  context.restore();
};

const drawRoseBloom = (petal, size, alpha, dark, showGeometry = false) => {
  const layers = [
    { count: 7, distance: 0.31, width: 0.2, height: 0.34, opacity: 0.88, offset: 0.03 },
    { count: 5, distance: 0.2, width: 0.18, height: 0.27, opacity: 0.84, offset: 0.36 },
    { count: 4, distance: 0.11, width: 0.13, height: 0.19, opacity: 0.74, offset: 0.14 },
  ];

  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * (i + layer.offset)) / layer.count + layerIndex * 0.11);
      drawBlobPetal(
        size * layer.distance,
        size * layer.width,
        size * layer.height,
        layerIndex === 2 ? petal.center : petal.color,
        alpha * layer.opacity,
        Math.sin(i * 1.4 + layerIndex) * 0.045
      );
      context.restore();
    }
  });

  drawRoseCore(petal, size, alpha, dark, showGeometry);
};

const drawBlueFiveBloom = (petal, size, alpha, dark) => {
  const [r, g, b] = petal.color;
  const [cr, cg, cb] = petal.center;

  for (let i = 0; i < 5; i += 1) {
    context.save();
    context.rotate((Math.PI * 2 * i) / 5 + 0.12);
    drawBlobPetal(size * 0.32, size * 0.32, size * 0.46, petal.color, alpha * 0.88, Math.sin(i) * 0.035);
    context.restore();
  }

  context.save();
  context.globalAlpha = alpha * 0.78;
  const gradient = context.createRadialGradient(0, 0, size * 0.04, 0, 0, size * 0.44);
  gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.96)`);
  gradient.addColorStop(0.48, `rgba(${cr}, ${cg}, ${cb}, 0.72)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, size * 0.44, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = dark ? `rgba(236, 254, 249, ${alpha * 0.28})` : `rgba(0, 112, 130, ${alpha * 0.24})`;
  context.lineWidth = Math.max(0.45, size * 0.012);
  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5 + 0.12;
    context.beginPath();
    context.moveTo(Math.cos(angle) * size * 0.1, Math.sin(angle) * size * 0.1);
    context.quadraticCurveTo(
      Math.cos(angle + 0.05) * size * 0.25,
      Math.sin(angle + 0.05) * size * 0.25,
      Math.cos(angle) * size * 0.54,
      Math.sin(angle) * size * 0.54
    );
    context.stroke();
  }
  context.restore();

  context.save();
  context.strokeStyle = dark ? `rgba(7, 17, 38, ${alpha * 0.46})` : `rgba(35, 48, 72, ${alpha * 0.42})`;
  context.lineWidth = Math.max(0.55, size * 0.018);
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6;
    context.beginPath();
    context.moveTo(Math.cos(angle) * size * 0.06, Math.sin(angle) * size * 0.06);
    context.lineTo(Math.cos(angle) * size * 0.2, Math.sin(angle) * size * 0.2);
    context.stroke();
    context.beginPath();
    context.arc(Math.cos(angle) * size * 0.22, Math.sin(angle) * size * 0.22, Math.max(0.75, size * 0.017), 0, Math.PI * 2);
    context.fillStyle = dark ? `rgba(236, 254, 249, ${alpha * 0.76})` : `rgba(35, 48, 72, ${alpha * 0.54})`;
    context.fill();
  }
  context.restore();
};

const drawBlossom = (petal, x, y, rotation, size, alpha) => {
  if (["bud", "star", "tile", "tulip", "pom", "flat", "merlion", "clover"].includes(petal.type)) {
    petal = { ...petal, type: "tileCamellia" };
  }

  const [r, g, b] = petal.color;
  const [cr, cg, cb] = petal.center;
  const dark = root.dataset.theme === "dark";

  context.save();
  context.translate(x, y);
  context.rotate(rotation);

  if (petal.type === "tulip") {
    for (let i = -1; i <= 1; i += 1) {
      context.save();
      context.rotate(i * 0.28);
      drawPetalLobe(size * 0.42, size * 0.32, size * 0.86, petal.color, alpha);
      context.restore();
    }
    context.beginPath();
    context.moveTo(-size * 0.5, size * 0.1);
    context.quadraticCurveTo(0, size * 0.46, size * 0.5, size * 0.1);
    context.lineTo(0, -size * 0.92);
    context.closePath();
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.78})`;
    context.fill();
  } else if (petal.type === "pom") {
    for (let layer = 0; layer < 2; layer += 1) {
      const count = petal.bloom + 3 + layer;
      for (let i = 0; i < count; i += 1) {
        context.save();
        context.rotate((Math.PI * 2 * i) / count + layer * 0.22);
        drawPetalLobe(size * (0.32 + layer * 0.18), size * 0.24, size * 0.5, petal.color, alpha * (0.78 + layer * 0.16));
        context.restore();
      }
    }
  } else if (petal.type === "star") {
    for (let i = 0; i < petal.bloom; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * i) / petal.bloom);
      context.beginPath();
      context.moveTo(0, -size * 1.08);
      context.quadraticCurveTo(size * 0.18, -size * 0.34, 0, -size * 0.08);
      context.quadraticCurveTo(-size * 0.18, -size * 0.34, 0, -size * 1.08);
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      context.fill();
      context.restore();
    }
  } else if (petal.type === "camellia") {
    drawRoseBloom(petal, size, alpha, dark);
  } else if (petal.type === "whiteCamellia") {
    drawRoseBloom(petal, size * 1.08, alpha * 0.94, dark);
  } else if (petal.type === "tileCamellia") {
    drawRoseBloom(petal, size, alpha, dark, true);
  } else if (petal.type === "peony") {
    drawRoseBloom(petal, size * 1.04, alpha, dark);
  } else if (petal.type === "blueFive") {
    drawBlueFiveBloom(petal, size * 1.02, alpha, dark);
  } else if (petal.type === "plum") {
    for (let layer = 0; layer < 2; layer += 1) {
      const count = 5;
      for (let i = 0; i < count; i += 1) {
        context.save();
        context.rotate((Math.PI * 2 * i) / count + layer * 0.22);
        context.translate(0, -size * (0.24 + layer * 0.04));
        drawBlobPetal(
          size * (0.32 - layer * 0.035),
          size * (0.34 - layer * 0.035),
          size * (0.44 - layer * 0.04),
          layer === 0 ? petal.color : petal.center,
          alpha * (0.7 + layer * 0.13),
          Math.sin(i * 1.6) * 0.08
        );
        context.restore();
      }
    }

    context.save();
    context.strokeStyle = dark ? `rgba(236, 254, 249, ${alpha * 0.7})` : `rgba(0, 112, 130, ${alpha * 0.54})`;
    context.lineWidth = Math.max(0.55, size * 0.018);
    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const inner = size * 0.1;
      const outer = size * (0.23 + (i % 2) * 0.04);
      context.beginPath();
      context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      context.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      context.stroke();
      context.beginPath();
      context.arc(Math.cos(angle) * outer, Math.sin(angle) * outer, Math.max(0.9, size * 0.022), 0, Math.PI * 2);
      context.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${Math.min(alpha + 0.08, 0.88)})`;
      context.fill();
    }
    context.restore();
  } else if (petal.type === "orchid") {
    const orchidPetals = [
      [-0.56, 0.46, 0.72, -0.12],
      [0.56, 0.46, 0.72, 0.12],
      [0, 0.56, 0.86, 0],
      [-1.18, 0.34, 0.52, -0.08],
      [1.18, 0.34, 0.52, 0.08],
    ];
    orchidPetals.forEach(([angle, widthScale, heightScale, lean]) => {
      context.save();
      context.rotate(angle);
      drawBlobPetal(size * 0.34, size * widthScale, size * heightScale, petal.color, alpha, lean);
      drawOrchidVeins(size * 0.9, alpha, dark);
      context.restore();
    });
    context.save();
    context.rotate(Math.PI);
    drawBlobPetal(size * 0.16, size * 0.34, size * 0.46, petal.center, alpha * 0.76, 0);
    context.restore();
  } else if (petal.type === "tile") {
    for (let i = 0; i < 4; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * i) / 4 + Math.PI / 4);
      drawBlobPetal(size * 0.38, size * 0.36, size * 0.7, petal.color, alpha, 0.05);
      context.restore();
    }
    for (let i = 0; i < 4; i += 1) {
      context.save();
      context.rotate((Math.PI * 2 * i) / 4);
      drawPetalLobe(size * 0.22, size * 0.18, size * 0.36, petal.center, alpha * 0.66);
      context.restore();
    }
  } else if (petal.type === "bud") {
    context.beginPath();
    context.ellipse(0, -size * 0.26, size * 0.42, size * 0.88, 0, 0, Math.PI * 2);
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    context.fill();
    context.beginPath();
    context.moveTo(-size * 0.36, size * 0.2);
    context.quadraticCurveTo(0, size * 0.58, size * 0.36, size * 0.2);
    context.strokeStyle = dark ? `rgba(188, 239, 244, ${alpha * 0.42})` : `rgba(255, 255, 255, ${alpha * 0.6})`;
    context.stroke();
  } else {
    for (let i = 0; i < petal.bloom; i += 1) {
      const angle = (Math.PI * 2 * i) / petal.bloom;
      context.save();
      context.rotate(angle);
      drawPetalLobe(size * 0.56, size * 0.34, size * 0.82, petal.color, alpha);
      context.restore();
    }
    for (let i = 0; i < petal.bloom; i += 1) {
      const angle = (Math.PI * 2 * (i + 0.5)) / petal.bloom;
      context.save();
      context.rotate(angle);
      drawPetalLobe(size * 0.34, size * 0.22, size * 0.52, petal.center, alpha * 0.72);
      context.restore();
    }
  }

  if (!["plum", "camellia", "whiteCamellia", "tileCamellia", "peony", "blueFive", "orchid"].includes(petal.type)) {
    drawRoseCore(petal, size, alpha, dark, petal.type === "tile");
  }
  context.restore();
};

const drawBouquetStems = (scrollProgress) => {
  const bouquet = 1 - smoothstep(0.12, 0.38, scrollProgress);
  if (bouquet <= 0.02) return;

  const dark = root.dataset.theme === "dark";
  const baseX = width * 0.5;
  const baseY = height * 0.96;
  const wrapWidth = Math.min(width * 0.22, 150);

  context.save();
  context.globalAlpha = bouquet * (dark ? 0.48 : 0.34);
  petals.forEach((petal, index) => {
    if (index % 3 === 0) return;
    const { x, y } = petalPosition(petal, index, scrollProgress);
    context.beginPath();
    context.moveTo(baseX + Math.sin(index * 1.4) * 24, baseY + Math.cos(index) * 8);
    context.quadraticCurveTo(baseX + petal.stemBend * 0.55, height * 0.78, x, y + petal.size * 0.78);
    context.strokeStyle = dark ? "rgba(99, 230, 230, 0.42)" : "rgba(0, 112, 130, 0.34)";
    context.lineWidth = index % 4 === 0 ? 1.15 : 0.82;
    context.stroke();
    if (index % 5 === 1) {
      drawLeaf(
        baseX + (x - baseX) * 0.52,
        baseY + (y - baseY) * 0.52,
        -0.72 * petal.leafTurn,
        petal.size * 0.74,
        0.7,
        dark
      );
    }
  });

  context.save();
  context.globalAlpha = bouquet * (dark ? 0.38 : 0.28);
  context.strokeStyle = dark ? "rgba(198, 249, 247, 0.34)" : "rgba(0, 112, 130, 0.28)";
  context.lineWidth = 1.1;
  for (let i = 0; i < 5; i += 1) {
    const y = baseY - 44 + i * 11;
    context.beginPath();
    context.moveTo(baseX - wrapWidth * 0.42, y + Math.sin(i) * 2);
    context.quadraticCurveTo(baseX, y - 8, baseX + wrapWidth * 0.42, y + Math.cos(i) * 2);
    context.stroke();
  }
  context.restore();

  context.beginPath();
  context.moveTo(baseX - wrapWidth * 0.48, baseY - 58);
  context.quadraticCurveTo(baseX, baseY - 18, baseX + wrapWidth * 0.48, baseY - 58);
  context.lineTo(baseX + wrapWidth * 0.22, baseY + 56);
  context.quadraticCurveTo(baseX, baseY + 76, baseX - wrapWidth * 0.22, baseY + 56);
  context.closePath();
  context.fillStyle = dark ? "rgba(7, 49, 69, 0.52)" : "rgba(255, 255, 255, 0.46)";
  context.fill();
  context.strokeStyle = dark ? "rgba(99, 230, 230, 0.28)" : "rgba(0, 112, 130, 0.22)";
  context.stroke();
  context.restore();
};

const drawSpiralBreath = (scrollProgress) => {
  const spiral = smoothstep(0.34, 0.58, scrollProgress) * (1 - smoothstep(0.86, 0.98, scrollProgress));
  if (spiral <= 0.02) return;

  const dark = root.dataset.theme === "dark";
  const centerX = width * 0.52;
  const centerY = height * 0.5;
  const maxRadius = Math.min(width, height) * 0.62;

  context.save();
  context.globalAlpha = spiral * (dark ? 0.24 : 0.18);
  context.lineWidth = 1.4;
  context.strokeStyle = dark ? "rgba(99, 230, 230, 0.55)" : "rgba(0, 112, 130, 0.42)";
  context.shadowBlur = 18;
  context.shadowColor = dark ? "rgba(99, 230, 230, 0.28)" : "rgba(0, 184, 196, 0.2)";
  context.beginPath();

  for (let i = 0; i < 110; i += 1) {
    const t = i / 109;
    const radius = maxRadius * Math.sqrt(t);
    const angle = -i * goldenAngle * 0.3 + spiral * Math.PI * 1.1;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius * 0.86;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }

  context.stroke();
  context.restore();
};

const drawFieldGround = (scrollProgress) => {
  const field = smoothstep(0.9, 0.99, scrollProgress);
  if (field <= 0.02) return;

  const dark = root.dataset.theme === "dark";
  const baseY = height * 0.73;

  context.save();
  context.globalAlpha = field * (dark ? 0.26 : 0.18);
  context.strokeStyle = dark ? "rgba(99, 230, 230, 0.34)" : "rgba(0, 112, 130, 0.32)";
  context.lineWidth = 1;

  petals.forEach((petal, index) => {
    if (index % 2 !== 0) return;
    const { x, y } = petalPosition(petal, index, scrollProgress);
    context.beginPath();
    context.moveTo(x, height + 8);
    context.quadraticCurveTo(x + Math.sin(index) * 8, mix(height, baseY, 0.65), x, y + petal.size * 0.5);
    context.stroke();
    if (index % 6 === 0) {
      drawLeaf(x + petal.leafTurn * 5, y + petal.size * 1.15, petal.leafTurn * 0.8, petal.size * 0.65, field, dark);
    }
  });

  context.restore();
};

const drawSeaFoliage = (field) => {
  if (field <= 0.02) return;

  context.save();
  context.globalAlpha = field * 0.2;
  context.strokeStyle = "rgba(99, 230, 230, 0.36)";
  context.lineWidth = 1.05;

  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 131) % 1000) / 1000 * (width + 220) - 110;
    const y = height * (0.72 + ((i * 31) % 24) / 100);
    const lean = Math.sin(i * 1.7) * 38;

    context.beginPath();
    context.moveTo(x + lean * 0.45, height + 12);
    context.quadraticCurveTo(x - lean * 0.28, mix(height, y, 0.72), x, y);
    context.stroke();

    if (i % 2 === 0) {
      drawLeaf(x + lean * 0.05, y + 18, Math.sin(i) * 0.7, 18 + (i % 5) * 3, 0.32, true);
    }
  }

  context.restore();
};

const drawForegroundBloomField = (scrollProgress) => {
  const field = smoothstep(0.74, 0.96, scrollProgress);
  if (field <= 0.02) return;

  const dark = root.dataset.theme === "dark";

  drawSeaFoliage(field);

  foregroundBlooms.forEach((flower, index) => {
    const bloomStart = 0.75 + flower.row * 0.042 + (index % 4) * 0.014;
    const bloom = pulsePop(smoothstep(bloomStart, bloomStart + 0.14, scrollProgress));
    const alpha = field * bloom * (0.2 + flower.row * 0.026);
    if (alpha <= 0.03) return;

    const x = flower.x * (width + 360) - 180;
    const y = height * flower.y + mix(96 - flower.row * 12, 0, bloom) + Math.sin(frame * 0.006 + index) * 4;
    const responsiveScale = width < 700 ? 0.76 : 1;
    const size = flower.size * responsiveScale * (0.62 + bloom * 0.34);
    const rotation = flower.rotation + Math.sin(frame * 0.004 + index * 0.7) * 0.035;

    drawBlossom(flower, x, y, rotation, size, alpha);
  });
};

const drawPetal = (petal, index, scrollProgress) => {
  const dark = root.dataset.theme === "dark";
  const { x, y, rotation, field, bouquet, spiral, spiralHold, order } = petalPosition(petal, index, scrollProgress);
  const visibility = 0.28 + Math.sin(frame * 0.018 + petal.delay * Math.PI * 2) * 0.08;
  const alpha = dark ? visibility * 0.78 : visibility;
  const size = petal.size * (0.78 + petal.depth * 0.52) * (1 - field * 0.2);
  const [r, g, b] = petal.color;
  const bouquetAlpha = bouquet * (dark ? 0.68 : 0.7);
  const bouquetScale = 1.08 + (1 - petal.ring) * 0.46 + (index % 5 === 0 ? 0.1 : 0);
  const kineticBloom = clamp(Math.abs(scrollState.velocity) * 0.004, 0, 0.22);
  const popWindowStart = 0.35 + order * 0.24;
  const spiralPop = pulsePop(smoothstep(popWindowStart, popWindowStart + 0.07, scrollProgress));
  const spiralGate = smoothstep(popWindowStart - 0.018, popWindowStart + 0.035, scrollProgress);
  const spiralAlpha = spiral * spiralPop * spiralGate * (dark ? 0.72 : 0.84);
  const looseAlpha = Math.min(alpha * (1 - bouquet * 0.92) * (1 - spiral * 0.98) * (1 - field * 0.9), dark ? 0.16 : 0.2);
  const fieldBloom = pulsePop(smoothstep(0.86 + (1 - order) * 0.06, 0.94 + (1 - order) * 0.035, scrollProgress));
  const fieldAlpha = field * fieldBloom * (dark ? 0.42 : 0.5);
  const clearance = heroTextClearance(x, y, scrollProgress);
  const textSafeAlpha = 1 - clearance * 0.92;

  if (bouquetAlpha > 0.03) {
    drawBlossom(petal, x, y, rotation * 0.12, size * bouquetScale, bouquetAlpha * textSafeAlpha);
  }

  if (spiralAlpha > 0.03) {
    drawBlossom(
      petal,
      x,
      y,
      rotation,
      size * (0.28 + spiralPop * 0.96 + spiralHold * 0.16 + kineticBloom),
      spiralAlpha * textSafeAlpha
    );
  }

  if (fieldAlpha > 0.03) {
    drawBlossom(
      petal,
      x,
      y,
      rotation * 0.5,
      size * (0.48 + fieldBloom * 0.3),
      fieldAlpha * (index % 2 === 0 ? 1 : 0.72)
    );
  }

  if (looseAlpha * textSafeAlpha <= 0.02) return;

  drawBlossom(
    petal,
    x,
    y,
    rotation * 0.5,
    size * (0.4 + spiral * 0.12),
    looseAlpha * textSafeAlpha
  );

  if (field > 0.56 && index % 3 === 0) {
    context.save();
    context.translate(x, y + size * 0.42);
    context.strokeStyle = dark ? "rgba(99, 230, 230, 0.16)" : "rgba(0, 112, 130, 0.16)";
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, 0);
    context.quadraticCurveTo(Math.sin(index) * 6, 18, Math.cos(index) * 4, 42);
    context.stroke();
    context.restore();
  }
};

const drawAmbient = () => {
  if (!canvas || !context) return;
  updateScrollState();
  updateFlowText();
  const scrollProgress = scrollState.progress;

  context.clearRect(0, 0, width, height);
  context.fillStyle = root.dataset.theme === "dark" ? "rgba(6, 24, 34, 0.16)" : "rgba(247, 252, 255, 0.18)";
  context.fillRect(0, 0, width, height);
  drawBouquetStems(scrollProgress);
  drawSpiralBreath(scrollProgress);
  drawFieldGround(scrollProgress);
  petals.forEach((petal, index) => drawPetal(petal, index, scrollProgress));
  drawForegroundBloomField(scrollProgress);

  frame += 1;
  window.requestAnimationFrame(drawAmbient);
};

if (canvas && context && !reduceMotion) {
  resizeCanvas();
  drawAmbient();
  window.addEventListener("resize", resizeCanvas, { passive: true });
} else {
  flowItems.forEach((item) => {
    item.style.setProperty("--flow-opacity", "1");
    item.style.setProperty("--flow-y", "0px");
    item.style.setProperty("--flow-blur", "0px");
  });
}

const books = [
  {
    title: "We Are Bellingcat",
    meta: "Eliot Higgins",
    color: "#008d9a",
    review:
      "A book that maps onto my SOCMINT hobby: following traces, finding unlikely sources of knowledge, and learning new hacks or networks. It's the same curiosity I bring to evals: keep asking where the evidence lives, who can see or measure it, and searching for unknown unknowns.",
  },
  {
    title: "Minor Feelings",
    meta: "Cathy Park Hong",
    color: "#2f6fba",
    review:
      "Sharp, restless, and exacting. It gives language to mixed emotional states without tidying them up for easy consumption.",
  },
  {
    title: "Ways of Seeing",
    meta: "John Berger",
    color: "#19b8c7",
    review:
      "A compact reminder that looking is never neutral. I like how it keeps moving between image, power, desire, and habit.",
  },
  {
    title: "Braiding Sweetgrass",
    meta: "Robin Wall Kimmerer",
    color: "#0f4c81",
    review:
      "Patient, generous, and quietly radical. It makes attention feel like an ethical practice rather than a private mood.",
  },
  {
    title: "Atlas of AI",
    meta: "Kate Crawford",
    color: "#5ecbd3",
    review:
      "A useful counterweight to abstract conversations about intelligence. It keeps the material, labor, and political costs of AI in view.",
  },
  {
    title: "The Alignment Problem",
    meta: "Brian Christian",
    color: "#1b78a6",
    review:
      "A clear narrative map of why evaluation, incentives, and values are hard to separate. It is especially good at making technical stakes legible.",
  },
];

const spines = document.querySelectorAll(".book-spine");
const review = document.querySelector(".book-review");
const reviewTitle = document.querySelector("#review-title");
const reviewMeta = document.querySelector("#review-meta");
const reviewText = document.querySelector("#review-text");

const selectBook = (index) => {
  const book = books[index];

  spines.forEach((spine, spineIndex) => {
    const isSelected = spineIndex === index;
    spine.classList.toggle("is-active", isSelected);
    spine.setAttribute("aria-selected", String(isSelected));
  });

  review.classList.add("is-changing");

  window.setTimeout(() => {
    review.style.setProperty("--active-book-color", book.color);
    reviewTitle.textContent = book.title;
    reviewMeta.textContent = book.meta;
    reviewText.textContent = book.review;
    review.classList.remove("is-changing");
  }, 130);
};

spines.forEach((spine) => {
  spine.addEventListener("click", () => {
    selectBook(Number(spine.dataset.book));
  });
});
