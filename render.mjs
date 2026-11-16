// render.mjs — deterministic renderer for "THE UNIVERSE INSIDE A DROP"
// Pure Node stdlib. No network. Fixed seed => byte-identical PNG.
import zlib from 'node:zlib';
import fs from 'node:fs';

const W = 1024, H = 1024;
const SEED = 1337;

// ---------- PRNG ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);

// ---------- value noise / fbm ----------
const PERM = new Uint8Array(512);
{
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  const r = mulberry32(9001);
  for (let i = 255; i > 0; i--) {
    const j = (r() * (i + 1)) | 0;
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
}
function fade(t) { return t * t * (3 - 2 * t); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const X = xi & 255, Y = yi & 255;
  const a = PERM[(PERM[X] + Y) & 255] / 255;
  const b = PERM[(PERM[(X + 1) & 255] + Y) & 255] / 255;
  const c = PERM[(PERM[X] + Y + 1) & 255] / 255;
  const d = PERM[(PERM[(X + 1) & 255] + Y + 1) & 255] / 255;
  const u = fade(xf), v = fade(yf);
  return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
}
function fbm(x, y, oct) {
  let amp = 0.5, freq = 1, sum = 0, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * freq, y * freq);
    norm += amp;
    amp *= 0.5; freq *= 2.03;
  }
  return sum / norm;
}

// ---------- float canvas ----------
const img = new Float32Array(W * H * 3);
function setPx(x, y, r, g, b, add) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  if (add) { img[i] += r; img[i + 1] += g; img[i + 2] += b; }
  else { img[i] = r; img[i + 1] = g; img[i + 2] = b; }
}
function addPx(x, y, r, g, b) { setPx(x, y, r, g, b, true); }

// ---------- 1) deep space background ----------
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const nx = x / W, ny = y / H;
    // radial-ish gradient: deep indigo center-top -> near black edges, teal bottom-left hint
    const dx = nx - 0.5, dy = ny - 0.44;
    const d = Math.sqrt(dx * dx + dy * dy);
    let r = 7 + 12 * (1 - d), g = 6 + 8 * (1 - d), b = 19 + 22 * (1 - d);
    // large-scale nebula wash
    const n1 = fbm(nx * 3.1 + 11.7, ny * 3.1 + 5.2, 5);
    const n2 = fbm(nx * 6.5 + 40.2, ny * 6.5 + 23.9, 4);
    const n3 = fbm(nx * 2.2 + 71.3, ny * 2.2 + 91.1, 4);
    // magenta cloud upper-right
    const mMask = Math.max(0, n1 - 0.46) * 2.6 * Math.exp(-((nx - 0.78) ** 2 + (ny - 0.22) ** 2) * 6);
    r += mMask * 120; g += mMask * 22; b += mMask * 105;
    // teal cloud lower-left
    const tMask = Math.max(0, n2 - 0.45) * 2.6 * Math.exp(-((nx - 0.16) ** 2 + (ny - 0.78) ** 2) * 6.5);
    r += tMask * 8; g += tMask * 95; b += tMask * 105;
    // faint amber wisp center-left
    const aMask = Math.max(0, n3 - 0.5) * 2.0 * Math.exp(-((nx - 0.28) ** 2 + (ny - 0.34) ** 2) * 9);
    r += aMask * 95; g += aMask * 62; b += aMask * 18;
    // overall faint dust mottling
    const dust = (n2 - 0.5) * 18;
    r += dust * 0.6; g += dust * 0.7; b += dust;
    setPx(x, y, r, g, b, false);
  }
}

// faint distant galaxy wisps (small angled ellipses, additive)
function wisp(cx, cy, rx, ry, rot, cr, cg, cb, amp) {
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const R = Math.max(rx, ry) * 2.2;
  for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(H, Math.ceil(cy + R)); y++) {
    for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, Math.ceil(cx + R)); x++) {
      const dx = x - cx, dy = y - cy;
      const lx = (dx * ca + dy * sa) / rx, ly = (-dx * sa + dy * ca) / ry;
      const d2 = lx * lx + ly * ly;
      if (d2 > 4) continue;
      const v = Math.exp(-d2 * 1.6) * amp;
      addPx(x, y, cr * v, cg * v, cb * v);
    }
  }
}
wisp(180, 240, 70, 16, -0.5, 150, 160, 200, 0.20);
wisp(840, 700, 80, 18, 0.4, 190, 150, 180, 0.18);
wisp(760, 180, 46, 12, 0.9, 140, 170, 210, 0.16);

// ---------- stars ----------
function gauss() { // approx normal
  return (rand() + rand() + rand() + rand() - 2) * 1.15;
}
const starN = 1500;
for (let i = 0; i < starN; i++) {
  const x = rand() * W, y = rand() * H;
  const b = Math.pow(rand(), 3.2) * 200 + 12;
  const warm = rand();
  let cr = b, cg = b, cb = b;
  if (warm < 0.18) { cr = b; cg = b * 0.82; cb = b * 0.6; }
  else if (warm > 0.85) { cr = b * 0.75; cg = b * 0.85; cb = b; }
  const s = rand() < 0.12 ? 1.6 : 1.0;
  // small gaussian splat
  const R = s < 1.2 ? 1 : 2;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const d2 = dx * dx + dy * dy;
    const v = Math.exp(-d2 / (s * s)) * b;
    addPx(x + dx, y + dy, cr * v / b * 1.0, cg * v / b * 1.0, cb * v / b * 1.0);
  }
}
// ~26 bright stars with diffraction spikes
for (let i = 0; i < 26; i++) {
  const x = rand() * W, y = rand() * H;
  const b = 170 + rand() * 130;
  const warm = rand() < 0.4;
  const cr = warm ? b : b * 0.85, cg = warm ? b * 0.9 : b * 0.92, cb = warm ? b * 0.7 : b;
  const R = 2;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const v = Math.exp(-(dx * dx + dy * dy) / 1.8) * b;
    addPx(x + dx, y + dy, cr * v / b, cg * v / b, cb * v / b);
  }
  const spikeLen = 14 + rand() * 22;
  for (let t = 1; t < spikeLen; t++) {
    const fall = Math.pow(1 - t / spikeLen, 2.2) * b * 0.55;
    addPx(x + t, y, cr * fall / b, cg * fall / b, cb * fall / b);
    addPx(x - t, y, cr * fall / b, cg * fall / b, cb * fall / b);
    addPx(x, y + t, cr * fall / b, cg * fall / b, cb * fall / b);
    addPx(x, y - t, cr * fall / b, cg * fall / b, cb * fall / b);
  }
}

// ---------- 2) interior universe (offscreen) ----------
const DROP_CX = W * 0.5, DROP_CY = H * 0.46, DROP_R = H * 0.335;
const IW = 768, IH = 768; // interior buffer
const interior = new Float32Array(IW * IH * 3);
function iSet(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= IW || y >= IH) return;
  const i = (y * IW + x) * 3; interior[i] = r; interior[i + 1] = g; interior[i + 2] = b;
}
function iAdd(x, y, r, g, b) {
  if (x < 0 || y < 0 || x >= IW || y >= IH) return;
  const i = (y * IW + x) * 3; interior[i] += r; interior[i + 1] += g; interior[i + 2] += b;
}
// base interior: very deep blue-violet with subtle gradient
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const nx = x / IW - 0.5, ny = y / IH - 0.5;
  const d = Math.sqrt(nx * nx + ny * ny);
  const v = Math.max(0, 1 - d * 1.35);
  iSet(x, y, 4 + 10 * v, 3 + 6 * v, 14 + 22 * v);
}
// interior nebula puffs (fbm, colored)
const puffs = [
  { cx: 0.30, cy: 0.36, rad: 0.34, r: 185, g: 30, b: 200, amp: 1.1 },  // magenta-violet
  { cx: 0.72, cy: 0.30, rad: 0.30, r: 14, g: 200, b: 215, amp: 1.05 },  // teal
  { cx: 0.62, cy: 0.74, rad: 0.30, r: 215, g: 130, b: 45, amp: 0.5 },   // amber
  { cx: 0.26, cy: 0.68, rad: 0.26, r: 60, g: 60, b: 190, amp: 0.5 },    // indigo
];
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const nx = x / IW, ny = y / IH;
  let r = 0, g = 0, b = 0;
  for (const p of puffs) {
    const dd = Math.hypot(nx - p.cx, ny - p.cy) / p.rad;
    if (dd > 1.6) continue;
    const n = fbm(nx * 5.5 + p.cx * 40, ny * 5.5 + p.cy * 40, 4);
    const fall = Math.exp(-dd * dd * 2.4);
    const m = Math.max(0, n - 0.30) * 3.1 * fall * p.amp;
    r += p.r * m; g += p.g * m; b += p.b * m;
  }
  iAdd(x, y, r, g, b);
}

// grand-design spiral galaxy, tilted
const GAL_CX = IW * 0.47, GAL_CY = IH * 0.44;
const GAL_ROT = -0.42, GAL_SQUASH = 0.60;
const GCA = Math.cos(GAL_ROT), GSA = Math.sin(GAL_ROT);
function galToWorld(lx, ly) { // local (unrotated, squashed) -> buffer coords
  return [GAL_CX + lx * GCA - ly * GSA, GAL_CY + lx * GSA + ly * GCA];
}
// core glow: white -> amber -> transparent
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const dx = x - GAL_CX, dy = y - GAL_CY;
  // unrotate
  const lx = (dx * GCA + dy * GSA), ly = (-dx * GSA + dy * GCA) / GAL_SQUASH;
  const d = Math.hypot(lx, ly);
  const core = Math.exp(-d * d / (2 * 22 * 22));
  const mid = Math.exp(-d * d / (2 * 53 * 53));
  const edge = Math.exp(-Math.pow(d - 24, 2) / (2 * 7 * 7)); // orange-gold rim at core edge
  iAdd(x, y, 225 * edge, 122 * edge, 34 * edge);
  iAdd(x, y, 232 * core + 195 * mid * 0.32, 224 * core + 145 * mid * 0.31, 210 * core + 95 * mid * 0.26);
}
// spiral arms: additive particles along log spiral
const armRand = mulberry32(4242);
const ARMS = 2, ARM_PARTICLES = 52000;
for (let i = 0; i < ARM_PARTICLES; i++) {
  const arm = i % ARMS;
  const t = Math.pow(armRand(), 0.75);           // 0 core .. 1 edge
  const theta = arm * Math.PI + t * 5.45 + (armRand() - 0.5) * (0.22 - t * 0.12);
  const rad = 10 + t * 178;
  const spread = 2.2 + t * 8.5;
  const lx = Math.cos(theta) * rad + (armRand() - 0.5) * spread;
  const ly = Math.sin(theta) * rad * GAL_SQUASH + (armRand() - 0.5) * spread * GAL_SQUASH;
  const wx = GAL_CX + lx * GCA - ly * GSA;
  const wy = GAL_CY + lx * GSA + ly * GCA;
  const xi = wx | 0, yi = wy | 0;
  if (xi < 0 || yi < 0 || xi >= IW || yi >= IH) continue;
  const bright = Math.pow(1 - t, 1.25) * (0.75 + armRand() * 0.95);
  // color: near core warm gold -> mid white -> tips cyan-blue
  let cr, cg, cb;
  if (t < 0.32) { const u = t / 0.32; cr = 255; cg = 190 - 55 * u; cb = 85 - 20 * u; }
  else if (t < 0.72) { const u = (t - 0.32) / 0.40; cr = 255 - 45 * u; cg = 215 + 30 * u; cb = 150 + 95 * u; }
  else { const u = (t - 0.72) / 0.28; cr = 150 - 60 * u; cg = 225 + 25 * u; cb = 255; }
  const b = bright * (0.6 + armRand() * 0.65);
  iAdd(xi, yi, cr * b * 0.31, cg * b * 0.31, cb * b * 0.31);
  // slight glow for some
  if (armRand() < 0.14) iAdd(xi, yi, cr * b * 0.24, cg * b * 0.24, cb * b * 0.24);
}
// grand-design arm ridge (smooth additive stroke along both arms)
for (let arm = 0; arm < 2; arm++) {
  for (let step = 0; step <= 560; step++) {
    const t = step / 560;
    const theta = arm * Math.PI + t * 5.45;
    const rad = 10 + t * 178;
    const lx = Math.cos(theta) * rad, ly = Math.sin(theta) * rad * GAL_SQUASH;
    const wx = GAL_CX + lx * GCA - ly * GSA;
    const wy = GAL_CY + lx * GSA + ly * GCA;
    const thick = 8.6 - t * 4.6;
    const amp = (1 - t * 0.45) * 1.25;
    // gold -> white -> cyan interpolation
    let cr, cg, cb;
    if (t < 0.35) { const u = t / 0.35; cr = 255; cg = 188 + 42 * u; cb = 75 + 145 * u; }
    else { const u = (t - 0.35) / 0.65; cr = 255 - 115 * u; cg = 238 + 12 * u; cb = 235 + 20 * u; }
    const R = Math.ceil(thick * 2);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 > R * R) continue;
      const v = Math.exp(-d2 / (thick * thick)) * amp;
      iAdd(wx + dx, wy + dy, cr * v, cg * v, cb * v);
    }
  }
}
// star-forming knots along the arms: bright magenta/cyan clumps (HII regions)
const knotRand = mulberry32(90210);
for (let arm = 0; arm < 2; arm++) {
  for (let k = 0; k < 46; k++) {
    const t = 0.22 + Math.pow(knotRand(), 0.8) * 0.74;
    const theta = arm * Math.PI + t * 5.45 + (knotRand() - 0.5) * 0.14;
    const rad = 10 + t * 178;
    const lx = Math.cos(theta) * rad, ly = Math.sin(theta) * rad * GAL_SQUASH;
    const wx = GAL_CX + lx * GCA - ly * GSA;
    const wy = GAL_CY + lx * GSA + ly * GCA;
    const magenta = knotRand() < 0.55;
    const amp = (0.7 + knotRand() * 1.1) * (1 - t * 0.30);
    const kr = magenta ? 255 : 120, kg = magenta ? 90 : 235, kb = magenta ? 200 : 255;
    const size = 1.5 + knotRand() * 3.2;
    const R = Math.ceil(size * 3);
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d2 = dx * dx + dy * dy;
      const v = Math.exp(-d2 / (2 * size * size)) * amp;
      iAdd(wx + dx, wy + dy, kr * v * 0.55, kg * v * 0.55, kb * v * 0.55);
    }
  }
}
// dark dust lane along one side of the major axis (multiply-ish via subtract)
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const dx = x - GAL_CX, dy = y - GAL_CY;
  const lx = dx * GCA + dy * GSA, ly = (-dx * GSA + dy * GCA) / GAL_SQUASH;
  const along = lx / 150, across = (ly - 14) / 16;
  const lane = Math.exp(-along * along * 1.4) * Math.exp(-across * across) * 0.30;
  if (lane > 0.01) {
    const i = (y * IW + x) * 3;
    interior[i] *= (1 - lane); interior[i + 1] *= (1 - lane); interior[i + 2] *= (1 - lane);
  }
}

// interior starfield
const istar = mulberry32(31337);
for (let i = 0; i < 520; i++) {
  const x = istar() * IW, y = istar() * IH;
  const b = Math.pow(istar(), 2.6) * 190 + 25;
  iAdd(x | 0, y | 0, b, b, b * (0.85 + istar() * 0.3));
}
// quasar-like bright central light with cross flare
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const dx = x - GAL_CX, dy = y - GAL_CY;
  const d = Math.hypot(dx, dy);
  const q = Math.exp(-d * d / (2 * 4.6 * 4.6)) * 118 + Math.exp(-d * d / (2 * 17 * 17)) * 46 + Math.exp(-d * d / (2 * 64 * 64)) * 22;
  iAdd(x, y, q, q * 0.93, q * 0.76);
  // cross flare
  const fx = Math.exp(-dy * dy / (2 * 1.4 * 1.4)) * Math.exp(-Math.abs(dx) / 52) * 78;
  const fy = Math.exp(-dx * dx / (2 * 1.4 * 1.4)) * Math.exp(-Math.abs(dy) / 52) * 78;
  iAdd(x, y, fx + fy, (fx + fy) * 0.95, (fx + fy) * 0.85);
}

// 4 tiny planets with gradient shading
const planets = [
  { x: IW * 0.24, y: IW * 0.22, r: 15, c1: [255, 190, 130], c2: [120, 60, 40] },  // amber
  { x: IW * 0.78, y: IW * 0.55, r: 11, c1: [150, 220, 255], c2: [20, 60, 110] },  // ice
  { x: IW * 0.55, y: IW * 0.17, r: 7,  c1: [235, 160, 220], c2: [80, 30, 90] },   // pink
  { x: IW * 0.33, y: IW * 0.55, r: 6,  c1: [200, 255, 220], c2: [30, 90, 70] },   // mint
];
for (const p of planets) {
  for (let y = Math.floor(p.y - p.r - 1); y <= p.y + p.r + 1; y++) {
    for (let x = Math.floor(p.x - p.r - 1); x <= p.x + p.r + 1; x++) {
      const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy);
      if (d > p.r) continue;
      // light from galaxy center direction
      const ldx = GAL_CX - p.x, ldy = GAL_CY - p.y, ld = Math.hypot(ldx, ldy);
      const nz = Math.sqrt(Math.max(0, 1 - (d / p.r) ** 2));
      const ndl = Math.max(0, (-dx * ldx / ld - dy * ldy / ld) / p.r * 0.9 + nz * 0.55);
      const t = ndl;
      const r = p.c2[0] + (p.c1[0] - p.c2[0]) * t;
      const g = p.c2[1] + (p.c1[1] - p.c2[1]) * t;
      const b = p.c2[2] + (p.c1[2] - p.c2[2]) * t;
      // terminator ring (atmosphere)
      const rim = Math.pow(1 - nz, 3.5) * 0.8;
      iSet(x, y, r + 90 * rim, g + 110 * rim, b + 120 * rim);
    }
  }
}

// crescent "world" silhouette along the bottom interior with glowing city grid
const CX = IW * 0.5, CY = IH * 1.24, CR = IH * 0.46; // big circle, only top crescent visible inside drop
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const d = Math.hypot(x - CX, y - CY);
  if (d < CR) {
    // silhouette: very dark with faint warm atmosphere edge
    const edge = CR - d;
    const atm = Math.exp(-edge * edge / 26) * 1.4;
    const i = (y * IW + x) * 3;
    interior[i] = 8 + 60 * atm * 0.5;
    interior[i + 1] = 6 + 34 * atm * 0.5;
    interior[i + 2] = 10 + 18 * atm * 0.5;
    // warm rim light on the crescent edge
    if (edge < 9) iAdd(x, y, 200 * (1 - edge / 9), 118 * (1 - edge / 9), 40 * (1 - edge / 9));
  }
}
// city lights: grid of warm dots along the crescent (just above the limb)
const cityRand = mulberry32(777);
for (let i = 0; i < 260; i++) {
  // pick a point on circle near top
  const ang = -Math.PI / 2 + (cityRand() - 0.5) * 1.5;
  const rr = CR - 2 - cityRand() * 26;
  const x = CX + Math.cos(ang) * rr, y = CY + Math.sin(ang) * rr;
  const b = 0.6 + Math.pow(cityRand(), 2.0) * 1.5;
  const xi = x | 0, yi = y | 0;
  iAdd(xi, yi, 255 * b, 185 * b, 90 * b);
  if (cityRand() < 0.25) { iAdd(xi, yi, 80 * b, 60 * b, 30 * b); }
}
// city glow haze above the limb
for (let y = 0; y < IH; y++) for (let x = 0; x < IW; x++) {
  const d = Math.hypot(x - CX, y - CY);
  const edge = d - CR; // negative inside
  if (edge > -46 && edge < 2) {
    const m = Math.exp(-Math.pow((edge + 16) / 15, 2)) * 0.9;
    iAdd(x, y, 120 * m, 62 * m, 18 * m);
  }
}
// beacon beams: thin vertical light rays from the city
const beams = [[-0.32, 90], [0.05, 130], [0.38, 70]];
for (const [rel, len] of beams) {
  const bx = CX + rel * IW * 0.42;
  // find top of crescent near bx
  const dyTop = Math.sqrt(Math.max(0, CR * CR - (bx - CX) * (bx - CX)));
  const topY = CY - dyTop;
  for (let t = 0; t < len; t++) {
    const y = topY - t;
    const fall = Math.pow(1 - t / len, 1.8) * 0.8;
    const wob = Math.sin(t * 0.08) * 1.2;
    iAdd(bx + wob, y, 200 * fall, 255 * fall, 255 * fall);
    iAdd(bx + wob + 1, y, 150 * fall, 215 * fall, 250 * fall);
    iAdd(bx + wob - 1, y, 120 * fall, 170 * fall, 220 * fall);
  }
}

// ---------- 3) composite: background + rays + droplet ----------
// volumetric rays behind droplet (additive wedges)
const rays = [[-0.9, 0.5], [-0.45, 0.34], [0.15, 0.42], [0.75, 0.3], [1.3, 0.28]];
for (const [ang, strength] of rays) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - DROP_CX, dy = y - DROP_CY;
    const dist = Math.hypot(dx, dy);
    if (dist < DROP_R * 0.9) continue;
    const proj = dx * ca + dy * sa;
    const perp = Math.abs(-dx * sa + dy * ca);
    if (proj < 0) continue;
    const width = 30 + proj * 0.16;
    const v = Math.exp(-perp * perp / (width * width)) * Math.exp(-proj / 620) * strength * 0.34;
    addPx(x, y, 120 * v, 170 * v, 210 * v);
  }
}

// ambient glow spilling onto surroundings (draw before droplet body so rim sits on top)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const d = Math.hypot(x - DROP_CX, y - DROP_CY);
  const glow = Math.exp(-Math.pow((d - DROP_R) / 90, 2)) * 0.5 * (d > DROP_R ? 1 : 0.4);
  if (glow > 0.003) addPx(x, y, 60 * glow, 105 * glow, 140 * glow);
}

// droplet body: refraction sample of interior
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = x - DROP_CX, dy = y - DROP_CY;
  const d = Math.hypot(dx, dy) / DROP_R; // 0..1 inside
  if (d >= 1.0) continue;
  // spherical lens magnification: sample more compressed at center? Actually magnify center:
  // map output radius -> source radius with f(d) = d^1.35 (expansion at rim keeps edges sharp)
  const f = Math.pow(d, 1.32);
  const ang = Math.atan2(dy, dx);
  // chromatic aberration: radial offset per channel, growing toward rim
  const ca = 0.010 * d * d * DROP_R; // pixels at rim
  const sx0 = DROP_CX + Math.cos(ang) * f * DROP_R;
  const sy0 = DROP_CY + Math.sin(ang) * f * DROP_R;
  // map droplet-space point into interior buffer space (scale to interior circle of IW)
  const scale = (IW * 0.46) / DROP_R;
  function sampleInt(px, py) {
    // interior buffer coordinates: center of interior at IW/2, IH/2 with radius IW/2 mapped to DROP_R
    const ix = (px - DROP_CX) * scale + IW / 2;
    const iy = (py - DROP_CY) * scale + IH / 2;
    // bilinear
    const x0 = Math.floor(ix), y0 = Math.floor(iy);
    const fx = ix - x0, fy = iy - y0;
    let r = 0, g = 0, b = 0;
    for (let oy = 0; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) {
      const xx = Math.min(IW - 1, Math.max(0, x0 + ox)), yy = Math.min(IH - 1, Math.max(0, y0 + oy));
      const w = (ox ? fx : 1 - fx) * (oy ? fy : 1 - fy);
      const i = (yy * IW + xx) * 3;
      r += interior[i] * w; g += interior[i + 1] * w; b += interior[i + 2] * w;
    }
    return [r, g, b];
  }
  const [rr, gr, br] = sampleInt(sx0 + Math.cos(ang) * ca, sy0 + Math.sin(ang) * ca); // red shifted outward
  const [rg, gg, bg] = sampleInt(sx0, sy0);                                              // green neutral
  const [rb, gb, bb] = sampleInt(sx0 - Math.cos(ang) * ca, sy0 - Math.sin(ang) * ca);    // blue shifted inward
  // spherical shading: darken toward rim slightly (lens thickness), plus fresnel later
  const shade = 1 - 0.28 * Math.pow(d, 3);
  let r = rr * shade, g = gg * shade, b = bb * shade;
  // subtle blue ambient fill inside the glass
  r += 6; g += 10; b += 16;
  setPx(x, y, r, g, b, false);
}

// fresnel rim + inner rim line + dark contact line + speculars (operate on droplet area)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = x - DROP_CX, dy = y - DROP_CY;
  const dist = Math.hypot(dx, dy);
  const d = dist / DROP_R;
  if (d >= 1.06) continue;
  const i = (y * W + x) * 3;
  // fresnel rim: bright cyan-white ring, strongest at grazing angle
  const fres = Math.pow(Math.max(0, d), 9.0);
  if (d < 1.0) {
    img[i] += 62 * fres; img[i + 1] += 105 * fres; img[i + 2] += 120 * fres;
  }
  // thin bright inner rim line at d≈0.965
  const rimLine = Math.exp(-Math.pow((d - 0.965) / 0.008, 2)) * 0.55;
  img[i] += 115 * rimLine; img[i + 1] += 150 * rimLine; img[i + 2] += 165 * rimLine;
  // dark contact line just inside rim (d≈0.90) for depth
  const contact = Math.exp(-Math.pow((d - 0.895) / 0.02, 2)) * 0.35;
  img[i] *= (1 - contact); img[i + 1] *= (1 - contact); img[i + 2] *= (1 - contact);
}
// crescent arc specular along upper-left rim (glass highlight)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dx = x - DROP_CX, dy = y - DROP_CY;
  const dist = Math.hypot(dx, dy);
  const d = dist / DROP_R;
  if (d < 0.78 || d > 0.97) continue;
  const a = Math.atan2(dy, dx); // upper-left: a in ~(-2.7, -1.35)
  let ang = a;
  const center = -2.05, halfWidth = 0.62;
  let dd = ang - center;
  while (dd > Math.PI) dd -= 2 * Math.PI;
  while (dd < -Math.PI) dd += 2 * Math.PI;
  const angW = Math.exp(-Math.pow(dd / halfWidth, 2) * 2.2);
  const radW = Math.exp(-Math.pow((d - 0.885) / 0.045, 2));
  const v = angW * radW * 0.95;
  const i = (y * W + x) * 3;
  img[i] += 225 * v; img[i + 1] += 240 * v; img[i + 2] += 250 * v;
}
// outer sharp edge: 1-2 px bright stroke + faint dark outer line
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const dist = Math.hypot(x - DROP_CX, y - DROP_CY);
  const d = dist / DROP_R;
  const i = (y * W + x) * 3;
  const edge = Math.exp(-Math.pow((d - 1.0) / 0.004, 2));
  if (edge > 0.02) { img[i] += 110 * edge; img[i + 1] += 140 * edge; img[i + 2] += 155 * edge; }
}
// offset specular highlight upper-left (soft ellipse, additive)
function spec(cx, cy, rx, ry, rot, amp) {
  const ca = Math.cos(rot), sa = Math.sin(rot);
  const R = Math.max(rx, ry) * 2.4;
  for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(H, Math.ceil(cy + R)); y++)
    for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, Math.ceil(cx + R)); x++) {
      const dx = x - cx, dy = y - cy;
      const lx = (dx * ca + dy * sa) / rx, ly = (-dx * sa + dy * ca) / ry;
      const d2 = lx * lx + ly * ly;
      if (d2 > 4) continue;
      const v = Math.exp(-d2 * 2.6) * amp;
      addPx(x, y, 235 * v, 245 * v, 255 * v);
    }
}
// (replaced by rim arc highlight below)

spec(DROP_CX + DROP_R * 0.42, DROP_CY + DROP_R * 0.48, DROP_R * 0.045, DROP_R * 0.02, -0.6, 0.6); // secondary glint lower-right


// ---------- 4) vignette ----------
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const nx = x / W - 0.5, ny = y / H - 0.5;
  const v = Math.exp(-(nx * nx + ny * ny) * 1.5);
  const i = (y * W + x) * 3;
  const m = 0.55 + 0.45 * v;
  img[i] *= m; img[i + 1] *= m; img[i + 2] *= m;
}

// ---------- PNG encode ----------
const raw = Buffer.alloc((W * 3 + 1) * H);
let p = 0;
for (let y = 0; y < H; y++) {
  raw[p++] = 0; // filter none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    raw[p++] = Math.max(0, Math.min(255, Math.round(img[i])));
    raw[p++] = Math.max(0, Math.min(255, Math.round(img[i + 1])));
    raw[p++] = Math.max(0, Math.min(255, Math.round(img[i + 2])));
  }
}
const idat = zlib.deflateSync(raw, { level: 9 });
// CRC32
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outDir + '/entry.png', png);
console.log('wrote', outDir + '/entry.png', png.length, 'bytes');
