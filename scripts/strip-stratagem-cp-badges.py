#!/usr/bin/env python3
"""Strip stray CP cost-badges (e.g. "1CP", "2CP") that the PDF extractor swept
into stratagem prose. The cost lives in 40kdc-data core `cp_cost`, so the badge
is redundant noise in the store's when/target/effect/restrictions fields.

Scope: ONLY ability_type == "stratagem" structured fields. Genuine in-rule CP
references (e.g. an effect that grants "gain 1CP") are preserved. raw_text
entries (unit abilities / enhancements / detachment rules) are left untouched.
"""
import json
import glob
import re
import sys

BADGE = re.compile(r"\d+\s?CP\b", re.I)
# Cue words/signs that mark a genuine CP reference (keep the token).
KEEP_LEFT = re.compile(
    r"\b(gain|gains|gaining|by|for|cost|costs|refund|refunded|spend|worth)\s*$",
    re.I,
)
SIGN_LEFT = re.compile(r"[-+−]\s*$")
SFIELDS = ("when", "target", "effect", "restrictions")


def clean(value):
    """Return (new_value, removed_count) with non-genuine badges stripped."""
    out, last, removed = [], 0, 0
    for m in BADGE.finditer(value):
        pre = value[: m.start()]
        if KEEP_LEFT.search(pre) or SIGN_LEFT.search(pre):
            continue  # genuine reference -> leave in place
        out.append(value[last : m.start()])
        last = m.end()
        removed += 1
    if removed == 0:
        return value, 0
    out.append(value[last:])
    s = "".join(out)
    s = re.sub(r"\s{2,}", " ", s)          # collapse doubled spaces
    s = re.sub(r"\s+([.,;:])", r"\1", s)   # no space before punctuation
    s = s.strip()
    return s, removed


def main():
    apply = "--apply" in sys.argv
    total = 0
    per_file = {}
    for fn in sorted(glob.glob("*.json")):
        if fn == "index.json":
            continue
        with open(fn, encoding="utf-8") as fh:
            data = json.load(fh)
        if not isinstance(data, list):
            continue
        changed = 0
        for e in data:
            if e.get("ability_type") != "stratagem":
                continue
            for f in SFIELDS:
                v = e.get(f)
                if not isinstance(v, str):
                    continue
                nv, n = clean(v)
                if n:
                    changed += n
                    e[f] = nv
        if changed:
            per_file[fn] = changed
            total += changed
            if apply:
                with open(fn, "w", encoding="utf-8") as fh:
                    json.dump(data, fh, ensure_ascii=False, indent=2)
                    fh.write("\n")
    for fn, c in sorted(per_file.items(), key=lambda x: -x[1]):
        print(f"  {c:4} {fn}")
    print(f"{'APPLIED' if apply else 'DRY-RUN'}: {total} badge(s) across {len(per_file)} file(s)")


if __name__ == "__main__":
    main()
