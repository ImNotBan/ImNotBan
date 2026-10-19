// Builds the language breakdown card from the public, non-fork repositories
// of the profile owner. Run daily by .github/workflows/stats.yml, which
// publishes the result to the `output` branch.
//   GITHUB_TOKEN=... node scripts/stats.mjs <out-dir>
import { SANS, MONO, themes, svg, card, esc, write } from "./lib.mjs";

const login = process.env.GITHUB_REPOSITORY_OWNER || "ImNotBan";
const outDir = process.argv[2] || "dist";
const query = `query($login: String!) {
  user(login: $login) {
    repositories(ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, first: 100) {
      totalCount
      nodes { languages(first: 20) { edges { size node { name } } } }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${process.env.GITHUB_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { login } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors ?? json));
const repos = json.data.user.repositories;

const totals = new Map();
for (const repo of repos.nodes)
  for (const { size, node } of repo.languages.edges) totals.set(node.name, (totals.get(node.name) ?? 0) + size);
const sum = [...totals.values()].reduce((a, b) => a + b, 0);
const sorted = [...totals].sort((a, b) => b[1] - a[1]);
const top = sorted.slice(0, 6).map(([name, size]) => ({ name, share: size / sum }));
const rest = 1 - top.reduce((a, b) => a + b.share, 0);
if (rest > 0.0005) top.push({ name: "Otros", share: rest });

const updated = new Date().toISOString().slice(0, 10);
function render(t) {
  const W = 800, H = 262, X = 40, BW = W - 2 * X;
  let x = X;
  const segs = top
    .map((l, i) => {
      const w = Math.max(l.share * BW - 3, 2);
      const r = `<rect x="${x.toFixed(1)}" y="96" width="${w.toFixed(1)}" height="10" rx="3" fill="${t.scale[i]}" />`;
      x += l.share * BW;
      return r;
    })
    .join("\n");
  const legend = top
    .map((l, i) => {
      const cx = X + (i % 3) * 250, cy = 162 + Math.floor(i / 3) * 40;
      return `<rect x="${cx}" y="${cy - 13}" width="12" height="12" rx="2.5" fill="${t.scale[i]}" />
<text class="n" x="${cx + 22}" y="${cy}">${esc(l.name)}</text>
<text class="p" x="${cx + 214}" y="${cy}" text-anchor="end">${(l.share * 100).toFixed(1)}%</text>`;
    })
    .join("\n");
  const css = `
.k{font:500 14px ${MONO};fill:${t.accent};letter-spacing:1.6px}
.u{font:400 14px ${MONO};fill:${t.subtle}}
.n{font:500 20px ${SANS};fill:${t.text}}
.p{font:400 17px ${MONO};fill:${t.muted}}`;
  const body = `${card(t, W, H)}
<text class="k" x="${X}" y="60">${repos.totalCount} REPOSITORIOS PÚBLICOS</text>
<text class="u" x="${W - X}" y="60" text-anchor="end">${updated}</text>
${segs}
${legend}`;
  return svg({ width: W, height: H, label: `Lenguajes en repositorios públicos: ${top.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(", ")}`, weights: [500], css, body });
}

for (const [mode, t] of Object.entries(themes)) write(`${outDir}/languages-${mode}.svg`, render(t));
console.log(top.map((l) => `${l.name} ${(l.share * 100).toFixed(1)}%`).join(", "));
