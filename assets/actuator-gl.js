
const __bootActuator = (() => {
  "use strict";
  const TAU = Math.PI * 2;

  /* ═══════════════════════════════════════════════════════════
     1 · GEOMETRY — an actuator, exploded along its own axis (x)
     ═══════════════════════════════════════════════════════════ */

  const V = [], TONE = [], ACC = [], PART = [];
  let PART_ID = 0;
  const BUILT = [], HOME = [];
  function part(builtX, homeX) { PART_ID = HOME.length; BUILT.push(builtX); HOME.push(homeX); }

  function emit(a, b, c, tone, acc) {
    V.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    TONE.push(tone); ACC.push(acc ? 1 : 0); PART.push(PART_ID);
  }
  const quad = (a, b, c, d, tone, acc) => { emit(a, b, c, tone, acc); emit(a, c, d, tone, acc); };

  /* a ring / disc / cylinder, axis along x */
  function addTube(cx, ro, ri, len, tone, seg = 34, acc = 0) {
    const x0 = cx - len / 2, x1 = cx + len / 2;
    for (let j = 0; j < seg; j++) {
      const a0 = j / seg * TAU, a1 = (j + 1) / seg * TAU;
      const oc0 = Math.cos(a0) * ro, os0 = Math.sin(a0) * ro;
      const oc1 = Math.cos(a1) * ro, os1 = Math.sin(a1) * ro;
      const ic0 = Math.cos(a0) * ri, is0 = Math.sin(a0) * ri;
      const ic1 = Math.cos(a1) * ri, is1 = Math.sin(a1) * ri;
      quad([x0, oc0, os0], [x1, oc0, os0], [x1, oc1, os1], [x0, oc1, os1], tone, acc);
      if (ri > 0.004)
        quad([x0, ic0, is0], [x1, ic0, is0], [x1, ic1, is1], [x0, ic1, is1], tone * 0.62, acc);
      quad([x1, ic0, is0], [x1, oc0, os0], [x1, oc1, os1], [x1, ic1, is1], tone * 1.03, acc);
      quad([x0, ic0, is0], [x0, oc0, os0], [x0, oc1, os1], [x0, ic1, is1], tone * 0.88, acc);
    }
  }

  /* a box sitting at (radius, angle) around the x axis, rolled with it */
  function addBoxAt(cx, ang, radius, lx, lr, lt, tone, acc = 0) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const pts = [];
    for (const sx of [-1, 1]) for (const sr of [-1, 1]) for (const st of [-1, 1]) {
      const r = radius + sr * lr / 2, t = st * lt / 2;
      pts.push([cx + sx * lx / 2, r * ca - t * sa, r * sa + t * ca]);
    }
    // index order: [sx][sr][st] → 0..7
    const P = i => pts[i];
    quad(P(0), P(1), P(3), P(2), tone, acc);   // -x
    quad(P(4), P(6), P(7), P(5), tone, acc);   // +x
    quad(P(2), P(3), P(7), P(6), tone * 1.04, acc);  // outer
    quad(P(0), P(4), P(5), P(1), tone * 0.8, acc);   // inner
    quad(P(1), P(5), P(7), P(3), tone, acc);
    quad(P(0), P(2), P(6), P(4), tone * 0.9, acc);
  }

  /* a small cylinder parked off-axis (bolts, studs, planet gears) */
  function addPin(cx, ang, radius, r, len, tone, seg = 12, acc = 0) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const cy = radius * ca, cz = radius * sa;
    const x0 = cx - len / 2, x1 = cx + len / 2;
    for (let j = 0; j < seg; j++) {
      const a0 = j / seg * TAU, a1 = (j + 1) / seg * TAU;
      const p = a => [cy + Math.cos(a) * r, cz + Math.sin(a) * r];
      const [y0, z0] = p(a0), [y1, z1] = p(a1);
      quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z1], [x0, y1, z1], tone, acc);
      emit([x1, cy, cz], [x1, y0, z0], [x1, y1, z1], tone * 1.05, acc);
      emit([x0, cy, cz], [x0, y1, z1], [x0, y0, z0], tone * 0.86, acc);
    }
  }

  /* gear teeth: n blocks around a radius (outward or inward) */
  function addTeeth(cx, n, radius, len, h, w, tone, acc = 0) {
    for (let i = 0; i < n; i++) addBoxAt(cx, i / n * TAU, radius, len, h, w, tone, acc);
  }

  /* tonal vocabulary */
  const SHELL = 0.86, ALLOY = 0.62, STEEL = 0.40, DARKM = 0.22, BOARD = 0.13;

  /* ── 1 · output studs + flange ─────────────────────────── */
  part(-3.16, -0.1);
  addTube(-3.16, 0.075, 0.00, 0.62, STEEL, 20);                 // output shaft
  part(-3.28, -0.18);
  for (let i = 0; i < 8; i++) {
    addPin(-3.28, i / 8 * TAU, 0.265, 0.046, 0.48, ALLOY, 12);
    addPin(-3.54, i / 8 * TAU, 0.265, 0.068, 0.07, SHELL, 12);
  }
  part(-3.02, -0.42);
  addTube(-3.02, 0.34, 0.10, 0.075, SHELL, 30);

  part(-2.7, -0.34);
  /* ── 2 · output flange with bosses ─────────────────────── */
  addTube(-2.70, 0.47, 0.155, 0.11, SHELL, 34);
  for (let i = 0; i < 6; i++) addPin(-2.70, i / 6 * TAU + 0.26, 0.345, 0.072, 0.13, DARKM, 10);
  addTube(-2.757, 0.47, 0.435, 0.020, SHELL * 0.78, 34);        // rim relief
  for (let i = 0; i < 12; i++)
    addPin(-2.757, i / 12 * TAU, 0.415, 0.026, 0.035, DARKM * 0.7, 6);

  /* ── 3 · bearing races ─────────────────────────────────── */
  part(-2.38, -0.08);
  addTube(-2.38, 0.505, 0.345, 0.095, 1.0, 34, 1);              // accent race
  part(-2.09, -0.05);
  addTube(-2.09, 0.535, 0.445, 0.060, SHELL, 34);
  for (let i = 0; i < 12; i++)
    addPin(-2.09, i / 12 * TAU + 0.26, 0.490, 0.030, 0.075, STEEL, 6);
  part(-1.79, -0.02);
  addTube(-1.79, 0.565, 0.455, 0.135, 1.0, 34, 1);
  for (let i = 0; i < 16; i++) addPin(-1.79, i / 16 * TAU, 0.510, 0.038, 0.10, STEEL, 8);

  part(-1.44, 0.02);
  /* ── 4 · ring gear (internal teeth) ────────────────────── */
  addTube(-1.44, 0.605, 0.445, 0.165, SHELL, 36);
  addTeeth(-1.44, 34, 0.470, 0.165, 0.052, 0.048, ALLOY);
  for (let i = 0; i < 8; i++)
    addPin(-1.44, i / 8 * TAU + 0.39, 0.575, 0.042, 0.180, DARKM, 8);

  part(-1.1, 0.06);
  /* ── 5 · planet carrier ────────────────────────────────── */
  addTube(-1.10, 0.625, 0.105, 0.070, SHELL, 36);
  for (let i = 0; i < 8; i++)
    addBoxAt(-1.10, i / 8 * TAU, 0.115, 0.075, 0.030, 0.030, STEEL);
  for (let i = 0; i < 3; i++) addPin(-1.10, i / 3 * TAU + 0.5, 0.320, 0.135, 0.09, DARKM, 12);
  for (let i = 0; i < 8; i++) addPin(-1.10, i / 8 * TAU, 0.535, 0.045, 0.09, DARKM, 8);

  /* ── 6 · planetary gearset (two stages) ────────────────── */
  part(-1.05, 0.10);
  addTube(-1.05, 0.055, 0.00, 1.55, STEEL, 16);                 // sun shaft
  addTube(-1.62, 0.062, 0.052, 0.022, DARKM, 14);               // circlip grooves
  addTube(-0.38, 0.062, 0.052, 0.022, DARKM, 14);
  function addPlanet(cx, ang, radius, rg, len, teeth, tone) {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const cy = radius * ca, cz = radius * sa;
    addPin(cx, ang, radius, rg, len, tone, 18);
    for (let t = 0; t < teeth; t++) {
      const ta = t / teeth * TAU;
      const ry = cy + Math.cos(ta) * (rg + 0.028), rz = cz + Math.sin(ta) * (rg + 0.028);
      const local = Math.atan2(rz, ry), lr = Math.hypot(ry, rz);
      addBoxAt(cx, local, lr, len, 0.062, 0.050, tone * 1.02);
    }
  }
  part(-0.8, 0.04);
  for (let i = 0; i < 3; i++) addPlanet(-0.80, i / 3 * TAU + 0.5, 0.330, 0.170, 0.185, 14, ALLOY);
  addPlanet(-0.80, 0, 0, 0.150, 0.185, 12, STEEL);              // sun gear

  part(-0.42, 0.08);
  for (let i = 0; i < 3; i++) addPlanet(-0.42, i / 3 * TAU + 2.1, 0.245, 0.115, 0.150, 11, ALLOY);
  addPlanet(-0.42, 0, 0, 0.115, 0.150, 9, STEEL);
  part(-0.1, 0.10);
  addPlanet(-0.10, 0, 0, 0.120, 0.130, 10, ALLOY);

  /* ── 7 · rotor bearing + spoked rotor ──────────────────── */
  part(0.18, 0.12);
  addTube(0.18, 0.265, 0.105, 0.105, SHELL, 30);
  for (let i = 0; i < 10; i++) addPin(0.18, i / 10 * TAU, 0.190, 0.040, 0.11, STEEL, 8);
  part(0.46, 0.14);
  addTube(0.46, 0.230, 0.125, 0.150, 1.0, 30, 1);

  part(0.8, 0.16);
  addTube(0.80, 0.430, 0.360, 0.070, SHELL, 34);                // rotor rim
  addTube(0.80, 0.115, 0.045, 0.130, SHELL, 20);                // hub
  for (let i = 0; i < 6; i++) addBoxAt(0.80, i / 6 * TAU, 0.240, 0.060, 0.260, 0.075, SHELL);
  for (let i = 0; i < 6; i++)
    addPin(0.80, i / 6 * TAU + 0.52, 0.310, 0.038, 0.085, DARKM * 0.7, 8);
  for (let i = 0; i < 4; i++)
    addPin(0.815, i / 4 * TAU + 0.3, 0.078, 0.017, 0.03, DARKM, 6);

  /* ── 8 · rotor cup, stator, magnet ring ────────────────── */
  part(1.2, 0.18);
  addTube(1.20, 0.615, 0.510, 0.360, 1.0, 38, 1);
  addTube(1.20, 0.560, 0.505, 0.420, SHELL, 38);
  for (let i = 0; i < 8; i++)
    addBoxAt(1.30, i / 8 * TAU + 0.2, 0.567, 0.130, 0.022, 0.065, DARKM);

  part(1.66, 0.20);
  addTube(1.66, 0.670, 0.500, 0.310, SHELL, 38);
  addTeeth(1.66, 24, 0.525, 0.310, 0.058, 0.060, DARKM);        // stator slots
  addTube(1.495, 0.500, 0.430, 0.045, 0.50, 30);                // end windings
  addTube(1.825, 0.500, 0.430, 0.045, 0.50, 30);

  part(2.02, 0.19);
  addTube(2.02, 0.530, 0.430, 0.230, 1.0, 34, 1);
  for (let i = 0; i < 16; i++)
    addBoxAt(2.02, i / 16 * TAU, 0.532, 0.230, 0.012, 0.014, 0.30);
  part(2.26, 0.25);
  addTube(2.26, 0.310, 0.165, 0.170, ALLOY, 28);

  /* ── 9 · encoder board ─────────────────────────────────── */
  part(2.5, 0.31);
  addTube(2.50, 0.305, 0.072, 0.038, 0.66, 30);
  for (let i = 0; i < 5; i++) addBoxAt(2.50, i / 5 * TAU + 0.3, 0.215, 0.055, 0.055, 0.075, DARKM);
  addBoxAt(2.50, 3.5, 0.230, 0.075, 0.045, 0.140, DARKM);
  for (let i = 0; i < 4; i++)
    addPin(2.44, i / 4 * TAU + 0.8, 0.255, 0.026, 0.11, ALLOY, 6);
  addBoxAt(2.52, 1.9, 0.150, 0.050, 0.060, 0.060, DARKM * 1.5);
  addBoxAt(2.52, 5.1, 0.170, 0.050, 0.050, 0.090, DARKM * 1.5);
  addTube(2.455, 0.052, 0.00, 0.035, DARKM, 12);                // encoder magnet

  /* ── 10 · finned housing ───────────────────────────────── */
  part(2.95, 0.06);
  addTube(2.95, 0.790, 0.455, 0.560, SHELL, 40);
  for (let i = 0; i < 6; i++) addTube(2.72 + i * 0.075, 0.865, 0.780, 0.042, SHELL * 0.94, 40);
  addTube(3.18, 0.800, 0.460, 0.110, SHELL * 0.9, 40);
  for (let i = 0; i < 6; i++)
    addPin(3.19, i / 6 * TAU + 0.52, 0.720, 0.048, 0.13, DARKM * 0.8, 8);
  addBoxAt(2.98, 4.9, 0.700, 0.180, 0.120, 0.220, DARKM);       // connector recess

  /* ── 11 · driver board ─────────────────────────────────── */
  part(3.45, 0.4);
  addTube(3.45, 0.720, 0.175, 0.050, BOARD, 40);
  for (let i = 0; i < 3; i++) addPin(3.45, i / 3 * TAU + 0.4, 0.590, 0.070, 0.055, ALLOY, 10);
  const CHIPS = [
    [0.9, 0.30, 0.20, 0.16], [2.3, 0.42, 0.13, 0.11], [4.1, 0.40, 0.15, 0.13],
    [5.4, 0.34, 0.11, 0.10], [1.6, 0.52, 0.10, 0.09], [3.4, 0.50, 0.12, 0.10],
    [5.9, 0.52, 0.10, 0.09], [0.2, 0.46, 0.09, 0.08], [2.9, 0.24, 0.09, 0.08]
  ];
  for (const [a, r, w, h] of CHIPS) addBoxAt(3.48, a, r, 0.055, w, h, ALLOY * 0.9);
  addBoxAt(3.48, 0.55, 0.520, 0.075, 0.130, 0.230, DARKM);      // connector
  addBoxAt(3.48, 5.75, 0.520, 0.075, 0.130, 0.230, DARKM);
  for (const a of [1.35, 2.75, 4.55])                            // capacitors
    addPin(3.50, a, 0.335, 0.048, 0.095, ALLOY * 1.12, 8);
  addBoxAt(3.475, 3.85, 0.585, 0.050, 0.055, 0.180, DARKM * 1.4); // pin header
  for (let i = 0; i < 8; i++)                                    // solder pads
    addPin(3.475, i / 8 * TAU + 0.15, 0.665, 0.016, 0.03, ALLOY, 6);
  addTube(3.48, 0.115, 0.055, 0.075, ALLOY, 18);

  const VERTS = new Float32Array(V);
  const TONES = new Float32Array(TONE);
  const ACCS  = new Uint8Array(ACC);
  const PARTS = new Uint8Array(PART);
  const NTRI  = TONES.length;
  const NPART = HOME.length;

  /* ═══════════════════════════════════════════════════════════
     2 · LABELS — anchored along the stack
     ═══════════════════════════════════════════════════════════ */

  const MARKERS = [];

  /* ═══════════════════════════════════════════════════════════
     3 · SOFTWARE RASTERISER → HALFTONE GRID
     ═══════════════════════════════════════════════════════════ */

  const GX = 340, GY = 158;      // cells
  const SPREAD = 1.14;           // how far the stack flies apart
  const CAMZ = 30;
  const SC_SHUT = 56,  SC_OPEN = 38;
  const OFX_SHUT = 0,  OFX_OPEN = -11;
  const OFY_SHUT = 0,  OFY_OPEN = -10;
  const YAW_SHUT = 1.20, PIT_SHUT = 0.44, ROL_SHUT = 0.00;
  const YAW_OPEN = -0.34, PIT_OPEN = 0.19, ROL_OPEN = -0.18;
  let SC = SC_SHUT, OFFX = OFX_SHUT, OFFY = OFY_SHUT;
  let YAW = YAW_SHUT, PITCH = PIT_SHUT, ROLL = ROL_SHUT;

  const OFF = new Float32Array(NPART);
  function layoutParts(T) {
    for (let i = 0; i < NPART; i++) {
      const lag = (i / NPART) * 0.35;              // parts leave one after another
      const u = Math.max(0, Math.min(1, (T - lag) / 0.65));
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      OFF[i] = (HOME[i] - BUILT[i]) + e * (BUILT[i] * SPREAD - HOME[i]);
    }
    const Tc = Math.min(1, T / 0.65);
    const e = Tc < 0.5 ? 4 * Tc * Tc * Tc : 1 - Math.pow(-2 * Tc + 2, 3) / 2;
    SC    = SC_SHUT  + (SC_OPEN  - SC_SHUT)  * e;
    OFFX  = OFX_SHUT + (OFX_OPEN - OFX_SHUT) * e;
    OFFY  = OFY_SHUT + (OFY_OPEN - OFY_SHUT) * e;
    YAW   = YAW_SHUT + (YAW_OPEN - YAW_SHUT) * e;
    PITCH = PIT_SHUT + (PIT_OPEN - PIT_SHUT) * e;
    ROLL  = ROL_SHUT + (ROL_OPEN - ROL_SHUT) * e;
  }

  const host = document.getElementById("actuator");
  const cv = document.createElement("canvas");
  let ctx = null;              // 2d context, only when the GPU path is unavailable
  let GL = null;               // webgl context when available
  host.appendChild(cv);

  let CELL = 4, W = GX * CELL, H = GY * CELL, dpr = 1;

  function layout() {
    const box = host.parentElement;
    const bw = box ? box.getBoundingClientRect().width : 0;
    const avail = Math.min(bw > 160 ? bw : window.innerWidth - 32,
                           Math.min(window.innerWidth - 40, 1180));
    CELL = Math.max(2, Math.min(4, Math.floor(avail / GX) || 2));
    W = GX * CELL; H = GY * CELL;
    const disp = Math.max(160, Math.min(W, avail));   // shown size: never wider than the box
    const dh = Math.round(H * disp / W);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = disp + "px"; cv.style.height = dh + "px";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const depth = new Float32Array(GX * GY);
  const lum   = new Float32Array(GX * GY);
  const kind  = new Uint8Array(GX * GY);

  const px = new Float32Array(3), py = new Float32Array(3), pz = new Float32Array(3);
  const sxA = new Float32Array(3), syA = new Float32Array(3);

  const LN = Math.hypot(-0.42, 0.74, 0.62);
  const lx = -0.42 / LN, ly = 0.74 / LN, lz = 0.62 / LN;

  let cy_ = 1, sy_ = 0, cp = 1, sp = 0, cr = 1, sr = 0;
  function setView() {
    cy_ = Math.cos(YAW);   sy_ = Math.sin(YAW);
    cp  = Math.cos(PITCH); sp  = Math.sin(PITCH);
    cr  = Math.cos(ROLL);  sr  = Math.sin(ROLL);
  }

  function view(x, y, z) {
    // yaw about Y
    let X = x * cy_ + z * sy_, Z = -x * sy_ + z * cy_, Y = y;
    // pitch about X
    const Y2 = Y * cp - Z * sp; Z = Y * sp + Z * cp; Y = Y2;
    // roll about Z
    const X2 = X * cr - Y * sr; Y = X * sr + Y * cr; X = X2;
    return [X, Y, Z];
  }

  function render(spin) {
    depth.fill(-1e9); lum.fill(0); kind.fill(0);
    setView();
    const cs = Math.cos(spin), ss = Math.sin(spin);
    const hx = GX / 2, hy = GY / 2;

    for (let t = 0; t < NTRI; t++) {
      const o = t * 9;
      for (let k = 0; k < 3; k++) {
        const x = VERTS[o + k * 3] + OFF[PARTS[t]], y0 = VERTS[o + k * 3 + 1], z0 = VERTS[o + k * 3 + 2];
        const y = y0 * cs - z0 * ss, z = y0 * ss + z0 * cs;     // spin about its own axis
        const [X, Y, Z] = view(x, y, z);
        px[k] = X; py[k] = Y; pz[k] = Z;
        const w = CAMZ / (CAMZ - Z);
        sxA[k] = hx + OFFX + X * SC * w;
        syA[k] = hy + OFFY - Y * SC * w;
      }

      const ax = px[1] - px[0], ay = py[1] - py[0], az = pz[1] - pz[0];
      const bx = px[2] - px[0], by = py[2] - py[0], bz = pz[2] - pz[0];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }             // two-sided

      const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
      const rim = Math.pow(1 - nz, 2.6) * 0.24;
      const shade = Math.max(0, Math.min(1, TONES[t] * (0.20 + 0.86 * diff + rim)));

      const x0 = Math.max(0, Math.floor(Math.min(sxA[0], sxA[1], sxA[2])));
      const x1 = Math.min(GX - 1, Math.ceil(Math.max(sxA[0], sxA[1], sxA[2])));
      const y0b = Math.max(0, Math.floor(Math.min(syA[0], syA[1], syA[2])));
      const y1b = Math.min(GY - 1, Math.ceil(Math.max(syA[0], syA[1], syA[2])));
      if (x1 < x0 || y1b < y0b) continue;

      const d0 = sxA[1] - sxA[0], e0 = syA[1] - syA[0];
      const d1 = sxA[2] - sxA[0], e1 = syA[2] - syA[0];
      const den = d0 * e1 - d1 * e0;
      if (Math.abs(den) < 1e-9) continue;
      const inv = 1 / den, acc = ACCS[t];

      for (let yy = y0b; yy <= y1b; yy++) {
        const fy = yy + 0.5 - syA[0];
        for (let xx = x0; xx <= x1; xx++) {
          const fx = xx + 0.5 - sxA[0];
          const u = (fx * e1 - d1 * fy) * inv;
          if (u < 0 || u > 1) continue;
          const v = (d0 * fy - fx * e0) * inv;
          if (v < 0 || u + v > 1) continue;
          const zz = pz[0] + u * (pz[1] - pz[0]) + v * (pz[2] - pz[0]);
          const i = yy * GX + xx;
          if (zz <= depth[i]) continue;
          depth[i] = zz; lum[i] = shade; kind[i] = acc ? 2 : 1;
        }
      }
    }
  }

  /* ── theme tokens ─────────────────────────────────────── */

  /* in dark themes the ink is light, so square size must encode brightness,
     not darkness — detect which way the theme points */
  let INVERT = false;
  function _luma(c) {
    let h = (c || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    const n = parseInt(h, 16);
    if (isNaN(n)) return 0;
    return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
  }
  const theme = {};
  function _rgb(c) {
    let h = (c || "").replace("#", "");
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    const n = parseInt(h, 16);
    if (isNaN(n)) return [0, 0, 0];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function readTheme() {
    const s = getComputedStyle(document.documentElement);
    for (const [k, n] of [["ground", "--ground"], ["ink", "--ink"], ["dot", "--dot"],
                          ["hair", "--hairline"], ["accent", "--accent"],
                          ["label", "--label"], ["sub", "--sub"]])
      theme[k] = s.getPropertyValue(n).trim() || theme[k] || "#000";
    INVERT = _luma(theme.ink) > _luma(theme.ground);
    theme.inkRGB = _rgb(theme.ink);
    theme.accentRGB = _rgb(theme.accent);
  }

  function paint(spin) {
    ctx.clearRect(0, 0, W, H);

    const maxSq = CELL;
    const dots = new Path2D(), body = new Path2D(), accent = new Path2D();
    const dotOff = (CELL - 1) / 2;
    const STEP = CELL >= 4 ? 2 : 3;

    for (let yy = 0; yy < GY; yy++) {
      for (let xx = 0; xx < GX; xx++) {
        const i = yy * GX + xx;
        const k = kind[i];
        if (k === 0) {
          if (xx % STEP === 0 && yy % STEP === 0)
            dots.rect(xx * CELL + dotOff, yy * CELL + dotOff, 1, 1);
          continue;
        }
        // an edge is a silhouette boundary OR a depth break between parts
        const d = depth[i];
        const brk = j => kind[j] === 0 || Math.abs(depth[j] - d) > 0.17;
        const edge = (xx === 0 || brk(i - 1)) || (xx === GX - 1 || brk(i + 1)) ||
                     (yy === 0 || brk(i - GX)) || (yy === GY - 1 || brk(i + GX));

        const dark = 0.15 + 0.80 * (INVERT ? lum[i] : 1 - lum[i]);
        let step = edge ? maxSq : Math.round(dark * maxSq);
        if (step <= 0) {
          if (xx % STEP === 0 && yy % STEP === 0)
            dots.rect(xx * CELL + dotOff, yy * CELL + dotOff, 1, 1);
          continue;
        }
        if (step > maxSq) step = maxSq;
        const off = (CELL - step) / 2;
        (k === 2 ? accent : body).rect(xx * CELL + off, yy * CELL + off, step, step);
      }
    }

    ctx.fillStyle = theme.ink;    ctx.fill(body);
    ctx.fillStyle = theme.accent; ctx.fill(accent);

    drawMarkers(spin);
  }

  /* ── frame: hairline rule with corner ticks ───────────── */
  function drawFrame() {
    const m = CELL * 2;
    ctx.strokeStyle = theme.hair;
    ctx.lineWidth = 1;
    ctx.strokeRect(m + 0.5, m + 0.5, W - 2 * m - 1, H - 2 * m - 1);
    const t = CELL * 3;
    ctx.beginPath();
    for (const [cx, cy, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1],
                                    [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
      ctx.moveTo(cx + 0.5, cy + sy * t + 0.5); ctx.lineTo(cx + 0.5, cy + 0.5);
      ctx.lineTo(cx + sx * t + 0.5, cy + 0.5);
    }
    ctx.strokeStyle = theme.ink;
    ctx.stroke();
  }

  /* ── labels ───────────────────────────────────────────── */
  function drawMarkers() {
    const hx = GX / 2, hy = GY / 2;
    const fs = Math.max(10, Math.round(CELL * 2.6));
    ctx.textBaseline = "alphabetic";

    for (const m of MARKERS) {
      const [X, Y, Z] = view(m.x + OFF[21], m.up * m.r, 0);
      const w = CAMZ / (CAMZ - Z);
      const cx = (hx + OFFX + X * SC * w) * CELL;
      const cy = (hy + OFFY - Y * SC * w) * CELL;

      const up = m.up > 0 ? -1 : 1;
      const rise = CELL * (m.lift || 7);
      let ey = cy + up * rise;
      ey = Math.max(fs * 2.4 + CELL * 3, Math.min(H - fs - CELL * 3, ey));

      ctx.font = `600 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
      const tw = Math.max(ctx.measureText(m.a).width, ctx.measureText(m.b).width);
      const tx = Math.max(CELL * 3, Math.min(W - tw - CELL * 3, cx - tw / 2));

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(cx) + 0.5, Math.round(cy) + 0.5);
      ctx.lineTo(Math.round(cx) + 0.5, Math.round(ey) + 0.5);
      ctx.stroke();

      const s = Math.max(4, CELL);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(Math.round(cx - s / 2), Math.round(cy - s / 2), s, s);

      ctx.textAlign = "left";
      const baseA = m.up > 0 ? Math.round(ey) - fs - 5 : Math.round(ey) + fs + 4;
      const baseB = baseA + fs + 3;

      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = theme.ground;

      if ("letterSpacing" in ctx) ctx.letterSpacing = "0.06em";
      ctx.font = `600 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.strokeText(m.a, tx, baseA);
      ctx.fillStyle = theme.label; ctx.fillText(m.a, tx, baseA);

      if ("letterSpacing" in ctx) ctx.letterSpacing = "0em";
      ctx.font = `400 ${fs}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.strokeText(m.b, tx, baseB);
      ctx.fillStyle = theme.sub; ctx.fillText(m.b, tx, baseB);
    }
  }

  function drawHint() {
    const fs = Math.max(9, Math.round(CELL * 2.3));
    const m = CELL * 2 + CELL * 3;
    const y = H - m;
    const sq = Math.max(4, CELL);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(m, Math.round(y - fs * 0.75), sq, sq);
    ctx.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════════════════
     3.5 · GPU RENDERER — same picture, drawn by the GPU
     pass 1: rasterise the mesh into the GX×GY halftone grid
     pass 2: expand each grid cell into its dither square
     ═══════════════════════════════════════════════════════════ */

  const G = {};   // gl objects

  function _sh(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  }
  function _prog(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, _sh(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, _sh(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(p) || "link");
    return p;
  }

  const FS_PRE = "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n" +
                 "#else\nprecision mediump float;\n#endif\n";

  const VS1 = [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "attribute vec3 aTAP;",                    // tone, accent, part
    "uniform mat3 uView;",
    "uniform vec2 uSpin;",                     // cos, sin
    "uniform float uOff[24];",
    "uniform vec3 uL;",
    "uniform vec2 uGrid;",
    "uniform float uSC;",
    "uniform vec2 uOffXY;",
    "uniform float uCamZ;",
    "varying float vShade;",
    "varying float vKind;",
    "varying float vZ;",
    "void main() {",
    "  float x = aPos.x + uOff[int(aTAP.z + 0.5)];",
    "  vec3 p = vec3(x, aPos.y * uSpin.x - aPos.z * uSpin.y,",
    "                   aPos.y * uSpin.y + aPos.z * uSpin.x);",
    "  p = uView * p;",
    "  vec3 n = vec3(aNrm.x, aNrm.y * uSpin.x - aNrm.z * uSpin.y,",
    "                        aNrm.y * uSpin.y + aNrm.z * uSpin.x);",
    "  n = uView * n;",
    "  if (n.z < 0.0) n = -n;",                // two-sided, like the CPU path
    "  float diff = max(0.0, dot(n, uL));",
    "  float rim = pow(1.0 - n.z, 2.6) * 0.24;",
    "  vShade = clamp(aTAP.x * (0.20 + 0.86 * diff + rim), 0.0, 1.0);",
    "  vKind = aTAP.y > 0.5 ? 1.0 : 0.5;",
    "  vZ = p.z;",
    "  float w = uCamZ / (uCamZ - p.z);",
    "  float sx = uGrid.x * 0.5 + uOffXY.x + p.x * uSC * w;",
    "  float sy = uGrid.y * 0.5 + uOffXY.y - p.y * uSC * w;",
    "  gl_Position = vec4(sx / uGrid.x * 2.0 - 1.0, 1.0 - sy / uGrid.y * 2.0,",
    "                     -p.z * 0.08, 1.0);",
    "}"].join("\n");

  const FS1 = FS_PRE + [
    "varying float vShade;",
    "varying float vKind;",
    "varying float vZ;",
    "void main() {",
    "  float dn = clamp((vZ + 8.0) / 16.0, 0.0, 1.0);",
    "  float hi = floor(dn * 255.0) / 255.0;",
    "  float lo = fract(dn * 255.0);",
    "  gl_FragColor = vec4(vShade, vKind, hi, lo);",
    "}"].join("\n");

  const VS2 = [
    "attribute vec2 aXY;",
    "void main() { gl_Position = vec4(aXY, 0.0, 1.0); }"].join("\n");

  const FS2 = FS_PRE + [
    "uniform sampler2D uTex;",
    "uniform vec2 uGrid;",
    "uniform float uCellPx;",                  // CELL * dpr, physical px per cell
    "uniform float uCell;",                    // CELL, logical px
    "uniform float uDpr;",
    "uniform vec3 uInk;",
    "uniform vec3 uAccent;",
    "uniform float uInvert;",
    "float dep(vec4 c) { return c.b + c.a / 255.0; }",
    "void main() {",
    "  vec2 cell = floor(gl_FragCoord.xy / uCellPx);",
    "  vec2 uv = (cell + 0.5) / uGrid;",
    "  vec4 c = texture2D(uTex, uv);",
    "  if (c.g < 0.25) { gl_FragColor = vec4(0.0); return; }",
    "  float d = dep(c);",
    "  bool edge = (cell.x < 0.5) || (cell.x > uGrid.x - 1.5) ||",
    "              (cell.y < 0.5) || (cell.y > uGrid.y - 1.5);",
    "  if (!edge) {",
    "    vec2 st = 1.0 / uGrid;",
    "    vec4 n1 = texture2D(uTex, uv + vec2(st.x, 0.0));",
    "    vec4 n2 = texture2D(uTex, uv - vec2(st.x, 0.0));",
    "    vec4 n3 = texture2D(uTex, uv + vec2(0.0, st.y));",
    "    vec4 n4 = texture2D(uTex, uv - vec2(0.0, st.y));",
    "    float th = 0.010625;",                // 0.17 in view units / 16
    "    edge = (n1.g < 0.25 || abs(dep(n1) - d) > th)",
    "        || (n2.g < 0.25 || abs(dep(n2) - d) > th)",
    "        || (n3.g < 0.25 || abs(dep(n3) - d) > th)",
    "        || (n4.g < 0.25 || abs(dep(n4) - d) > th);",
    "  }",
    "  float dark = 0.15 + 0.80 * (uInvert > 0.5 ? c.r : 1.0 - c.r);",
    "  float stp = edge ? uCell : floor(dark * uCell + 0.5);",
    "  if (stp < 0.5) { gl_FragColor = vec4(0.0); return; }",
    "  stp = min(stp, uCell);",
    "  float off = (uCell - stp) * 0.5 * uDpr;",
    "  float s = stp * uDpr;",
    "  vec2 local = gl_FragCoord.xy - cell * uCellPx;",
    "  if (local.x >= off && local.x < off + s && local.y >= off && local.y < off + s) {",
    "    vec3 col = c.g > 0.75 ? uAccent : uInk;",
    "    gl_FragColor = vec4(col, 1.0);",
    "  } else {",
    "    gl_FragColor = vec4(0.0);",
    "  }",
    "}"].join("\n");

  function initGL() {
    let gl;
    try {
      const attrs = { alpha: true, antialias: false, depth: false, premultipliedAlpha: true };
      gl = cv.getContext("webgl", attrs) || cv.getContext("experimental-webgl", attrs);
    } catch (_) { gl = null; }
    if (!gl) return false;
    try {
      /* interleaved vertex data: pos(3) normal(3) tone acc part */
      const STRIDE = 9;
      const data = new Float32Array(NTRI * 3 * STRIDE);
      for (let t = 0; t < NTRI; t++) {
        const o = t * 9;
        const ax = VERTS[o],     ay = VERTS[o + 1], az = VERTS[o + 2];
        const bx = VERTS[o + 3], by = VERTS[o + 4], bz = VERTS[o + 5];
        const cx = VERTS[o + 6], cy2 = VERTS[o + 7], cz2 = VERTS[o + 8];
        let nx = (by - ay) * (cz2 - az) - (bz - az) * (cy2 - ay);
        let ny = (bz - az) * (cx - ax) - (bx - ax) * (cz2 - az);
        let nz = (bx - ax) * (cy2 - ay) - (by - ay) * (cx - ax);
        const nl = Math.hypot(nx, ny, nz) || 1;
        nx /= nl; ny /= nl; nz /= nl;
        for (let k = 0; k < 3; k++) {
          const b = (t * 3 + k) * STRIDE;
          data[b]     = VERTS[o + k * 3];
          data[b + 1] = VERTS[o + k * 3 + 1];
          data[b + 2] = VERTS[o + k * 3 + 2];
          data[b + 3] = nx; data[b + 4] = ny; data[b + 5] = nz;
          data[b + 6] = TONES[t]; data[b + 7] = ACCS[t]; data[b + 8] = PARTS[t];
        }
      }
      const p1 = _prog(gl, VS1, FS1);
      const p2 = _prog(gl, VS2, FS2);

      const vbo = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      /* grid target: GX × GY */
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GX, GY, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const rbo = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, GX, GY);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new Error("fbo");
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      const u = n => gl.getUniformLocation(p1, n);
      const u2 = n => gl.getUniformLocation(p2, n);
      G.gl = gl; G.p1 = p1; G.p2 = p2; G.vbo = vbo; G.quad = quad;
      G.tex = tex; G.fbo = fbo; G.n = NTRI * 3;
      G.a1 = { pos: gl.getAttribLocation(p1, "aPos"),
               nrm: gl.getAttribLocation(p1, "aNrm"),
               tap: gl.getAttribLocation(p1, "aTAP") };
      G.a2 = { xy: gl.getAttribLocation(p2, "aXY") };
      G.u1 = { view: u("uView"), spin: u("uSpin"), off: u("uOff[0]"), L: u("uL"),
               grid: u("uGrid"), sc: u("uSC"), oxy: u("uOffXY"), camz: u("uCamZ") };
      G.u2 = { tex: u2("uTex"), grid: u2("uGrid"), cellpx: u2("uCellPx"),
               cell: u2("uCell"), dpr: u2("uDpr"), ink: u2("uInk"),
               accent: u2("uAccent"), invert: u2("uInvert") };
      G.mat = new Float32Array(9);

      gl.useProgram(p1);
      gl.uniform3f(G.u1.L, lx, ly, lz);
      gl.uniform2f(G.u1.grid, GX, GY);
      gl.uniform1f(G.u1.camz, CAMZ);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      GL = gl;
      return true;
    } catch (_) {
      GL = null;
      return false;
    }
  }

  function renderGL(spn) {
    const gl = GL;
    setView();
    /* M = Rz(roll) · Rx(pitch) · Ry(yaw), column-major */
    const m = G.mat;
    m[0] = cr * cy_ - sr * sp * sy_;  m[1] = sr * cy_ + cr * sp * sy_;  m[2] = -cp * sy_;
    m[3] = -sr * cp;                  m[4] = cr * cp;                   m[5] = sp;
    m[6] = cr * sy_ + sr * sp * cy_;  m[7] = sr * sy_ - cr * sp * cy_;  m[8] = cp * cy_;

    /* pass 1 — mesh → grid */
    gl.bindFramebuffer(gl.FRAMEBUFFER, G.fbo);
    gl.viewport(0, 0, GX, GY);
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(G.p1);
    gl.uniformMatrix3fv(G.u1.view, false, m);
    gl.uniform2f(G.u1.spin, Math.cos(spn), Math.sin(spn));
    gl.uniform1fv(G.u1.off, OFF);
    gl.uniform1f(G.u1.sc, SC);
    gl.uniform2f(G.u1.oxy, OFFX, OFFY);
    gl.bindBuffer(gl.ARRAY_BUFFER, G.vbo);
    gl.enableVertexAttribArray(G.a1.pos);
    gl.enableVertexAttribArray(G.a1.nrm);
    gl.enableVertexAttribArray(G.a1.tap);
    gl.vertexAttribPointer(G.a1.pos, 3, gl.FLOAT, false, 36, 0);
    gl.vertexAttribPointer(G.a1.nrm, 3, gl.FLOAT, false, 36, 12);
    gl.vertexAttribPointer(G.a1.tap, 3, gl.FLOAT, false, 36, 24);
    gl.drawArrays(gl.TRIANGLES, 0, G.n);

    /* pass 2 — grid → dither squares */
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cv.width, cv.height);
    gl.disable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(G.p2);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, G.tex);
    gl.uniform1i(G.u2.tex, 0);
    gl.uniform2f(G.u2.grid, GX, GY);
    gl.uniform1f(G.u2.cellpx, cv.width / GX);
    gl.uniform1f(G.u2.cell, CELL);
    gl.uniform1f(G.u2.dpr, cv.width / GX / CELL);
    const ik = theme.inkRGB || [0.9, 0.9, 0.95], ac = theme.accentRGB || [0.55, 0.4, 1];
    gl.uniform3f(G.u2.ink, ik[0], ik[1], ik[2]);
    gl.uniform3f(G.u2.accent, ac[0], ac[1], ac[2]);
    gl.uniform1f(G.u2.invert, INVERT ? 1 : 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, G.quad);
    gl.enableVertexAttribArray(G.a2.xy);
    gl.vertexAttribPointer(G.a2.xy, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ═══════════════════════════════════════════════════════════
     4 · LOOP + INTERACTION
     ═══════════════════════════════════════════════════════════ */

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let spin = 0.3, velocity = 0, drag = null, last = 0, visible = true;
  const RATE = 0.42;                       // rad/s ≈ 15 s per revolution

  let OPEN = 0, target = 0, autoOpened = false, bornAt = 0;
  const OPEN_TIME = 1.35;                  // seconds for the transition
  let manual = null, greeted = false, born = 0;
  const toggle = () => { target = target > 0.5 ? 0 : 1; manual = target; };

  let lastDraw = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (visible) {
      const rb = host.getBoundingClientRect();
      const dc = Math.abs(rb.top + rb.height / 2 - innerHeight / 2) / innerHeight;
      if (!greeted) {                                  // opens on arrival even at page top
        if (!born) born = now;
        const onscreen = rb.bottom > 0 && rb.top < innerHeight;
        if (onscreen && now - born > 220) { greeted = true; manual = 1; }
        else if (!onscreen) greeted = true;
      }
      if (manual !== null && dc > 0.33) manual = null;   // scrolled away → scroll resumes
      if (manual !== null) target = manual;
      else if (dc < 0.20) target = 1;
      else if (dc > 0.33) target = 0;
      if (OPEN !== target) {
        const step = dt / OPEN_TIME;
        OPEN = target > OPEN ? Math.min(target, OPEN + step) : Math.max(target, OPEN - step);
      }
      layoutParts(OPEN);
      if (!drag) {
        if (Math.abs(velocity) > 0.002) { spin += velocity * dt; velocity *= Math.pow(0.05, dt); }
        else if (!reduce.matches) spin += RATE * dt;
      }
      const active = drag || Math.abs(velocity) > 0.002 || OPEN !== target;
      if (GL) {                                  // GPU path: every frame is cheap
        renderGL(spin);
        lastDraw = now;
      } else if (active || now - lastDraw >= 40) {
        render(spin);
        paint(spin);
        lastDraw = now;
      }
    }
    requestAnimationFrame(frame);
  }

  host.addEventListener("pointerdown", e => {
    drag = { x: e.clientX, a: spin, t: performance.now(), prev: e.clientX, moved: 0 };
    velocity = 0;
    try { host.setPointerCapture(e.pointerId); } catch (_) {}
  });
  host.addEventListener("pointermove", e => {
    if (!drag) return;
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
    spin = drag.a + (e.clientX - drag.x) / 120;
    const now = performance.now();
    if (now - drag.t > 16) {
      velocity = ((e.clientX - drag.prev) / 120) / ((now - drag.t) / 1000);
      drag.t = now; drag.prev = e.clientX;
    }
  });
  const endDrag = e => {
    if (!drag) return;
    if (drag.moved < 4) { toggle(); autoOpened = true; }
    drag = null;
    if (Math.abs(velocity) < 0.05) velocity = 0;
    try { host.releasePointerCapture(e.pointerId); } catch (_) {}
  };
  host.addEventListener("pointerup", endDrag);
  host.addEventListener("pointercancel", endDrag);
  host.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft")  { spin -= 0.2; e.preventDefault(); }
    if (e.key === "ArrowRight") { spin += 0.2; e.preventDefault(); }
    if (e.key === "Enter" || e.key === " ") { toggle(); autoOpened = true; e.preventDefault(); }
  });

  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(host);
  window.addEventListener("resize", layout);
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readTheme);
  new MutationObserver(readTheme).observe(document.documentElement,
    { attributes: true, attributeFilter: ["data-theme"] });

  readTheme();
  layoutParts(0);
  if (!initGL()) ctx = cv.getContext("2d");      // CPU fallback when WebGL is missing
  layout();
  const start = () => requestAnimationFrame(t => { last = t; frame(t); });
  layoutParts(OPEN);                              // pre-render: never blank on arrival
  if (GL) renderGL(spin); else { render(spin); paint(spin); }
  start();
});
(() => {
  const el = document.getElementById("actuator");
  if (!el) return;
  let done = false;
  const go = () => { if (!done) { done = true; __bootActuator(); } };
  if (!("IntersectionObserver" in window)) { go(); return; }
  const io = new IntersectionObserver(es => {
    if (es[0].isIntersecting) { io.disconnect(); go(); }
  }, { rootMargin: "900px 0px" });
  io.observe(el);
  const idle = () => { try { io.disconnect(); } catch (_) {} go(); };
  const r0 = el.getBoundingClientRect();
  if (r0.top < innerHeight && r0.bottom > 0) setTimeout(idle, 0);   // in view at load: build now
  else if ("requestIdleCallback" in window) requestIdleCallback(idle, { timeout: 2600 });
  else setTimeout(idle, 1300);
})();

