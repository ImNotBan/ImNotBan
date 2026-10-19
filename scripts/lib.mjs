// Shared design tokens and helpers for the profile's SVG assets.
// SVGs shown through <img> cannot load external files, so the DM Sans
// faces they use are inlined as base64.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const SANS = `'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;
export const MONO = `ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace`;

export const themes = {
  dark: {
    card: "#0a0a0a",
    border: "#262626",
    hair: "#1c1c1c",
    text: "#ededed",
    muted: "#a1a1a1",
    subtle: "#6b6b6b",
    faint: "#2a2a2a",
    accent: "#8b5cf6",
    accentSoft: "#a78bfa",
    chip: "#111111",
    chipText: "#d4d4d4",
    scale: ["#8b5cf6", "#e5e5e5", "#a3a3a3", "#737373", "#525252", "#3f3f3f", "#2b2b2b"],
  },
  light: {
    card: "#ffffff",
    border: "#e5e5e5",
    hair: "#efefef",
    text: "#0a0a0a",
    muted: "#525252",
    subtle: "#8a8a8a",
    faint: "#e4e4e4",
    accent: "#7c3aed",
    accentSoft: "#8b5cf6",
    chip: "#fafafa",
    chipText: "#262626",
    scale: ["#7c3aed", "#171717", "#525252", "#737373", "#a3a3a3", "#c7c7c7", "#e5e5e5"],
  },
};

const fontCache = {};
export function fontFace(weights) {
  return weights
    .map((w) => {
      fontCache[w] ??= readFileSync(
        new URL(`../assets/fonts/dm-sans-latin-${w}-normal.woff2`, import.meta.url),
      ).toString("base64");
      return `@font-face{font-family:"DM Sans";font-weight:${w};src:url(data:font/woff2;base64,${fontCache[w]}) format("woff2")}`;
    })
    .join("");
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function svg({ width, height, label, weights = [], css = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
<style>${fontFace(weights)}${css}</style>
${body}
</svg>
`;
}

export function card(t, width, height) {
  return `<rect x=".5" y=".5" width="${width - 1}" height="${height - 1}" rx="16" fill="${t.card}" stroke="${t.border}" />`;
}

// Rough advance widths, good enough to size pills around short labels.
export function textWidth(s, size, mono = false) {
  if (mono) return s.length * size * 0.6;
  let w = 0;
  for (const ch of s) w += /[il.,:;'|!]/.test(ch) ? 0.26 : /[mwMW]/.test(ch) ? 0.82 : /[A-Z]/.test(ch) ? 0.64 : /[+#]/.test(ch) ? 0.6 : 0.54;
  return w * size;
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
