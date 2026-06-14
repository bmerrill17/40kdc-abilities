// Stages this repo's ability-text JSON into dist/abilities/ (mirroring the R2 bucket
// layout) and writes dist/manifest-abilities.json in the contract the ListForge app's
// Kdc40DataService expects. Run by .github/workflows/publish.yml.
//
//   index.json    -> dist/abilities/index.json        (type: abilities-index)
//   <other>.json  -> dist/abilities/<other>.json      (type: abilities)
//   dist/manifest-abilities.json -> { version, generated_at, files: [{type, path}] }
//
// This repo owns ONLY the abilities slice + manifest-abilities.json. The 40kdc-data repo
// independently publishes the core slice + manifest-core.json. The app fetches both
// manifests and unions them, so there is no cross-repo coupling.

import { mkdirSync, copyFileSync, readdirSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SRC = process.env.ABILITIES_SRC || '.';
const DIST = 'dist';
const VERSION = process.env.VERSION || new Date().toISOString();

const files = [];
function stage(src, bucketPath, type) {
  const dest = join(DIST, bucketPath);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  files.push({ type, path: bucketPath });
}

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const entry of readdirSync(SRC)) {
  if (!entry.endsWith('.json')) continue;
  const p = join(SRC, entry);
  if (!statSync(p).isFile()) continue;
  stage(p, `abilities/${entry}`, entry === 'index.json' ? 'abilities-index' : 'abilities');
}

writeFileSync(
  join(DIST, 'manifest-abilities.json'),
  JSON.stringify({ version: VERSION, generated_at: new Date().toISOString(), files }, null, 2),
);
console.log(`Staged ${files.length} ability files; version=${VERSION}`);
