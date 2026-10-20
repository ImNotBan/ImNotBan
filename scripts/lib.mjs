// Shared helpers for the profile's generated SVGs.
// SVGs shown through <img> cannot load external files, so the font they
// use is inlined as base64.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const asset = (name) => fileURLToPath(new URL(`../assets/${name}`, import.meta.url));

export const SANS = `'DM Sans', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif`;

// One palette per GitHub theme; the README picks the matching file with
// <picture>, so the SVGs keep a transparent background.
export const themes = {
  light: { text: "#1f2328", muted: "#59636e", track: "#d1d9e0", bars: ["#8250df", "#0969da", "#1a7f37", "#bf8700", "#d1d9e0"] },
  dark: { text: "#f0f6fc", muted: "#9198a1", track: "#3d444d", bars: ["#a371f7", "#4493f8", "#3fb950", "#d29922", "#3d444d"] },
};

const fonts = {
  "sans-400": ["DM Sans", 400, "dm-sans-latin-400-normal"],
  "sans-500": ["DM Sans", 500, "dm-sans-latin-500-normal"],
  "sans-600": ["DM Sans", 600, "dm-sans-latin-600-normal"],
};
function fontFace(keys) {
  return keys
    .map((k) => {
      const [family, weight, file] = fonts[k];
      const data = readFileSync(asset(`fonts/${file}.woff2`)).toString("base64");
      return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
    })
    .join("");
}

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export function svg({ width, height, label, fonts = [], css = "", body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">
<style>${fontFace(fonts)}${css}</style>
${body}
</svg>
`;
}

export function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

export const f1 = (n) => Math.round(n * 10) / 10;
