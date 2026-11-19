// ─────────────────────────────────────────────────────────────────────────
//  world.js — Digital Peak · Versione D "Peak Run"
//  Motore WebGL2 zero-dipendenze: oceano neon procedurale, tramonto sintetico,
//  architetture raymarched per zona, riflessi liquidi, bloom via mipmap,
//  god-rays, aberrazione cromatica e distorsione liquida del cursore.
// ─────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  const VERT = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

  // ───────────────────────── SCENE SHADER ─────────────────────────
  const SCENE = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos;
uniform vec3 uCamFwd;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTanHalf;

uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyHor;
uniform vec3 uSunA;
uniform vec3 uSunB;
uniform vec3 uNeonA;
uniform vec3 uNeonB;
uniform vec3 uWater;
uniform float uGrid;
uniform float uStream;
uniform float uClouds;

uniform vec4 uZoneA;
uniform vec4 uZoneB;
uniform vec3 uPeak;
uniform float uSteps;
uniform float uRefl;
uniform vec4 uClick;
uniform vec4 uHover;
uniform float uEncode;

#define PI 3.14159265
#define TAU 6.2831853
const vec3 SUN_DIR = vec3(0.0, 0.0599, 0.9982);
const float SUN_E = 0.06;

float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
             mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s;
}
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float pathX(float z){ return 18.0 * sin(z * 0.006) + 7.0 * sin(z * 0.017 + 1.3); }

float sdTorus(vec3 p, vec2 t){ vec2 q = vec2(length(p.xy) - t.x, p.z); return length(q) - t.y; }
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float sdCyl(vec3 p, float h, float r){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }

void addObj(inout vec3 res, float d, float id){ if (d < res.x){ res.x = d; res.y = id; } }
void addEmi(inout vec3 res, float d, float id){ addObj(res, d, id); res.z = min(res.z, d); }
void addBound(inout vec3 res, float outside){ res.x = min(res.x, outside + 1.0); }

// ── Architetture per zona ──
void zoneMap(vec3 p, vec4 zn, inout vec3 res){
  float type = zn.x;
  float zO = zn.y;
  float lz = p.z - zO;

  // Portale d'ingresso zona
  if (type > 0.5){
    float gz = zO - 50.0;
    vec3 q = p - vec3(pathX(gz), 7.4, gz);
    addEmi(res, sdTorus(q, vec2(7.5, 0.2)), 1.0);
    vec3 q2 = q; q2.xy *= rot(uTime * 0.25 + zO);
    float f = fract(atan(q2.y, q2.x) * 24.0 / TAU);
    addEmi(res, max(sdTorus(q2, vec2(8.7, 0.07)), (abs(f - 0.35) - 0.35) * 2.2), 3.0);
  }

  if (type < 0.5){
    // SHORELINE — monoliti sospesi
    vec3 q = p - vec3(pathX(zO + 70.0), 0.0, zO + 70.0);
    q.x = abs(q.x) - 24.0;
    q.y -= 15.0 + sin(uTime * 0.5) * 0.8;
    q.xz *= rot(uTime * 0.1);
    addObj(res, sdBox(q, vec3(2.2, 11.0, 2.2)), 2.0);
    vec3 qh = q - vec3(0.0, 14.5, 0.0);
    addEmi(res, sdTorus(qh.xzy, vec2(3.4, 0.08)), 3.0);
  } else if (type < 1.5){
    // SIGNAL TOWER
    vec3 q = p - vec3(pathX(zO + 80.0) + 20.0, 0.0, zO + 80.0);
    addObj(res, sdCyl(q - vec3(0.0, 30.0, 0.0), 30.0, 1.3), 2.0);
    vec3 qr = q; qr.y -= clamp(floor(qr.y / 9.0 + 0.5), 1.0, 6.0) * 9.0;
    addEmi(res, length(vec2(length(qr.xz) - 3.2, qr.y)) - 0.14, 3.0);
    addEmi(res, length(q - vec3(0.0, 62.0, 0.0)) - 1.8, 7.0);
    vec3 q3 = p - vec3(pathX(zO + 130.0) - 26.0, 0.0, zO + 130.0);
    addObj(res, sdCyl(q3 - vec3(0.0, 18.0, 0.0), 18.0, 0.9), 2.0);
    vec3 q4 = q3; q4.y -= clamp(floor(q4.y / 7.0 + 0.5), 1.0, 5.0) * 7.0;
    addEmi(res, length(vec2(length(q4.xz) - 2.3, q4.y)) - 0.1, 1.0);
    addEmi(res, length(q3 - vec3(0.0, 38.0, 0.0)) - 1.2, 7.0);
  } else if (type < 2.5){
    // LEAD ENGINE — imbuto di anelli
    float i = clamp(floor((lz - 20.0) / 18.0 + 0.5), 0.0, 6.0);
    float rz = zO + 20.0 + i * 18.0;
    vec3 q = p - vec3(pathX(rz), 6.8, rz);
    float R = 11.0 - i * 1.0;
    q.xy *= rot(uTime * 0.2 * (mod(i, 2.0) * 2.0 - 1.0));
    addEmi(res, sdTorus(q, vec2(R, 0.16)), 1.0);
    float f = fract(atan(q.y, q.x) * 16.0 / TAU);
    addEmi(res, max(sdTorus(q, vec2(R + 1.1, 0.06)), (abs(f - 0.3) - 0.3) * (R + 1.1) * 0.39), 3.0);
  } else if (type < 3.5){
    // B2B COMMERCE DISTRICT — torri sospese sull'acqua
    if (lz > -10.0 && lz < 150.0){
      float lx = p.x - pathX(p.z);
      float ax = abs(lx);
      float side = sign(lx);
      float cz = clamp(floor(lz / 18.0), 0.0, 7.0);
      for (int j = 0; j < 2; j++){
        float fj = float(j);
        float h1 = hash21(vec2(cz, fj + side * 7.0));
        float h2 = hash21(vec2(cz + 3.1, fj * 2.0 + side));
        float cx = 16.0 + fj * 13.0 + h2 * 3.0;
        float czz = cz * 18.0 + 9.0;
        float H = 10.0 + h1 * 36.0;
        float w = 3.0 + h2 * 2.0;
        float base = 2.5 + h2 * 2.0;
        vec3 lp = vec3(ax, p.y, lz);
        addObj(res, sdBox(lp - vec3(cx, base + H * 0.5, czz), vec3(w, H * 0.5, w * 0.8)), 4.0);
        vec3 qs = lp - vec3(cx, base * 0.5, czz);
        qs.xz = abs(qs.xz) - vec2(w * 0.6, w * 0.5);
        addObj(res, sdCyl(qs, base * 0.5, 0.18), 2.0);
        vec3 qt = lp - vec3(cx, base + H + 0.15, czz);
        float roof = max(sdBox(qt, vec3(w + 0.05, 0.08, w * 0.8 + 0.05)), -sdBox(qt, vec3(w - 0.15, 1.0, w * 0.8 - 0.15)));
        addEmi(res, roof, 3.0);
      }
    } else {
      addBound(res, lz < -10.0 ? -10.0 - lz : lz - 150.0);
    }
  } else if (type < 4.5){
    // AI HARBOR — nucleo neurale con orbite
    vec3 c = vec3(pathX(zO + 120.0), 25.0 + sin(uTime * 0.6), zO + 120.0);
    vec3 q = p - c;
    addObj(res, length(q) - 12.0, 5.0);
    vec3 q1 = q; q1.yz *= rot(1.2); q1.xy *= rot(uTime * 0.3);
    addEmi(res, sdTorus(q1, vec2(18.0, 0.12)), 1.0);
    vec3 q2 = q; q2.xz *= rot(0.7); q2.yz *= rot(-0.5 + uTime * 0.2);
    addEmi(res, sdTorus(q2, vec2(21.5, 0.09)), 3.0);
    vec3 q3 = q; q3.xy *= rot(2.1); q3.yz *= rot(-uTime * 0.25);
    addEmi(res, sdTorus(q3, vec2(25.0, 0.07)), 1.0);
    if (lz > 8.0 && lz < 112.0){
      float lx = p.x - pathX(p.z);
      vec3 qd = vec3(abs(lx) - 9.0, p.y - 0.7, lz - 60.0);
      addObj(res, sdBox(qd, vec3(1.0, 0.25, 48.0)), 2.0);
      vec3 ql = qd; ql.z -= clamp(floor(ql.z / 10.0 + 0.5), -4.0, 4.0) * 10.0;
      addObj(res, sdCyl(ql - vec3(0.0, 1.8, 0.0), 1.8, 0.08), 2.0);
      addEmi(res, length(ql - vec3(0.0, 3.8, 0.0)) - 0.3, 7.0);
    } else {
      addBound(res, min(abs(lz - 8.0), abs(lz - 112.0)));
    }
  } else if (type < 5.5){
    // CODE FOUNDRY — blocchi di codice in assemblaggio
    if (lz > 10.0 && lz < 150.0){
      float lx = p.x - pathX(p.z);
      vec3 b = vec3(abs(lx) - 13.0, p.y - 2.0, lz - 14.0);
      vec3 id = clamp(floor(b / 7.0), vec3(0.0), vec3(3.0, 3.0, 18.0));
      vec3 cp = b - (id + 0.5) * 7.0;
      float h = hash21(id.xz + id.y * 13.1 + sign(lx) * 5.0);
      cp.y -= sin(uTime * 0.8 + h * TAU) * 0.8;
      cp.xz *= rot(uTime * (h - 0.5) * 0.8 + h * 3.0);
      cp.xy *= rot(h * 1.3);
      float s = 0.9 + h * 0.9;
      addObj(res, sdBox(cp, vec3(s)) - 0.05, 6.0 + step(0.72, h) * 0.5);
    } else {
      addBound(res, lz < 10.0 ? 10.0 - lz : lz - 150.0);
    }
  } else if (type < 6.5){
    // THE RUN — pista con piloni e archi
    if (lz > -5.0 && lz < 810.0){
      float lx = p.x - pathX(p.z);
      vec3 q = vec3(abs(lx) - 11.0, p.y, lz);
      q.z -= clamp(floor(q.z / 16.0 + 0.5), 0.0, 50.0) * 16.0;
      addObj(res, sdCyl(q - vec3(0.0, 3.5, 0.0), 3.5, 0.1), 2.0);
      addEmi(res, length(q - vec3(0.0, 7.4, 0.0)) - 0.32, 7.0);
      float ai = clamp(floor(lz / 120.0 + 0.5), 1.0, 6.0);
      float az = zO + ai * 120.0;
      addEmi(res, sdTorus(p - vec3(pathX(az), 0.0, az), vec2(11.0, 0.18)), 1.0);
    } else {
      addBound(res, lz < -5.0 ? -5.0 - lz : lz - 810.0);
    }
  } else {
    // THE PEAK — alone finale e piattaforma
    vec3 c = vec3(pathX(zO + 230.0), 34.0, zO + 230.0);
    vec3 q = p - c;
    addEmi(res, sdTorus(q, vec2(26.0, 0.45)), 1.0);
    vec3 q2 = q; q2.xy *= rot(uTime * 0.1);
    float f = fract(atan(q2.y, q2.x) * 40.0 / TAU);
    addEmi(res, max(sdTorus(q2, vec2(28.5, 0.12)), (abs(f - 0.3) - 0.3) * 4.4), 3.0);
    vec3 qp = p - vec3(pathX(zO + 80.0), 9.0, zO + 80.0);
    addObj(res, sdCyl(qp, 0.5, 15.0), 2.0);
    addEmi(res, length(vec2(length(qp.xz) - 15.0, qp.y - 0.55)) - 0.12, 1.0);
  }
}

vec3 map(vec3 p){
  vec3 res = vec3(1e5, -1.0, 1e5);
  if (uZoneA.z > 0.5) zoneMap(p, uZoneA, res);
  if (uZoneB.z > 0.5) zoneMap(p, uZoneB, res);
  return res;
}

vec2 march(vec3 ro, vec3 rd, float maxT, float steps, inout float glow){
  float t = 0.4;
  for (int i = 0; i < 128; i++){
    if (float(i) >= steps) break;
    vec3 p = ro + rd * t;
    vec3 r = map(p);
    glow += 0.012 / (1.0 + r.z * r.z * 1.5);
    if (r.x < 0.0025 * t) return vec2(t, r.y);
    t += r.x * 0.85;
    if (t > maxT) break;
    if (p.y > 75.0 && rd.y > 0.0) break;
  }
  return vec2(t, -1.0);
}

vec3 calcNormal(vec3 p){
  const vec2 e = vec2(1.0, -1.0) * 0.5773 * 0.012;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x +
                   e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}

// ── Cielo ──
vec3 horizonCol(vec3 rd){
  float sf = pow(max(dot(rd, SUN_DIR), 0.0), 3.0);
  return mix(uSkyHor * 0.85, uSunB * 0.9 + uSunA * 0.2, sf * 0.6);
}

vec3 skyLite(vec3 rd){
  float e = rd.y;
  vec3 col = mix(uSkyHor, uSkyMid, smoothstep(0.0, 0.2, e));
  col = mix(col, uSkyTop, smoothstep(0.18, 0.75, e));
  float sd = max(dot(rd, SUN_DIR), 0.0);
  col += uSunB * pow(sd, 8.0) * 0.6 + uSunA * pow(sd, 60.0) * 0.8;
  return col;
}

vec3 sky(vec3 rd){
  float e = asin(clamp(rd.y, -1.0, 1.0));
  float az = atan(rd.x, rd.z);
  vec3 col = mix(uSkyHor, uSkyMid, smoothstep(0.0, 0.2, e));
  col = mix(col, uSkyTop, smoothstep(0.18, 0.75, e));

  // stelle
  vec2 sg = vec2(az, e) * 110.0;
  vec2 sid = floor(sg);
  float sh = hash21(sid);
  float star = step(0.986, sh) * smoothstep(0.32, 0.0, length(fract(sg) - 0.5)) * (0.55 + 0.45 * sin(uTime * 2.0 + sh * 60.0));
  col += vec3(1.0, 0.9, 1.0) * star * smoothstep(0.12, 0.5, e) * 1.4;

  // alone solare
  float sd = max(dot(rd, SUN_DIR), 0.0);
  col += uSunB * pow(sd, 6.0) * 0.55 + uSunA * pow(sd, 48.0) * 0.6;
  col += uSkyHor * exp(-abs(e) * 38.0) * 0.35;

  // montagne lontane
  float mh = 0.008 + 0.042 * fbm(vec2(az * 4.5 + 11.0, 3.7)) * (0.55 + 0.45 * cos(az));
  // THE PEAK — la vetta, con parallasse reale
  vec2 toP = uPeak.xz - uCamPos.xz;
  float dist = max(length(toP), 1.0);
  float azP = atan(toP.x, toP.y);
  float dAz = mod(az - azP + PI, TAU) - PI;
  float top = atan(uPeak.y - uCamPos.y, dist);
  float halfW = atan(uPeak.y * 1.45, dist);
  float x = abs(dAz) / halfW;
  float hp = 0.0;
  if (x < 1.0){
    hp = top * pow(1.0 - x, 1.3) * (1.0 + 0.1 * (vnoise(vec2(dAz / halfW * 9.0, 2.0)) - 0.5))
       + top * 0.05 * (vnoise(vec2(dAz / halfW * 26.0, 5.0)) - 0.5) * (1.0 - x);
  }
  float mtn = max(mh, hp);

  // sole synthwave a strisce
  vec2 sp = vec2(az, e - SUN_E);
  float r = length(sp);
  const float R = 0.17;
  float aa = fwidth(r) * 1.5 + 0.0015;
  float disc = 1.0 - smoothstep(R - aa, R + aa, r);
  float band = fract(sp.y * 26.0 + uTime * 0.25);
  float th = clamp((0.03 - sp.y) / R, 0.0, 1.0) * 0.6;
  float stripes = sp.y < 0.03 ? smoothstep(th - 0.05, th + 0.05, band) : 1.0;
  vec3 sunCol = mix(uSunB, uSunA, smoothstep(-R, R * 0.9, sp.y)) * 2.6;
  if (e > mtn) col = mix(col, sunCol, disc * stripes);

  // nuvole a strati illuminate dal tramonto
  float cbandMask = smoothstep(0.025, 0.09, e) * smoothstep(0.45, 0.12, e);
  if (cbandMask > 0.0 && uClouds > 0.01){
    float c = fbm(vec2(az * 3.0 + uTime * 0.004, e * 22.0));
    float cl = smoothstep(0.5, 0.82, c) * cbandMask * uClouds;
    vec3 cc = mix(uSkyMid * 1.05, uSunB * 1.1 + uSunA * 0.35, pow(sd, 3.0));
    col = mix(col, cc, cl * 0.8);
  }

  // montagne
  if (e < mtn){
    float isPeak = step(mh, hp);
    vec3 mcol = mix(uSkyHor * 0.42, uSkyMid * 0.22, smoothstep(0.0, 0.06, e));
    mcol = mix(mcol, uSkyTop * 0.6 + uSkyMid * 0.15, isPeak * 0.7);
    if (isPeak > 0.5){
      float v = e / max(top, 0.0001);
      float lineCoord = v * 14.0 - uTime * 0.05;
      float lw = fwidth(lineCoord) * 1.2 + 0.001;
      float f = fract(lineCoord);
      float line = 1.0 - smoothstep(0.0, lw, min(f, 1.0 - f));
      mcol += uNeonA * line * 0.55 * smoothstep(0.0, 0.25, v);
      float side = smoothstep(-0.2, 0.2, dAz / halfW);
      mcol *= 0.75 + 0.35 * side;
      mcol += uSunA * pow(v, 6.0) * 0.5;
    }
    float ew = fwidth(e) * 2.0 + 0.0007;
    float rim = 1.0 - smoothstep(0.0, ew, mtn - e);
    mcol += mix(uNeonA, uSunA, isPeak * 0.4) * rim * 1.6;
    col = mcol;
  }

  // faro sulla vetta
  float bw = 1.8 / dist + 0.0016;
  float beam = exp(-pow(dAz / bw, 2.0)) * step(top, e) * exp(-(e - top) * 2.2);
  col += mix(uNeonB, vec3(1.0), 0.4) * beam * 1.6;
  float fr = length(vec2(dAz, e - top));
  float pulse = 0.75 + 0.25 * sin(uTime * 3.0);
  col += vec3(1.0, 0.95, 1.0) * (exp(-fr * 140.0) * 2.5 + exp(-fr * 30.0) * 0.35) * pulse;
  return col;
}

// ── Acqua ──
#define WAVE(dx, dz, a, k, s) { vec2 d = vec2(dx, dz); float ph = dot(d, p) * k + uTime * s; float aa = a * exp(-dist * k * 0.012); h += aa * sin(ph); g += aa * k * cos(ph) * d; }
vec3 waves(vec2 p, float dist){
  float h = 0.0; vec2 g = vec2(0.0);
  WAVE(0.0, 1.0, 0.45, 0.10, 1.2)
  WAVE(0.62, 0.78, 0.20, 0.23, 1.5)
  WAVE(-0.71, 0.70, 0.16, 0.29, 1.3)
  WAVE(0.95, 0.31, 0.07, 0.61, 2.2)
  WAVE(-0.28, 0.96, 0.05, 0.93, 2.7)
  WAVE(0.17, -0.98, 0.03, 1.55, 3.4)
  WAVE(-0.88, -0.47, 0.018, 2.4, 4.1)
  WAVE(0.5, 0.86, 0.012, 3.7, 5.0)
  return vec3(h, g);
}

vec3 emissiveOf(float id){
  if (id < 1.5) return uNeonA * 3.0;
  if (id < 2.5) return uNeonA * 0.12;
  if (id < 3.5) return uNeonB * 2.6;
  if (id < 4.5) return uSunA * 0.45 + uNeonA * 0.1;
  if (id < 5.5) return uNeonA * 0.7 + uNeonB * 0.3;
  if (id < 6.25) return uNeonA * 0.1;
  if (id < 6.75) return uNeonB * 1.8;
  return vec3(1.0, 0.85, 0.95) * 3.5;
}

vec3 shadeWater(vec3 p, vec3 rd, float dist){
  vec3 w = waves(p.xz, dist);
  vec2 g = w.yz;
  // onda d'urto al click
  if (uClick.w > 0.001){
    vec2 dv = p.xz - uClick.xy;
    float rr = length(dv) + 1e-3;
    float front = uClick.z * 9.0;
    float env = exp(-abs(rr - front) * 0.35) * exp(-uClick.z * 0.9) * uClick.w;
    g += (dv / rr) * cos((rr - front) * 1.6) * env * 1.2;
  }
  // scia liquida del cursore
  if (uHover.z > 0.001){
    vec2 dv = p.xz - uHover.xy;
    float rr = length(dv) + 1e-3;
    g += (dv / rr) * cos(rr * 2.2 - uTime * 7.0) * exp(-rr * 0.45) * uHover.z * 0.6;
  }
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 r = reflect(rd, n);
  r.y = abs(r.y);
  float ndv = max(dot(n, -rd), 0.0);
  float F = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);

  vec3 refl = sky(r);
  if (uRefl > 0.5 && dist < 320.0){
    float g2 = 0.0;
    vec2 h2 = march(p + vec3(0.0, 0.05, 0.0), r, 260.0, 44.0, g2);
    if (h2.y > 0.0) refl = mix(refl, emissiveOf(h2.y), exp(-h2.x * 0.006));
    refl += uNeonA * g2 * 0.9;
  }

  vec3 col = uWater * (0.5 + 0.5 * n.y) + uNeonA * 0.05 * smoothstep(0.25, 0.6, w.x);
  col = mix(col, refl, clamp(F * 1.25, 0.0, 1.0));
  float sd = max(dot(r, SUN_DIR), 0.0);
  col += uSunA * pow(sd, 700.0) * 7.0 + uSunB * pow(sd, 40.0) * 0.18;

  // griglia prospettica distorta dalle onde
  if (uGrid > 0.01){
    vec2 gp = p.xz / 7.0 + g * 0.9;
    vec2 fw = fwidth(gp) + 1e-4;
    vec2 a = abs(fract(gp - 0.5) - 0.5) / fw;
    float line = 1.0 - min(min(a.x, a.y), 1.0);
    float pkt = smoothstep(0.94, 1.0, fract(gp.y * 0.08 - uTime * 0.35 + floor(gp.x) * 0.37));
    vec3 gc = mix(uNeonA, uNeonB, step(a.y, a.x));
    col += gc * line * (1.3 + pkt * 3.0) * exp(-dist * 0.011) * uGrid;
  }
  // flusso luminoso sulla rotta
  if (uStream > 0.01){
    float ds = p.x - pathX(p.z);
    float st = exp(-ds * ds * 1.2);
    float dash = smoothstep(0.2, 1.0, sin(p.z * 0.22 - uTime * 9.0));
    col += mix(uNeonB, vec3(1.0), 0.35) * st * (0.35 + 0.9 * dash) * exp(-dist * 0.006) * uStream * 1.6;
  }
  col = mix(col, horizonCol(rd), 1.0 - exp(-dist * 0.0026));
  return col;
}

vec3 shadeObj(vec3 p, vec3 rd, float id, float t){
  vec3 n = calcNormal(p);
  float ndv = max(dot(n, -rd), 0.0);
  float fres = pow(1.0 - ndv, 3.0);
  vec3 refl = skyLite(reflect(rd, n));
  vec3 base = vec3(0.025, 0.02, 0.05);
  float sunL = max(dot(n, SUN_DIR), 0.0);
  vec3 col = base * (0.4 + 0.6 * max(n.y, 0.0)) + uSunB * sunL * 0.12 + refl * (0.04 + 0.5 * fres);
  col += uNeonA * max(-n.y, 0.0) * 0.1;

  if (id < 1.5){
    col = uNeonA * 3.2 + vec3(0.6) * fres;
  } else if (id < 2.5){
    float band = smoothstep(0.9, 1.0, fract(p.y * 0.18 - uTime * 0.15));
    col += uNeonB * band * 1.6 + uNeonA * fres * 0.6;
  } else if (id < 3.5){
    col = uNeonB * 3.0;
  } else if (id < 4.5){
    vec2 wuv = vec2(abs(n.x) > 0.5 ? p.z : p.x, p.y);
    vec2 wc = floor(wuv * vec2(0.9, 0.75));
    vec2 wf = fract(wuv * vec2(0.9, 0.75));
    float win = step(0.25, wf.x) * step(wf.x, 0.75) * step(0.3, wf.y) * step(wf.y, 0.8);
    float on = step(0.45, hash21(wc + floor(p.x * 0.05)));
    vec3 wcol = mix(uSunA, uNeonA, step(0.8, hash21(wc * 1.7)));
    col += wcol * win * on * 1.5 * step(abs(n.y), 0.5) + uNeonA * fres * 0.5;
  } else if (id < 5.5){
    vec3 gg = abs(fract(p * 0.28) - 0.5);
    float line = 1.0 - smoothstep(0.0, 0.045, min(min(gg.x, gg.y), gg.z));
    float pulse = 0.6 + 0.4 * sin(uTime * 2.0 + p.y * 0.3);
    col = base + refl * 0.3 * fres + uNeonA * line * 2.2 * pulse + uNeonB * fres * 1.5;
  } else if (id < 6.25){
    col += uNeonA * fres * 1.3;
  } else if (id < 6.75){
    col = uNeonB * 2.0 + uNeonA * fres;
  } else {
    col = vec3(1.0, 0.85, 0.95) * 4.0;
  }
  return mix(col, horizonCol(rd), 1.0 - exp(-t * 0.004));
}

void main(){
  vec2 uv = vUv * 2.0 - 1.0;
  float aspect = uRes.x / uRes.y;
  vec3 rd = normalize(uCamFwd + uv.x * aspect * uTanHalf * uCamRight + uv.y * uTanHalf * uCamUp);
  vec3 ro = uCamPos;
  float tWater = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float glow = 0.0;
  vec2 hit = march(ro, rd, min(tWater, 900.0), uSteps, glow);
  vec3 col;
  if (hit.y > 0.0) col = shadeObj(ro + rd * hit.x, rd, hit.y, hit.x);
  else if (rd.y < 0.0) col = shadeWater(ro + rd * tWater, rd, tWater);
  else col = sky(rd);
  col += uNeonA * glow * 0.9;
  col = max(col, 0.0);
  if (uEncode > 0.5) col = col / (1.0 + col);
  fragColor = vec4(col, 1.0);
}`;

  // ───────────────────────── POST SHADER ─────────────────────────
  const POST = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
uniform float uSpeed;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform float uBars;
uniform float uGlitch;
uniform float uFade;
uniform float uEncode;
uniform vec2 uSunUv;
uniform float uRays;
uniform vec4 uRipple;
uniform float uMaxLod;
uniform float uMotion;

float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 dec(vec3 c){ return uEncode > 0.5 ? c / max(1.0 - c, 0.004) : c; }
vec3 samp(vec2 uv){ return dec(texture(uScene, uv).rgb); }
vec3 sampL(vec2 uv, float l){ return dec(textureLod(uScene, uv, min(l, uMaxLod)).rgb); }
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;

  // distorsione liquida del cursore
  vec2 dm = uv - uMouse; dm.x *= aspect;
  float md = length(dm);
  float lens = exp(-md * md * 26.0) * uMotion;
  float mv = length(uMouseVel);
  uv -= uMouseVel * lens * 0.05;
  uv += (dm / (md + 1e-4)) * sin(md * 70.0 - uTime * 7.0) * lens * min(mv, 1.5) * 0.006;

  // onda d'urto schermo
  if (uRipple.w > 0.001){
    vec2 dr = uv - uRipple.xy; dr.x *= aspect;
    float rr = length(dr);
    float front = uRipple.z * 0.9;
    float env = exp(-abs(rr - front) * 18.0) * exp(-uRipple.z * 2.2) * uRipple.w * uMotion;
    uv += (dr / (rr + 1e-4)) * env * 0.02;
  }

  // glitch a fette
  if (uGlitch > 0.001){
    float row = floor(uv.y * 38.0);
    float h = hash(vec2(row, floor(uTime * 24.0)));
    if (h < uGlitch * 0.55) uv.x += (h - 0.27) * 0.09 * uGlitch;
  }

  vec2 c = uv - 0.5;
  float ca = (0.0012 + uSpeed * 0.007 + uGlitch * 0.01) * uMotion;
  vec3 col = vec3(samp(uv - c * ca).r, samp(uv).g, samp(uv + c * ca).b);

  // blur radiale da velocità
  if (uSpeed > 0.04 && uMotion > 0.5){
    vec3 acc = vec3(0.0);
    for (int i = 1; i <= 6; i++){ acc += samp(uv - c * (float(i) / 6.0) * uSpeed * 0.06); }
    col = mix(col, acc / 6.0, clamp(uSpeed * 0.75, 0.0, 0.8) * smoothstep(0.08, 0.45, length(c)));
  }

  // bloom da catena mipmap
  vec3 b = sampL(uv, 2.0) * 0.28 + sampL(uv, 3.0) * 0.28 + sampL(uv, 4.0) * 0.26 + sampL(uv, 5.0) * 0.24 + sampL(uv, 6.0) * 0.2;
  col += max(b - 0.42, 0.0) * 0.95;

  // raggi volumetrici dal sole
  if (uRays > 0.01){
    vec2 dir = (uSunUv - uv);
    vec3 rays = vec3(0.0);
    float wsum = 0.0;
    for (int i = 0; i < 10; i++){
      float f = float(i) / 10.0;
      vec3 s = sampL(uv + dir * f * 0.55, 2.5);
      float w = 1.0 - f;
      rays += max(s - 0.9, 0.0) * w;
      wsum += w;
    }
    col += rays / wsum * uRays * 1.4;
  }

  col = aces(col * 1.05);
  col += vec3(0.025, 0.0, 0.045) * (1.0 - col);
  col *= 1.0 - dot(c, c) * 0.7;
  col *= 0.975 + 0.025 * sin(vUv.y * uRes.y * 1.4);
  col += (hash(vUv * uRes + fract(uTime) * 91.0) - 0.5) * 0.045;
  col += uFlashCol * uFlash;
  float bh = uBars * 0.11;
  if (vUv.y < bh || vUv.y > 1.0 - bh) col = vec3(0.0);
  col *= uFade;
  fragColor = vec4(col, 1.0);
}`;

  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh);
      gl.deleteShader(sh);
      throw new Error('Shader compile error: ' + log);
    }
    return sh;
  }

  function program(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('Program link error: ' + gl.getProgramInfoLog(p));
    }
    const uniforms = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      uniforms[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u: uniforms };
  }

  class World {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.opts = Object.assign({ scale: 0.6, minScale: 0.32, maxScale: 0.85, steps: 96, reflections: true, adaptive: true, dprCap: 1.5 }, opts || {});
      this.scale = this.opts.scale;
      this.steps = this.opts.steps;
      this.refl = this.opts.reflections ? 1 : 0;
      this.ok = false;
      this.frameEma = 16;
      this.adaptTimer = 0;
      this.onLost = null;
    }

    init() {
      const gl = this.canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      if (!gl) return false;
      this.gl = gl;
      try {
        this.scene = program(gl, VERT, SCENE);
        this.post = program(gl, VERT, POST);
      } catch (err) {
        console.warn('[DP World]', err.message);
        return false;
      }
      this.vao = gl.createVertexArray();
      gl.bindVertexArray(this.vao);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      this.floatExt = !!gl.getExtension('EXT_color_buffer_float');
      this.encode = this.floatExt ? 0 : 1;

      this.canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.ok = false;
        if (this.onLost) this.onLost();
      });

      this.resize();
      this.ok = !!this.fb;
      return this.ok;
    }

    allocTarget(w, h) {
      const gl = this.gl;
      if (this.tex) gl.deleteTexture(this.tex);
      if (this.fb) gl.deleteFramebuffer(this.fb);
      const tryAlloc = (useFloat) => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        if (useFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        const okStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        if (!okStatus) { gl.deleteTexture(tex); gl.deleteFramebuffer(fb); return null; }
        return { tex, fb };
      };
      let t = this.floatExt ? tryAlloc(true) : null;
      if (!t) { this.floatExt = false; this.encode = 1; t = tryAlloc(false); }
      if (!t) { this.tex = null; this.fb = null; return; }
      this.tex = t.tex;
      this.fb = t.fb;
      this.tw = w;
      this.th = h;
      this.maxLod = Math.floor(Math.log2(Math.max(w, h)));
    }

    resize() {
      if (!this.gl) return;
      const dpr = Math.min(global.devicePixelRatio || 1, this.opts.dprCap);
      const cw = Math.max(1, Math.floor(this.canvas.clientWidth || global.innerWidth));
      const ch = Math.max(1, Math.floor(this.canvas.clientHeight || global.innerHeight));
      this.cssW = cw;
      this.cssH = ch;
      this.canvas.width = Math.floor(cw * dpr);
      this.canvas.height = Math.floor(ch * dpr);
      this.allocTarget(Math.max(64, Math.floor(cw * this.scale)), Math.max(36, Math.floor(ch * this.scale)));
    }

    adapt(dtMs) {
      if (!this.opts.adaptive) return;
      this.frameEma += (Math.min(dtMs, 100) - this.frameEma) * 0.06;
      this.adaptTimer += dtMs;
      if (this.adaptTimer < 1400) return;
      this.adaptTimer = 0;
      let changed = false;
      if (this.frameEma > 24 && this.scale > this.opts.minScale) {
        this.scale = Math.max(this.opts.minScale, this.scale - 0.08);
        changed = true;
        if (this.scale < 0.45) { this.steps = 64; this.refl = 0; }
      } else if (this.frameEma < 13 && this.scale < this.opts.maxScale) {
        this.scale = Math.min(this.opts.maxScale, this.scale + 0.05);
        changed = true;
        if (this.scale >= 0.45) { this.steps = this.opts.steps; this.refl = this.opts.reflections ? 1 : 0; }
      }
      if (changed) this.allocTarget(Math.max(64, Math.floor(this.cssW * this.scale)), Math.max(36, Math.floor(this.cssH * this.scale)));
    }

    render(s) {
      if (!this.ok) return;
      const gl = this.gl;
      const U = this.scene.u;
      gl.bindVertexArray(this.vao);

      // PASS 1 — scena a risoluzione adattiva
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, this.tw, this.th);
      gl.useProgram(this.scene.p);
      gl.uniform2f(U.uRes, this.tw, this.th);
      gl.uniform1f(U.uTime, s.time);
      gl.uniform3fv(U.uCamPos, s.cam.pos);
      gl.uniform3fv(U.uCamFwd, s.cam.fwd);
      gl.uniform3fv(U.uCamRight, s.cam.right);
      gl.uniform3fv(U.uCamUp, s.cam.up);
      gl.uniform1f(U.uTanHalf, s.cam.tanHalf);
      const P = s.palette;
      gl.uniform3fv(U.uSkyTop, P.skyTop);
      gl.uniform3fv(U.uSkyMid, P.skyMid);
      gl.uniform3fv(U.uSkyHor, P.skyHor);
      gl.uniform3fv(U.uSunA, P.sunA);
      gl.uniform3fv(U.uSunB, P.sunB);
      gl.uniform3fv(U.uNeonA, P.neonA);
      gl.uniform3fv(U.uNeonB, P.neonB);
      gl.uniform3fv(U.uWater, P.water);
      gl.uniform1f(U.uGrid, P.grid);
      gl.uniform1f(U.uStream, P.stream);
      gl.uniform1f(U.uClouds, P.clouds);
      gl.uniform4fv(U.uZoneA, s.zoneA);
      gl.uniform4fv(U.uZoneB, s.zoneB);
      gl.uniform3fv(U.uPeak, s.peak);
      gl.uniform1f(U.uSteps, this.steps);
      gl.uniform1f(U.uRefl, this.refl);
      gl.uniform4fv(U.uClick, s.click);
      gl.uniform4fv(U.uHover, s.hover);
      gl.uniform1f(U.uEncode, this.encode);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.generateMipmap(gl.TEXTURE_2D);

      // PASS 2 — post-produzione cinematografica
      const Q = this.post.u;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.useProgram(this.post.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(Q.uScene, 0);
      gl.uniform2f(Q.uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(Q.uTime, s.time);
      const f = s.post;
      gl.uniform2fv(Q.uMouse, f.mouse);
      gl.uniform2fv(Q.uMouseVel, f.mouseVel);
      gl.uniform1f(Q.uSpeed, f.speed);
      gl.uniform1f(Q.uFlash, f.flash);
      gl.uniform3fv(Q.uFlashCol, f.flashCol);
      gl.uniform1f(Q.uBars, f.bars);
      gl.uniform1f(Q.uGlitch, f.glitch);
      gl.uniform1f(Q.uFade, f.fade);
      gl.uniform1f(Q.uEncode, this.encode);
      gl.uniform2fv(Q.uSunUv, f.sunUv);
      gl.uniform1f(Q.uRays, f.rays);
      gl.uniform4fv(Q.uRipple, f.ripple);
      gl.uniform1f(Q.uMaxLod, this.maxLod);
      gl.uniform1f(Q.uMotion, f.motion);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  // ── Matematica condivisa con lo shader (deve restare identica) ──
  const PathMath = {
    pathX(z) { return 18 * Math.sin(z * 0.006) + 7 * Math.sin(z * 0.017 + 1.3); },
    pathDX(z) { return 18 * 0.006 * Math.cos(z * 0.006) + 7 * 0.017 * Math.cos(z * 0.017 + 1.3); },
    swell(x, z, t) {
      return 0.45 * Math.sin(z * 0.10 + t * 1.2) +
        0.20 * Math.sin((0.62 * x + 0.78 * z) * 0.23 + t * 1.5) +
        0.16 * Math.sin((-0.71 * x + 0.70 * z) * 0.29 + t * 1.3);
    }
  };

  global.DPWorld = { World, PathMath };
})(window);
