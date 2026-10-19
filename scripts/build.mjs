// Generates the static SVGs of the profile README: hero, tech stack and
// featured project.
//   node scripts/build.mjs
import { readFileSync } from "node:fs";
import { SANS, SERIF, MONO, c, svg, write, rng, asset, f1, esc } from "./lib.mjs";

// ---------- hero ----------
// A dotted globe centred on the western Mediterranean, lit from the upper
// right, with Barcelona marked.
function globe({ cx, cy, R, lat0, lon0 }) {
  const rad = Math.PI / 180;
  const t = lat0 * rad;
  const L = [0.45, 0.55, 0.7];
  const project = (lat, lon) => {
    const x = Math.cos(lat * rad) * Math.sin((lon - lon0) * rad);
    const y = Math.sin(lat * rad);
    const z = Math.cos(lat * rad) * Math.cos((lon - lon0) * rad);
    return [x, y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)];
  };
  const dots = [];
  for (let lat = -84; lat <= 84; lat += 6) {
    const n = Math.max(6, Math.round((360 * Math.cos(lat * rad)) / 6));
    for (let i = 0; i < n; i++) {
      const [x, y, z] = project(lat, (i * 360) / n);
      if (z <= 0.04) continue;
      const light = Math.max(0, x * L[0] + y * L[1] + z * L[2]);
      const o = 0.06 + 0.7 * light * z;
      dots.push(`<circle cx="${f1(cx + R * x)}" cy="${f1(cy - R * y)}" r="${f1(0.9 + 1.3 * z)}" fill-opacity="${o.toFixed(2)}" />`);
    }
  }
  const [bx, by] = project(41.39, 2.17);
  return { dots: dots.join(""), city: [cx + R * bx, cy - R * by] };
}

function hero() {
  const W = 800, H = 480;
  const g = { cx: 596, cy: 232, R: 200, lat0: 28, lon0: 18 };
  const { dots, city } = globe(g);
  const [bx, by] = city;
  const css = `
.k{font:500 22px ${MONO};fill:${c.violet2}}
.n{font:600 80px ${SANS};letter-spacing:-3.2px;fill:url(#name)}
.s{font:400 27px ${SANS};letter-spacing:-.4px;fill:${c.text2}}
.s2{font:400 27px ${SANS};letter-spacing:-.4px;fill:${c.muted}}
.cur{animation:blink 1.1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.ping{transform-box:fill-box;transform-origin:center;animation:ping 2.8s cubic-bezier(0,0,.2,1) infinite}
@keyframes ping{0%{transform:scale(.4);opacity:.9}100%{transform:scale(2.6);opacity:0}}`;
  const defs = `
<linearGradient id="name" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" /><stop offset="1" stop-color="#a1a1aa" /></linearGradient>
<radialGradient id="aurora" cx="640" cy="60" r="460" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.violet}" stop-opacity=".34" /><stop offset=".55" stop-color="${c.violet}" stop-opacity=".07" /><stop offset="1" stop-color="${c.violet}" stop-opacity="0" /></radialGradient>
<radialGradient id="atmo" cx="${g.cx}" cy="${g.cy}" r="${g.R * 1.22}" gradientUnits="userSpaceOnUse"><stop offset=".78" stop-color="${c.violet}" stop-opacity=".22" /><stop offset="1" stop-color="${c.violet}" stop-opacity="0" /></radialGradient>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity=".045" /></pattern>
<radialGradient id="gridfade" cx="200" cy="120" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" /><stop offset="1" stop-color="#000" /></radialGradient>
<mask id="gridmask"><rect width="${W}" height="${H}" fill="url(#gridfade)" /></mask>
<linearGradient id="leftfade" x1="0" y1="0" x2="1" y2="0"><stop offset=".5" stop-color="#000" /><stop offset=".64" stop-color="#fff" /></linearGradient>
<mask id="globemask"><rect width="${W}" height="${H}" fill="url(#leftfade)" /></mask>`;
  const body = `<rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridmask)" />
<rect width="${W}" height="${H}" fill="url(#aurora)" />
<g mask="url(#globemask)">
  <circle cx="${g.cx}" cy="${g.cy}" r="${g.R * 1.22}" fill="url(#atmo)" />
  <circle cx="${g.cx}" cy="${g.cy}" r="${g.R}" fill="${c.bg}" stroke="${c.violet}" stroke-opacity=".35" />
  <g fill="${c.violet3}">${dots}</g>
</g>
<circle class="ping" cx="${f1(bx)}" cy="${f1(by)}" r="8" fill="none" stroke="${c.violet2}" stroke-width="2" />
<circle cx="${f1(bx)}" cy="${f1(by)}" r="5" fill="#ffffff" stroke="${c.violet}" stroke-width="3" />
<text class="k" x="48" y="82">~/imnotban<tspan class="cur" fill="${c.violet2}">_</tspan></text>
<text class="n" x="44" y="176">Edmon</text>
<text class="n" x="44" y="258">Alcoceba</text>
<text class="n" x="44" y="340">Carbón</text>
<rect x="48" y="374" width="44" height="3" rx="1.5" fill="${c.violet}" />
<text class="s" x="48" y="418">Computer Engineering Student</text>
<text class="s2" x="48" y="452">Universitat de Lleida</text>`;
  return svg({ width: W, height: H, label: "Edmon Alcoceba Carbón — Computer Engineering Student · Universitat de Lleida", fonts: ["sans-400", "sans-600"], css, defs, body });
}

// ---------- tech stack ----------
const icon = (name) => readFileSync(asset(`icons/${name}.svg`), "utf8").match(/<path d="([^"]+)"/)[1];
// Simple Icons has no mark for assembly, so draw a small chip.
const chip = `<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9.5 2.5v3.5M14.5 2.5v3.5M9.5 18v3.5M14.5 18v3.5M2.5 9.5h3.5M2.5 14.5h3.5M18 9.5h3.5M18 14.5h3.5" /></g>`;

export const stack = [
  ["Languages", [["Java", "openjdk"], ["Python", "python"], ["C / C++", "cplusplus"], ["Assembly", null]]],
  ["Web", [["TypeScript", "typescript"], ["Next.js", "nextdotjs"], ["React", "react"], ["HTML / CSS", "html5"]]],
  ["Backend & tools", [["Flask", "flask"], ["Git", "git"], ["Bash", "gnubash"], ["Linux", "linux"]]],
];

function tech() {
  const W = 800, X = 40, gap = 16, colW = (W - 2 * X - 2 * gap) / 3, tileH = 60, tileGap = 12, top = 140;
  const H = top + 4 * tileH + 3 * tileGap + 40;
  const css = `
.k{font:500 22px ${MONO};fill:${c.violet2}}
.h{font:500 22px ${MONO};fill:${c.muted}}
.t{font:500 24px ${SANS};fill:${c.text2};letter-spacing:-.3px}`;
  let body = `<rect width="${W}" height="${H}" fill="url(#glow)" />
<text class="k" x="${X}" y="66">TECH STACK</text>`;
  stack.forEach(([group, items], col) => {
    const x = X + col * (colW + gap);
    body += `\n<text class="h" x="${x + 2}" y="114">${esc(group)}</text>`;
    items.forEach(([name, ic], row) => {
      const y = top + row * (tileH + tileGap);
      const glyph = ic ? `<path d="${icon(ic)}" fill="currentColor" />` : chip;
      const tint = row === 0 && col === 0 ? c.violet2 : c.muted;
      body += `
<rect x="${f1(x)}" y="${y}" width="${f1(colW)}" height="${tileH}" rx="12" fill="${c.tile}" stroke="${c.border}" />
<g transform="translate(${f1(x + 18)} ${y + 17}) scale(${f1(26 / 24 * 100) / 100})" color="${tint}" style="color:${tint}">${glyph}</g>
<text class="t" x="${f1(x + 60)}" y="${y + 38}">${esc(name)}</text>`;
    });
  });
  const defs = `<radialGradient id="glow" cx="${W}" cy="0" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.violet}" stop-opacity=".16" /><stop offset="1" stop-color="${c.violet}" stop-opacity="0" /></radialGradient>`;
  return svg({ width: W, height: H, label: `Tech stack. ${stack.map(([g, i]) => `${g}: ${i.map(([n]) => n).join(", ")}`).join(". ")}`, fonts: ["sans-500"], css, defs, body });
}

// ---------- featured project ----------
// Montserrat's conglomerate needles: rounded domes over shallow valleys,
// stacked in three layers that recede into a violet haze.
function ridge(rand, { x0, x1, base, env, wMin, wMax, depth }) {
  let x = x0, prev = env(x0) + depth, d = `M${x0} ${base}L${x0} ${f1(prev)}`;
  const tops = [];
  while (x < x1) {
    const w = wMin + rand() * (wMax - wMin);
    const top = env(x + w / 2) + (rand() - 0.5) * depth * 0.8;
    const v = top + depth * (0.35 + rand() * 0.65);
    d += `C${f1(x + 0.04 * w)} ${f1(top + 0.42 * (prev - top))} ${f1(x + 0.12 * w)} ${f1(top)} ${f1(x + 0.5 * w)} ${f1(top)}`;
    d += `C${f1(x + 0.88 * w)} ${f1(top)} ${f1(x + 0.96 * w)} ${f1(top + 0.42 * (v - top))} ${f1(x + w)} ${f1(v)}`;
    tops.push([x + w / 2, top]);
    x += w;
    prev = v;
  }
  return { d: d + `L${f1(x)} ${base}Z`, tops };
}

function project() {
  const W = 800, H = 560;
  const rand = rng(1236);
  const bump = (x, m, s, h) => h * Math.exp(-(((x - m) / s) ** 2));
  const back = ridge(rand, { x0: -20, x1: 820, base: H + 10, depth: 52, wMin: 16, wMax: 32,
    env: (x) => 530 - bump(x, 604, 120, 250) - bump(x, 470, 70, 80) - bump(x, 740, 70, 130) });
  const mid = ridge(rand, { x0: -20, x1: 820, base: H + 10, depth: 32, wMin: 24, wMax: 44,
    env: (x) => 548 - bump(x, 668, 110, 160) - bump(x, 520, 80, 70) });
  const front = ridge(rand, { x0: -20, x1: 820, base: H + 10, depth: 6, wMin: 150, wMax: 220,
    env: (x) => 546 - bump(x, 260, 260, 26) - bump(x, 760, 120, 30) });
  const [peakX, peakY] = back.tops.reduce((a, b) => (b[1] < a[1] ? b : a));
  const stars = Array.from({ length: 46 }, () => {
    const x = 300 + rand() * 490, y = 24 + rand() * 170;
    return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.6 + rand() * 1.1)}" fill-opacity="${(0.25 + rand() * 0.6).toFixed(2)}" />`;
  }).join("");
  const css = `
.k{font:500 22px ${MONO};fill:${c.violet2}}
.n{font:600 70px ${SANS};letter-spacing:-2.6px;fill:${c.text}}
.q{font:italic 400 36px ${SERIF};fill:${c.text2}}
.m{font:500 22px ${MONO};fill:${c.muted}}
.p{font:500 22px ${MONO};fill:${c.text2}}
.b{font:600 24px ${SANS};fill:#ffffff;letter-spacing:-.2px}
.tw{animation:tw 4s ease-in-out infinite}
@keyframes tw{50%{opacity:.35}}`;
  const defs = `
<radialGradient id="haze" cx="${f1(peakX)}" cy="${f1(peakY + 60)}" r="380" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${c.violet}" stop-opacity=".42" /><stop offset=".6" stop-color="${c.violet}" stop-opacity=".08" /><stop offset="1" stop-color="${c.violet}" stop-opacity="0" /></radialGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0a10" /><stop offset="1" stop-color="#140f24" /></linearGradient>
<linearGradient id="l1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f4d" /><stop offset=".6" stop-color="#151026" /></linearGradient>
<linearGradient id="l2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1430" /><stop offset=".6" stop-color="#0e0b18" /></linearGradient>
<linearGradient id="btn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b5cf6" /><stop offset="1" stop-color="#6d28d9" /></linearGradient>`;
  const body = `<rect width="${W}" height="${H}" fill="url(#sky)" />
<rect width="${W}" height="${H}" fill="url(#haze)" />
<g class="tw" fill="#ffffff">${stars}</g>
<path d="${back.d}" fill="url(#l1)" stroke="${c.violet2}" stroke-opacity=".28" />
<path d="${mid.d}" fill="url(#l2)" stroke="${c.violet2}" stroke-opacity=".5" />
<path d="${front.d}" fill="#08070c" stroke="${c.violet3}" stroke-opacity=".85" stroke-width="1.5" />
<circle cx="${f1(peakX)}" cy="${f1(peakY)}" r="4" fill="#ffffff" />
<path d="M${f1(peakX)} ${f1(peakY - 10)}V${f1(peakY - 60)}H612" fill="none" stroke="${c.text2}" stroke-opacity=".6" />
<text class="p" x="760" y="${f1(peakY - 92)}" text-anchor="end">Sant Jeroni</text>
<text class="m" x="760" y="${f1(peakY - 66)}" text-anchor="end">1236 m</text>
<text class="k" x="48" y="78">FEATURED PROJECT</text>
<text class="n" x="44" y="160">Montserrat Viva</text>
<text class="q" x="48" y="212">Una muntanya. Centenars d’espècies.</text>
<text class="q" x="48" y="252">Un sol ecosistema.</text>
<text class="m" x="48" y="428">Next.js · React · TypeScript</text>
<rect x="48" y="462" width="390" height="56" rx="28" fill="url(#btn)" />
<rect x="48.5" y="462.5" width="389" height="55" rx="27.5" fill="none" stroke="#ffffff" stroke-opacity=".18" />
<text class="b" x="243" y="498" text-anchor="middle">montserrat-viva.vercel.app ↗</text>`;
  return svg({ width: W, height: H, label: "Featured project: Montserrat Viva — Una muntanya. Centenars d’espècies. Un sol ecosistema. montserrat-viva.vercel.app", fonts: ["sans-500", "sans-600", "serif-italic"], css, defs, body });
}

write(asset("hero.svg"), hero());
write(asset("stack.svg"), tech());
write(asset("project.svg"), project());
console.log("assets written");
