// Generates the static SVGs of the profile README (header, featured project
// and technology pills) in dark and light variants.
//   node scripts/build.mjs
import { fileURLToPath } from "node:url";
import { SANS, MONO, themes, svg, card, textWidth, write, rng, esc } from "./lib.mjs";

const out = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

// ---------- header ----------
function header(t) {
  const W = 800, H = 228;
  const css = `
.k{font:500 15px ${MONO};fill:${t.subtle};letter-spacing:.4px}
.n{font:600 58px ${SANS};fill:${t.text};letter-spacing:-1.9px}
.s{font:400 24px ${SANS};fill:${t.muted};letter-spacing:-.3px}
.c{font:400 13px ${MONO};fill:${t.subtle};letter-spacing:.3px}
.halo{transform-box:fill-box;transform-origin:center;animation:halo 4s ease-in-out infinite}
@keyframes halo{0%,100%{opacity:.08;transform:scale(1)}50%{opacity:.22;transform:scale(1.5)}}`;
  const body = `<defs>
  <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.faint}" /></pattern>
  <radialGradient id="fade" cx="760" cy="60" r="250" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" /><stop offset="1" stop-color="#000" /></radialGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#fade)" /></mask>
</defs>
<rect x="430" y="0" width="${W - 430}" height="${H - 12}" fill="url(#dots)" mask="url(#m)" />
<circle class="halo" cx="782" cy="44" r="9" fill="${t.accent}" />
<circle cx="782" cy="44" r="3.5" fill="${t.accent}" />
<text class="c" x="766" y="49" text-anchor="end">41.39°N 2.17°E</text>
<circle cx="4" cy="44" r="3" fill="${t.accent}" />
<text class="k" x="16" y="49">imnotban — Barcelona</text>
<text class="n" x="-2" y="120">Edmon Alcoceba Carbón</text>
<text class="s" x="1" y="162">Estudiante de Ingeniería Informática, 3.º curso</text>
<text class="s" x="1" y="194">Universitat de Lleida</text>
<rect x="0" y="${H - 1}" width="${W}" height="1" fill="${t.border}" />`;
  return svg({ width: W, height: H, label: "Edmon Alcoceba Carbón — Estudiante de Ingeniería Informática, 3.º curso, Universitat de Lleida", weights: [400, 600], css, body });
}

// ---------- featured project ----------
function smoothClosed(pts) {
  // Catmull-Rom through the points, as cubic Béziers.
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

function contours() {
  const rand = rng(1236);
  const waves = [2, 3, 5, 7].map((k) => ({ k, a: 0.05 + rand() * 0.07, p: rand() * Math.PI * 2 }));
  const levels = [];
  const L = 11;
  for (let l = 0; l < L; l++) {
    const f = 1 - l / L;
    const cx = 640 - l * 4, cy = 178 - l * 3.2;
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const th = (i / 72) * Math.PI * 2;
      let r = 1;
      for (const w of waves) r += w.a * f * Math.sin(w.k * th + w.p + l * 0.18);
      const R = 300 * f + 14;
      pts.push([cx + Math.cos(th) * R * r * 1.25, cy + Math.sin(th) * R * r * 0.8]);
    }
    levels.push(smoothClosed(pts));
  }
  return { levels, peak: [640 - (L - 1) * 4, 178 - (L - 1) * 3.2] };
}

function project(t) {
  const W = 800, H = 320;
  const { levels, peak } = contours();
  const css = `
.k{font:500 14px ${MONO};fill:${t.accent};letter-spacing:1.6px}
.n{font:600 48px ${SANS};fill:${t.text};letter-spacing:-1.5px}
.s{font:400 22px ${SANS};fill:${t.muted};letter-spacing:-.3px}
.m{font:400 15px ${MONO};fill:${t.subtle}}
.l{font:500 15px ${SANS};fill:${t.text}}
.a{font:500 18px ${SANS};fill:${t.accent}}
.c{font:400 13px ${MONO};fill:${t.muted};letter-spacing:.3px}`;
  const lines = levels
    .map((d, i) => `<path d="${d}" fill="none" stroke="${i === 7 ? t.accent : t.subtle}" stroke-opacity="${i === 7 ? 0.9 : 0.22 + i * 0.03}" stroke-width="1" />`)
    .join("\n  ");
  const [px, py] = peak;
  const body = `<defs>
  <clipPath id="cl"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="15.5" /></clipPath>
  <linearGradient id="fg" x1="0" y1="0" x2="1" y2="0"><stop offset=".44" stop-color="#000" /><stop offset=".66" stop-color="#fff" /></linearGradient>
  <mask id="m"><rect width="${W}" height="${H}" fill="url(#fg)" /></mask>
</defs>
${card(t, W, H)}
<g clip-path="url(#cl)" mask="url(#m)">
  ${lines}
</g>
<circle cx="${px}" cy="${py}" r="3.5" fill="${t.accent}" />
<path d="M${px - 6} ${py - 6} l-14 -14 h-10" fill="none" stroke="${t.muted}" stroke-width="1" />
<rect x="${px - 212}" y="${py - 33}" width="182" height="24" rx="6" fill="${t.card}" fill-opacity=".92" />
<text class="c" x="${px - 38}" y="${py - 16}" text-anchor="end">Sant Jeroni · 1.236 m</text>
<text class="k" x="40" y="60">DIVULGACIÓN CIENTÍFICA</text>
<text class="n" x="38" y="116">Montserrat Viva</text>
<text class="s" x="40" y="158">Una montaña. Cientos de especies.</text>
<text class="s" x="40" y="188">Un solo ecosistema.</text>
<rect x="40" y="218" width="320" height="1" fill="${t.border}" />
<text class="m" x="40" y="250">Next.js · React · TypeScript</text>
<text class="a" x="40" y="284">montserrat-viva.vercel.app ↗</text>`;
  return svg({ width: W, height: H, label: "Proyecto destacado: Montserrat Viva. Una montaña. Cientos de especies. Un solo ecosistema.", weights: [400, 500, 600], css, body });
}

// ---------- technology pills ----------
export const stack = [
  ["Lenguajes", ["Java", "Python", "C", "C++", "TypeScript", "Assembly"]],
  ["Web", ["Next.js", "React", "Flask", "HTML", "CSS"]],
  ["Herramientas", ["Git", "Bash", "Linux"]],
];
const SYS = `ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;
export const slug = (s) => s.toLowerCase().replace(/\+/g, "p").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function pill(t, name) {
  const H = 30, W = Math.round(textWidth(name, 13) + 28);
  return svg({
    width: W, height: H, label: name,
    body: `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.chip}" stroke="${t.border}" />
<text x="${W / 2}" y="19.5" text-anchor="middle" style="font:500 13px ${SYS};fill:${t.chipText}">${esc(name)}</text>`,
  });
}

function groupLabel(t, name) {
  const s = name.toUpperCase(), H = 30, W = 124;
  return svg({
    width: W, height: H, label: name,
    body: `<text x="0" y="19" style="font:500 11px ${MONO};fill:${t.subtle};letter-spacing:1.4px">${esc(s)}</text>`,
  });
}

for (const [mode, t] of Object.entries(themes)) {
  write(out(`header-${mode}.svg`), header(t));
  write(out(`project-${mode}.svg`), project(t));
  for (const [group, items] of stack) {
    write(out(`stack/${slug(group)}-${mode}.svg`), groupLabel(t, group));
    for (const name of items) write(out(`stack/${slug(name)}-${mode}.svg`), pill(t, name));
  }
}
console.log("assets written");
