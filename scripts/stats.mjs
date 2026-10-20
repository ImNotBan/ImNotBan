// Builds the language bar from the profile owner's public, non-fork
// repositories, in a light and a dark version. Run daily by
// .github/workflows/stats.yml, which publishes the result to the `output`
// branch.
//   GITHUB_TOKEN=... node scripts/stats.mjs <out-dir>
import { SANS, themes, svg, esc, write, f1 } from "./lib.mjs";

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
const langs = [...top, { name: "Otros", share: 1 - top.reduce((a, b) => a + b.share, 0) }];
const pct = (l) => `${Math.round(l.share * 100)}%`;

const W = 800, H = 92;
const label = `${repos.totalCount} repositorios públicos. Lenguajes: ${top.map((l) => `${l.name} ${pct(l)}`).join(", ")}`;

for (const [name, t] of Object.entries(themes)) {
  let x = 0;
  const bar = langs
    .map((l, i) => {
      const w = Math.max(l.share * W - 3, 2);
      const r = `<rect x="${f1(x)}" y="36" width="${f1(w)}" height="8" rx="4" fill="${t.bars[i]}" />`;
      x += l.share * W;
      return r;
    })
    .join("\n");
  const legend = top
    .map((l, i) => {
      const lx = i * 200;
      return `<circle cx="${lx + 6}" cy="${77}" r="5" fill="${t.bars[i]}" />
<text class="l" x="${lx + 18}" y="82">${esc(l.name)} <tspan class="v">${pct(l)}</tspan></text>`;
    })
    .join("\n");
  const css = `
.h{font:600 17px ${SANS};fill:${t.text}}
.c{font:400 17px ${SANS};fill:${t.muted}}
.l{font:500 16px ${SANS};fill:${t.text}}
.v{font-weight:400;fill:${t.muted}}`;
  const body = `<text class="h" x="0" y="18">Lenguajes que más uso</text>
<text class="c" x="${W}" y="18" text-anchor="end">${repos.totalCount} repositorios públicos</text>
${bar}
${legend}`;
  write(`${outDir}/languages-${name}.svg`, svg({ width: W, height: H, label, fonts: ["sans-400", "sans-500", "sans-600"], css, body }));
}
console.log(label);
