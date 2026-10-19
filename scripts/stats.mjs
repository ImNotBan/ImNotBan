// Builds the GitHub activity card from the profile owner's public, non-fork
// repositories. Run daily by .github/workflows/stats.yml, which publishes
// the result to the `output` branch.
//   GITHUB_TOKEN=... node scripts/stats.mjs <out-dir>
import { SANS, MONO, c, svg, esc, write, f1 } from "./lib.mjs";

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
const top = [...totals].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name, size]) => ({ name, share: size / sum }));
const rest = 1 - top.reduce((a, b) => a + b.share, 0);
const shades = [c.violet, c.text2, c.muted, c.subtle, "#3f3f46"];

const W = 800, H = 270, X = 40, BX = 300, BW = W - X - BX;
let x = BX;
const segs = [...top, { name: "Other", share: rest }]
  .map((l, i) => {
    const w = Math.max(l.share * BW - 4, 3);
    const r = `<rect x="${f1(x)}" y="132" width="${f1(w)}" height="14" rx="4" fill="${shades[i]}" />`;
    x += l.share * BW;
    return r;
  })
  .join("\n");
const legend = top
  .map((l, i) => {
    const lx = BX + (i % 2) * 240, ly = 194 + Math.floor(i / 2) * 42;
    return `<rect x="${lx}" y="${ly - 15}" width="14" height="14" rx="4" fill="${shades[i]}" />
<text class="l" x="${lx + 26}" y="${ly}">${esc(l.name)}</text>
<text class="v" x="${lx + 218}" y="${ly}" text-anchor="end">${Math.round(l.share * 100)}%</text>`;
  })
  .join("\n");
const css = `
.k{font:500 22px ${MONO};fill:${c.violet2}}
.big{font:600 96px ${SANS};fill:${c.text};letter-spacing:-4px}
.cap{font:400 24px ${SANS};fill:${c.muted}}
.l{font:500 24px ${SANS};fill:${c.text2}}
.v{font:500 22px ${MONO};fill:${c.muted}}`;
const body = `<text class="k" x="${X}" y="66">GITHUB ACTIVITY</text>
<text class="big" x="${X - 4}" y="178">${repos.totalCount}</text>
<text class="cap" x="${X}" y="220">public</text>
<text class="cap" x="${X}" y="250">repositories</text>
<rect x="${BX - 40}" y="110" width="1" height="130" fill="${c.border}" />
<text class="cap" x="${BX}" y="114">Languages across them</text>
${segs}
${legend}`;
const label = `GitHub activity: ${repos.totalCount} public repositories. Languages: ${top.map((l) => `${l.name} ${Math.round(l.share * 100)}%`).join(", ")}`;
write(`${outDir}/activity.svg`, svg({ width: W, height: H, label, fonts: ["sans-400", "sans-500", "sans-600"], css, body }));
console.log(label);
