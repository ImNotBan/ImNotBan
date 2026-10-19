// Shared design tokens and helpers for the profile's SVG assets.
// SVGs shown through <img> cannot load external files, so the fonts they
// use are inlined as base64.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const asset = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

export const SANS = `'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;
export const SERIF = `'Cormorant Garamond', Georgia, 'Times New Roman', serif`;
export const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

// One dark palette: the cards read as product surfaces in both GitHub themes.
export const c = {
  bg: "#09090b",
  panel: "#0f0f12",
  tile: "#141418",
  border: "#27272a",
  line: "#1f1f23",
  text: "#fafafa",
  text2: "#d4d4d8",
  muted: "#a1a1aa",
  subtle: "#71717a",
  violet: "#8b5cf6",
  violet2: "#a78bfa",
  violet3: "#c4b5fd",
};

const fonts = {
  "sans-400": ["DM Sans", 400, "normal", "dm-sans-latin-400-normal"],
  "sans-500": ["DM Sans", 500, "normal", "dm-sans-latin-500-normal"],
  "sans-600": ["DM Sans", 600, "normal", "dm-sans-latin-600-normal"],
  "serif-italic": ["Cormorant Garamond", 400, "italic", "cormorant-garamond-latin-400-italic"],
};
export function fontFace(keys) {
  return keys
    .map((k) => {
      const [family, weight, style, file] = fonts[k];
      const data = readFileSync(asset(`fonts/${file}.woff2`)).toString("base64");
      return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
    })
    .join("");
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function svg({ width, height, label, fonts = [], css = "", defs = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
<style>${fontFace(fonts)}${css}</style>
<defs>
<clipPath id="frame"><rect width="${width}" height="${height}" rx="20" /></clipPath>
<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.violet}" stop-opacity="0" /><stop offset=".5" stop-color="${c.violet3}" /><stop offset="1" stop-color="${c.violet}" stop-opacity="0" /></linearGradient>
${defs}
</defs>
<g clip-path="url(#frame)">
<rect width="${width}" height="${height}" fill="${c.bg}" />
${body}
<rect x="${width * 0.18}" y="0" width="${width * 0.64}" height="1" fill="url(#beam)" />
</g>
<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="19.5" fill="none" stroke="${c.border}" />
</svg>
`;
}

export function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

// Deterministic PRNG so regenerated assets stay identical.
export function rng(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f1 = (n) => Math.round(n * 10) / 10;
