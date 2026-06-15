// Merges this repo's ability-text files into ONE bundle, dist/bundle-abilities.json, in
// the shape the ListForge app's Kdc40DataService expects. Run by
// .github/workflows/publish.yml, which uploads the single file to R2.
//
//   { "version", "generated_at",
//     "abilities":[...],            // every <faction>.json + core.json record, concatenated
//     "abilities-index": { ... } }  // index.json (id -> {faction, raw_text})
//
// This repo owns ONLY the abilities slice. The 40kdc-data repo independently publishes
// bundle-core.json. The client downloads both (presigned, via the Fly signer) and merges
// them — no cross-repo coupling.

import { mkdirSync, readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.env.ABILITIES_SRC || '.';
const OUT = 'dist/bundle-abilities.json';
const VERSION = process.env.VERSION || new Date().toISOString();

const bundle = {
  version: VERSION,
  generated_at: new Date().toISOString(),
  abilities: [],
  'abilities-index': {},
};

for (const entry of readdirSync(SRC)) {
  if (!entry.endsWith('.json') || entry.startsWith('bundle-')) continue;
  const p = join(SRC, entry);
  if (!statSync(p).isFile()) continue;
  const json = JSON.parse(readFileSync(p, 'utf8'));
  if (entry === 'index.json') {
    if (json && typeof json === 'object') bundle['abilities-index'] = json;
  } else if (Array.isArray(json)) {
    bundle.abilities.push(...json);
  }
}

mkdirSync('dist', { recursive: true });
writeFileSync(OUT, JSON.stringify(bundle));
console.log(
  `Wrote ${OUT}; version=${VERSION}; abilities:${bundle.abilities.length} ` +
  `index:${Object.keys(bundle['abilities-index']).length}`,
);
