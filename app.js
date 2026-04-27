const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeToggle = document.querySelector(".theme-toggle");

const getStoredTheme = () => {
  try {
    return window.localStorage.getItem("calissa-theme");
  } catch {
    return null;
  }
};

const storeTheme = (theme) => {
  try {
    window.localStorage.setItem("calissa-theme", theme);
  } catch {
    // localStorage may be unavailable in stricter file:// contexts.
  }
};

const setTheme = (theme, persist = true) => {
  const nextTheme = theme === "dark" ? "dark" : "light";
  root.dataset.theme = nextTheme;
  if (themeToggle) {
    const dark = nextTheme === "dark";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    themeToggle.setAttribute("aria-pressed", String(dark));
  }
  if (persist) storeTheme(nextTheme);
};

setTheme(getStoredTheme() || root.dataset.theme || "dark", false);

const canvas = document.querySelector(".ambient-canvas");
const context = canvas?.getContext("2d");
const burstCanvas = document.querySelector(".burst-canvas");
const burstContext = burstCanvas?.getContext("2d");
const flowItems = Array.from(document.querySelectorAll("[data-reveal]"));
let width = 0;
let height = 0;
let pixelRatio = 1;
let frame = 0;
const flowerBurstTargets = [];
const petalBursts = [];

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

const burstPalette = [
  [255, 255, 255],
  [198, 249, 247],
  [99, 230, 230],
  [0, 184, 196],
];

const hydrangeaPalette = [
  [255, 255, 255],
  [221, 254, 250],
  [185, 248, 246],
  [126, 232, 236],
  [170, 214, 255],
  [232, 244, 255],
  [246, 222, 235],
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

const allowedFlowerTypes = ["camellia", "whiteCamellia", "peony", "tileCamellia", "rose", "nemophilia", "clover"];

const petalCount = 104;
const petals = Array.from({ length: petalCount }, (_, index) => {
  const ring = Math.sqrt(index / petalCount);
  const flowerTypes = [
    "rose",
    "camellia",
    "nemophilia",
    "clover",
    "whiteCamellia",
    "rose",
    "peony",
    "nemophilia",
    "tileCamellia",
    "clover",
    "rose",
    "camellia",
    "peony",
    "nemophilia",
    "tileCamellia",
    "rose",
    "clover",
    "whiteCamellia",
    "nemophilia",
    "rose",
    "camellia",
    "peony",
    "clover",
    "tileCamellia",
    "nemophilia",
    "rose",
    "clover",
    "whiteCamellia",
    "rose",
    "nemophilia",
  ];
  const depth = 0.72 + ((index * 23) % 9) / 9;
  const type = flowerTypes[index % flowerTypes.length];
  const spiralOrder = ((index * 37 + Math.floor(index / 3) * 11) % petalCount) / (petalCount - 1);
  return {
    angle: index * goldenAngle,
    delay: (index % 17) / 17,
    depth,
    ring,
    size: 11 + ((index * 19) % 22),
    turn: index % 2 === 0 ? 1 : -1,
    color: type === "whiteCamellia" ? [248, 252, 246] : type === "nemophilia" ? [88, 135, 232] : type === "clover" ? leafPalette[index % leafPalette.length] : petalPalette[index % petalPalette.length],
    center: type === "nemophilia" ? [236, 254, 249] : type === "whiteCamellia" ? [255, 255, 255] : type === "clover" ? [198, 249, 247] : centerPalette[index % centerPalette.length],
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
    spiralOrder,
  };
});

const foregroundBlooms = Array.from({ length: 18 }, (_, index) => {
  const flowerTypes = [
    "peony",
    "rose",
    "nemophilia",
    "clover",
    "whiteCamellia",
    "camellia",
    "rose",
    "nemophilia",
    "tileCamellia",
    "peony",
    "clover",
    "rose",
    "camellia",
    "tileCamellia",
    "nemophilia",
    "rose",
    "clover",
    "camellia",
    "whiteCamellia",
    "peony",
  ];
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
    color: type === "whiteCamellia" ? [248, 252, 246] : type === "nemophilia" ? [88, 135, 232] : type === "clover" ? leafPalette[index % leafPalette.length] : petalPalette[(index + row + 1) % petalPalette.length],
    center: type === "nemophilia" ? [236, 254, 249] : type === "whiteCamellia" ? [255, 255, 255] : type === "clover" ? [198, 249, 247] : centerPalette[index % centerPalette.length],
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

const floatingBottomBlooms = Array.from({ length: 22 }, (_, index) => {
  const flowerTypes = ["clover", "rose", "nemophilia", "rose", "clover", "nemophilia", "peony", "rose", "clover", "nemophilia"];
  const type = flowerTypes[index % flowerTypes.length];
  return {
    angle: index * goldenAngle,
    delay: (index % 8) / 8,
    depth: 0.92 + ((index * 11) % 7) * 0.06,
    ring: 1,
    size: 18 + ((index * 17) % 22),
    turn: index % 2 === 0 ? 1 : -1,
    color: type === "nemophilia" ? [88, 135, 232] : type === "clover" ? leafPalette[index % leafPalette.length] : petalPalette[(index + 2) % petalPalette.length],
    center: type === "nemophilia" ? [236, 254, 249] : type === "clover" ? [198, 249, 247] : centerPalette[index % centerPalette.length],
    bloom: 5 + (index % 4),
    type,
    tileMotif: index % 4,
    tileAccent: tilePalette[2 + (index % 3)],
    tileLine: tilePalette[4 + (index % 2)],
    tileCream: tileCreamPalette[index % tileCreamPalette.length],
    rose: rosePalette[index % rosePalette.length],
    roseShadow: rosePalette[(index + 1) % rosePalette.length],
    leaf: leafPalette[index % leafPalette.length],
    stemBend: 0,
    leafTurn: index % 2 === 0 ? -1 : 1,
    x: ((index * 181) % 1000) / 1000,
    y: 0.66 + ((index * 47) % 28) / 100,
    drift: 18 + ((index * 13) % 24),
    row: Math.floor(index / 4),
  };
});

const waterRipples = Array.from({ length: 14 }, (_, index) => ({
  x: ((index * 173) % 1000) / 1000,
  y: 0.08 + ((index * 89) % 880) / 1000,
  rx: 0.06 + (index % 5) * 0.018,
  ry: 0.012 + (index % 4) * 0.006,
  tilt: -0.5 + ((index * 37) % 100) / 100,
  speed: 0.0012 + (index % 4) * 0.00042,
  alpha: 0.09 + (index % 5) * 0.012,
}));

const leafShadowClusters = Array.from({ length: 7 }, (_, index) => ({
  x: 0.06 + ((index * 151) % 900) / 1000,
  y: 0.02 + ((index * 67) % 280) / 1000,
  rotation: -0.74 + index * 0.22,
  scale: 0.82 + (index % 4) * 0.18,
  leaves: 14 + (index % 4) * 4,
  alpha: 0.04 + (index % 3) * 0.012,
}));

const hydrangeaDrifters = Array.from({ length: 54 }, (_, index) => ({
  x: ((index * 137) % 1000) / 1000,
  y: 0.08 + ((index * 71) % 860) / 1000,
  size: 5.8 + (index % 7) * 1.7,
  colorIndex: index % hydrangeaPalette.length,
  speed: 0.00036 + (index % 6) * 0.00013,
  drift: 10 + (index % 6) * 6,
  rotation: index * 0.57,
  alpha: 0.18 + (index % 5) * 0.035,
  ripple: index % 3 === 0,
}));

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

  if (burstCanvas && burstContext) {
    burstCanvas.width = Math.floor(width * pixelRatio);
    burstCanvas.height = Math.floor(height * pixelRatio);
    burstCanvas.style.width = `${width}px`;
    burstCanvas.style.height = `${height}px`;
    burstContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
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

const registerFlowerBurstTarget = (x, y, size, alpha) => {
  if (alpha < 0.06 || x < -48 || x > width + 48 || y < -48 || y > height + 48) return;
  flowerBurstTargets.push({
    x,
    y,
    radius: clamp(size * 0.58, 18, 54),
    weight: alpha,
  });
};

const createPetalBurst = (x, y, radius = 34) => {
  const count = 24;
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.sin(i * 1.7) * 0.28;
    const speed = 1.4 + ((i * 17) % 18) / 10;
    const color = burstPalette[i % burstPalette.length];
    petalBursts.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.55,
      rotation: angle,
      spin: -0.08 + ((i * 13) % 16) / 100,
      size: radius * (0.12 + ((i * 7) % 8) / 100),
      life: 0,
      ttl: 58 + ((i * 11) % 22),
      color,
    });
  }
};

const drawBurstBlobPetal = (targetContext, distance, widthScale, heightScale, color, alpha, lean = 0) => {
  const [r, g, b] = color;
  targetContext.beginPath();
  targetContext.moveTo(0, -distance - heightScale);
  targetContext.bezierCurveTo(
    widthScale * (0.9 + lean),
    -distance - heightScale * 0.78,
    widthScale * 1.08,
    -distance + heightScale * 0.38,
    widthScale * 0.12,
    -distance + heightScale * 0.72
  );
  targetContext.bezierCurveTo(
    -widthScale * 0.92,
    -distance + heightScale * 0.42,
    -widthScale * (0.78 - lean),
    -distance - heightScale * 0.7,
    0,
    -distance - heightScale
  );
  targetContext.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  targetContext.fill();
  targetContext.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.24})`;
  targetContext.lineWidth = Math.max(0.55, Math.min(widthScale, heightScale) * 0.035);
  targetContext.stroke();
};

const drawPetalBursts = () => {
  const targetContext = burstContext || context;
  if (burstContext) {
    burstContext.clearRect(0, 0, width, height);
  }

  for (let i = petalBursts.length - 1; i >= 0; i -= 1) {
    const petal = petalBursts[i];
    petal.life += 1;
    if (petal.life >= petal.ttl) {
      petalBursts.splice(i, 1);
      continue;
    }

    const progress = petal.life / petal.ttl;
    const alpha = (1 - progress) * 0.82;
    petal.x += petal.vx;
    petal.y += petal.vy;
    petal.vx *= 0.982;
    petal.vy = petal.vy * 0.982 + 0.035;
    petal.rotation += petal.spin;

    targetContext.save();
    targetContext.translate(petal.x, petal.y);
    targetContext.rotate(petal.rotation);
    drawBurstBlobPetal(targetContext, 0, petal.size * 0.42, petal.size * 0.72, petal.color, alpha, Math.sin(petal.life * 0.08) * 0.08);
    targetContext.restore();
  }
};

const handleCanvasBurstClick = (event) => {
  if (!event.isPrimary || event.button > 0) return;

  const x = event.clientX;
  const y = event.clientY;
  let target = null;
  let bestScore = Infinity;

  flowerBurstTargets.forEach((flower) => {
    const dx = x - flower.x;
    const dy = y - flower.y;
    const distance = Math.hypot(dx, dy);
    if (distance > flower.radius) return;
    const score = distance / flower.radius - flower.weight * 0.12;
    if (score < bestScore) {
      bestScore = score;
      target = flower;
    }
  });

  createPetalBurst(x, y, target ? target.radius : 38);
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
  const bouquetRadius = Math.min(width, height) * (0.07 + petal.ring * 0.35);
  const bouquetAngle = petal.angle + Math.sin(index * 0.73) * 0.18;
  const bouquetDomeLift = Math.pow(1 - petal.ring, 0.7) * height * 0.1;
  const bouquetX =
    width * (0.5 + Math.sin(index * 0.31) * 0.012) +
    Math.cos(bouquetAngle) * bouquetRadius * (width < 700 ? 0.86 : 1.06);
  const bouquetY =
    bouquetBaseY +
    Math.sin(bouquetAngle) * bouquetRadius * 0.64 -
    bouquetDomeLift -
    Math.cos(bouquetAngle * 2) * height * 0.018;

  const swirlRadius = Math.min(width, height) * (0.16 + petal.ring * 0.48);
  const swirlAngle = petal.angle + scrollProgress * 3.2;
  const swirlX = width * 0.5 + Math.cos(swirlAngle) * swirlRadius;
  const swirlY =
    height * 0.5 +
    Math.sin(swirlAngle * 0.92) * swirlRadius * 0.62 -
    pageDrift +
    Math.sin(time + index) * 18;

  const spiralProgress = petal.spiralOrder ?? index / (petalCount - 1);
  const spiralRadius = Math.min(width, height) * (0.09 + 0.32 * (1 - spiralProgress) + petal.depth * 0.045);
  const spiralSpin = smoothstep(0.36, 0.74, scrollProgress) * Math.PI * 3.65;
  const spiralAngle = -spiralProgress * Math.PI * 8.35 + spiralSpin + Math.sin(index * 1.27) * 0.2;
  const spiralCenterX = width * (0.53 + Math.sin(scrollProgress * Math.PI * 1.6) * 0.025);
  const spiralCenterY = height * (1.06 - spiralProgress * 1.34);
  const spiralX =
    spiralCenterX +
    Math.cos(spiralAngle) * spiralRadius * 1.12 +
    Math.sin(time * 0.9 + index * 0.2) * 7;
  const spiralY =
    spiralCenterY +
    Math.sin(spiralAngle) * spiralRadius * 0.62 +
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
    order: spiralProgress,
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
  if (!allowedFlowerTypes.includes(petal.type)) {
    petal = { ...petal, type: "camellia" };
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
  } else if (petal.type === "rose") {
    drawRoseBloom(petal, size * 0.96, alpha, dark);
  } else if (petal.type === "nemophilia") {
    drawBlueFiveBloom(petal, size * 1.02, alpha, dark);
  } else if (petal.type === "clover") {
    drawCloverIcon(petal, size * 0.88, alpha, dark);
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

  if (!["camellia", "whiteCamellia", "tileCamellia", "peony", "rose", "nemophilia", "clover"].includes(petal.type)) {
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
    if (petal.type === "clover") return;
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
    if (petal.type === "clover") return;
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

const drawLightWaterAtmosphere = (scrollProgress) => {
  if (root.dataset.theme === "dark") return;

  context.save();

  const drift = frame * 0.004;
  const waterWash = context.createLinearGradient(0, 0, width, height);
  waterWash.addColorStop(0, "rgba(255, 255, 255, 0.26)");
  waterWash.addColorStop(0.42, "rgba(126, 232, 236, 0.12)");
  waterWash.addColorStop(1, "rgba(0, 184, 196, 0.1)");
  context.fillStyle = waterWash;
  context.fillRect(0, 0, width, height);

  waterRipples.forEach((ripple, index) => {
    const phase = (frame * ripple.speed + scrollProgress * 0.22 + index * 0.13) % 1;
    const x = ripple.x * width + Math.sin(drift * 0.9 + index) * 28;
    const y = ripple.y * height + Math.cos(drift * 0.7 + index * 0.8) * 16;
    const pulse = 0.74 + Math.sin(phase * Math.PI * 2) * 0.12;
    const rx = width * ripple.rx * pulse;
    const ry = height * ripple.ry * (1.1 - pulse * 0.16);

    context.save();
    context.globalAlpha = ripple.alpha;
    context.lineWidth = 1 + (index % 3) * 0.25;
    context.strokeStyle = index % 2 === 0 ? "rgba(0, 132, 150, 0.38)" : "rgba(99, 230, 230, 0.38)";
    context.beginPath();
    context.ellipse(x, y, rx, ry, ripple.tilt, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(255, 255, 255, 0.42)";
    context.lineWidth = 0.65;
    context.beginPath();
    context.ellipse(x + rx * 0.08, y - ry * 0.12, rx * 0.64, ry * 0.5, ripple.tilt, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  });

  leafShadowClusters.forEach((branch, branchIndex) => {
    const baseX = branch.x * width + Math.sin(drift * 0.62 + branchIndex) * 34;
    const baseY = branch.y * height + Math.cos(drift * 0.54 + branchIndex) * 22;
    context.save();
    context.translate(baseX, baseY);
    context.rotate(branch.rotation + Math.sin(drift + branchIndex) * 0.045);
    context.scale(branch.scale, branch.scale);
    context.fillStyle = `rgba(0, 112, 130, ${branch.alpha})`;
    context.filter = "blur(6px)";

    for (let leaf = 0; leaf < branch.leaves; leaf += 1) {
      const leafX = leaf * 19 - 92;
      const leafY = Math.sin(leaf * 0.92 + branchIndex) * 22 + leaf * 4.6;
      context.save();
      context.translate(leafX, leafY);
      context.rotate(leaf * 0.46 + Math.sin(drift + leaf) * 0.06);
      context.beginPath();
      context.ellipse(0, 0, 20 + (leaf % 4) * 5, 7 + (leaf % 3) * 2, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    context.restore();
  });

  context.filter = "none";

  hydrangeaDrifters.forEach((petal, index) => {
    const color = hydrangeaPalette[petal.colorIndex];
    const floatX = (petal.x + frame * petal.speed + scrollProgress * 0.04) % 1;
    const x = floatX * (width + 180) - 90 + Math.sin(frame * 0.007 + index) * petal.drift;
    const y =
      petal.y * height +
      Math.sin(frame * 0.004 + index * 1.4 + scrollProgress * Math.PI) * (16 + petal.drift * 0.42);
    const size = petal.size * (width < 700 ? 0.82 : 1);
    const alpha = petal.alpha;

    if (petal.ripple) {
      context.save();
      context.globalAlpha = alpha * 0.36;
      context.strokeStyle = "rgba(0, 132, 150, 0.34)";
      context.lineWidth = 0.85;
      context.beginPath();
      context.ellipse(x, y + size * 0.6, size * 2.8, size * 0.72, Math.sin(index) * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.strokeStyle = "rgba(255, 255, 255, 0.46)";
      context.beginPath();
      context.ellipse(x + size * 0.4, y + size * 0.42, size * 1.3, size * 0.34, Math.sin(index) * 0.34, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    context.save();
    context.translate(x, y);
    context.rotate(petal.rotation + Math.sin(frame * 0.006 + index) * 0.8);
    for (let lobe = 0; lobe < 4; lobe += 1) {
      context.save();
      context.rotate((Math.PI * 2 * lobe) / 4 + Math.PI / 4);
      drawBlobPetal(size * 0.32, size * 0.36, size * 0.52, color, alpha, 0.04);
      context.restore();
    }
    context.beginPath();
    context.arc(0, 0, Math.max(0.9, size * 0.1), 0, Math.PI * 2);
    context.fillStyle = `rgba(0, 132, 150, ${alpha * 0.42})`;
    context.fill();
    context.restore();
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
    registerFlowerBurstTarget(x, y, size, alpha);
  });

  floatingBottomBlooms.forEach((flower, index) => {
    const floatStart = 0.78 + (index % 5) * 0.025;
    const bloom = pulsePop(smoothstep(floatStart, floatStart + 0.16, scrollProgress));
    const alpha = field * bloom * 0.42;
    if (alpha <= 0.03) return;

    const responsiveScale = width < 700 ? 0.72 : 1;
    const drift = Math.sin(frame * 0.004 + index * 1.3) * flower.drift;
    const lift = Math.cos(frame * 0.005 + index * 0.8) * 14;
    const x = flower.x * (width + 220) - 110 + drift;
    const y = height * flower.y - bloom * (38 + flower.row * 6) + lift;
    const rotation = flower.angle * 0.16 + Math.sin(frame * 0.003 + index) * 0.18;
    const size = flower.size * responsiveScale * (0.7 + bloom * 0.42);

    drawBlossom(flower, x, y, rotation, size, alpha);
    registerFlowerBurstTarget(x, y, size, alpha);
  });
};

const drawPetal = (petal, index, scrollProgress) => {
  const dark = root.dataset.theme === "dark";
  const { x, y, rotation, field, bouquet, spiral, spiralHold, order } = petalPosition(petal, index, scrollProgress);
  const visibility = 0.28 + Math.sin(frame * 0.018 + petal.delay * Math.PI * 2) * 0.08;
  const alpha = dark ? visibility * 0.78 : visibility;
  const size = petal.size * (0.78 + petal.depth * 0.52) * (1 - field * 0.2);
  const [r, g, b] = petal.color;
  const bouquetAlpha = bouquet * (dark ? 0.62 : 0.66);
  const bouquetScale = 0.84 + (1 - petal.ring) * 0.24 + (index % 5 === 0 ? 0.05 : 0);
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

  if (bouquetAlpha > 0.03 && index % 11 !== 0) {
    const drawAlpha = bouquetAlpha * (index % 3 === 0 ? 0.82 : 1) * textSafeAlpha;
    const drawSize = size * bouquetScale;
    drawBlossom(petal, x, y, rotation * 0.12, drawSize, drawAlpha);
    registerFlowerBurstTarget(x, y, drawSize, drawAlpha);
  }

  if (spiralAlpha > 0.03 && index % 5 !== 1) {
    const drawSize = size * (0.22 + spiralPop * 0.66 + spiralHold * 0.09 + kineticBloom * 0.38);
    const drawAlpha = spiralAlpha * (index % 4 === 0 ? 0.86 : 1) * textSafeAlpha;
    drawBlossom(
      petal,
      x,
      y,
      rotation,
      drawSize,
      drawAlpha
    );
    registerFlowerBurstTarget(x, y, drawSize, drawAlpha);
  }

  if (fieldAlpha > 0.03) {
    const drawSize = size * (0.48 + fieldBloom * 0.3);
    const drawAlpha = fieldAlpha * (index % 2 === 0 ? 1 : 0.72);
    drawBlossom(
      petal,
      x,
      y,
      rotation * 0.5,
      drawSize,
      drawAlpha
    );
    registerFlowerBurstTarget(x, y, drawSize, drawAlpha);
  }

  if (looseAlpha * textSafeAlpha <= 0.02) return;

  const looseSize = size * (0.4 + spiral * 0.12);
  const looseDrawAlpha = looseAlpha * textSafeAlpha;
  drawBlossom(
    petal,
    x,
    y,
    rotation * 0.5,
    looseSize,
    looseDrawAlpha
  );
  registerFlowerBurstTarget(x, y, looseSize, looseDrawAlpha);

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
  flowerBurstTargets.length = 0;
  context.fillStyle = root.dataset.theme === "dark" ? "rgba(6, 24, 34, 0.16)" : "rgba(247, 255, 253, 0.1)";
  context.fillRect(0, 0, width, height);
  drawLightWaterAtmosphere(scrollProgress);
  drawBouquetStems(scrollProgress);
  drawSpiralBreath(scrollProgress);
  drawFieldGround(scrollProgress);
  petals.forEach((petal, index) => drawPetal(petal, index, scrollProgress));
  drawForegroundBloomField(scrollProgress);
  drawPetalBursts();

  frame += 1;
  window.requestAnimationFrame(drawAmbient);
};

if (canvas && context && !reduceMotion) {
  resizeCanvas();
  drawAmbient();
  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("pointerdown", handleCanvasBurstClick, { passive: true });
} else {
  flowItems.forEach((item) => {
    item.style.setProperty("--flow-opacity", "1");
    item.style.setProperty("--flow-y", "0px");
    item.style.setProperty("--flow-blur", "0px");
  });
}

themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

const books = [
  {
    title: "We Are Bellingcat",
    meta: "Eliot Higgins",
    color: "#008d9a",
    review:
      "A book that maps onto my SOCMINT hobby: following traces, finding unlikely sources of knowledge, and learning new hacks or networks. It's the same curiosity I bring to evals: keep asking where the evidence lives, who can see or measure it, and searching for unknown unknowns.",
  },
  {
    title: "The Book of Tea",
    meta: "OKAKURA KAKUZŌ",
    color: "#2f6fba",
    review:
      "\"Teaism is the art of concealing beauty that you may discover it, of suggesting what you dare not reveal.\" I like how Okakura treats taste as attention, humility, and restraint. The line \"Those who cannot feel the littleness of great things in themselves are apt to overlook the greatness of little things in others\" feels close to how I think about human relationships too.",
  },
  {
    title: "The Idea Factory: Bell Labs and the Great Age of American Innovation",
    meta: "Jon Gertner",
    color: "#19b8c7",
    review:
      "A timely reminder about innovation - it's not just lone genius, but through teams, tools, taste, and institutions that make ambitious research possible. The future is won by those who can connect science, engineering, product judgment, and the patience to make bold bets.",
  },
  {
    title: "Build",
    meta: "Tony Fadell",
    color: "#0f4c81",
    review:
      "I like Build as a field manual for turning taste into shipped things (when to trust data, when to use judgment, how to make abstract ideas tangible, and why storytelling matters when you need people to build with you).",
  },
  {
    title: "",
    meta: "",
    color: "#5ecbd3",
    review: "Always open to new books to read!",
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
    review.dataset.book = String(index);
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
