# 40kdc-abilities — raw ability text store

Out-of-repo lookup mapping `ability_id` → original raw ability text, written by
`40kdc-data`'s `author:ingest`. This pairs each authored Ability DSL entry with
the source prose it was authored from.

This store is its **own git repository**, separate from 40kdc-data. The
`author:ingest` tool `git init`s it on first run; commit it to version the raw text.

- `index.json` — flat `ability_id → { faction, raw_text }` for O(1) lookup.
- `<faction>.json` — full records (hierarchy + provenance + raw_text) per faction.