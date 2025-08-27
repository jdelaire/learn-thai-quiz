#!/usr/bin/env python3
import json
import os
import re
import sys

ROOT = "/workspace"
DATA_DIR = os.path.join(ROOT, "data")
RULES_DIR = os.path.join(DATA_DIR, "emoji-rules")

MAPPINGS = {
    "verbs.json": "verbs.json",
    "foods.json": "foods.json",
    "rooms.json": "rooms.json",
    "months-seasons.json": "months-seasons.json",
    "tenses.json": "tenses.json",
    "prepositions.json": "prepositions.json",
    "body-parts.json": "body-parts.json",
    "jobs.json": "jobs.json",
    "classifiers.json": "classifiers.json",
}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    # Preserve UTF-8 and two-space indentation; append trailing newline
    txt = json.dumps(data, ensure_ascii=False, indent=2)
    if not txt.endswith("\n"):
        txt += "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(txt)


def compile_rules(rules_path):
    rules = load_json(rules_path)
    compiled = []
    for r in rules:
        pat = r.get("pattern", "")
        emo = r.get("emoji", "")
        if not pat or not emo:
            continue
        try:
            rx = re.compile(pat, re.IGNORECASE)
            compiled.append((rx, emo))
        except re.error:
            # Skip invalid regex
            continue
    return compiled


def match_emoji(english_text, compiled_rules):
    t = (english_text or "").strip()
    for rx, emo in compiled_rules:
        if rx.search(t):
            return emo
    return ""


def migrate_file(dataset_filename, rules_filename):
    dataset_path = os.path.join(DATA_DIR, dataset_filename)
    rules_path = os.path.join(RULES_DIR, rules_filename)
    if not os.path.isfile(dataset_path):
        print(f"[skip] dataset missing: {dataset_path}")
        return (0, 0)
    if not os.path.isfile(rules_path):
        print(f"[skip] rules missing: {rules_path}")
        return (0, 0)

    compiled = compile_rules(rules_path)
    data = load_json(dataset_path)
    if not isinstance(data, list):
        print(f"[warn] dataset is not a list: {dataset_path}")
        return (0, 0)

    updated = 0
    total = 0
    for item in data:
        if not isinstance(item, dict):
            continue
        total += 1
        english = item.get("english") or item.get("id") or ""
        current = item.get("emoji", "")
        if current:
            continue  # already has emoji
        emo = match_emoji(english, compiled)
        # Always set emoji field; empty string if no match
        if emo:
            item["emoji"] = emo
            updated += 1
        else:
            item["emoji"] = ""

    save_json(dataset_path, data)
    return (updated, total)


def main():
    overall_updated = 0
    overall_total = 0
    for dataset, rules in MAPPINGS.items():
        u, t = migrate_file(dataset, rules)
        overall_updated += u
        overall_total += t
        print(f"[done] {dataset}: set {u} emojis out of {t} items")

    print(f"[summary] set {overall_updated} emojis across {overall_total} items")
    return 0


if __name__ == "__main__":
    sys.exit(main())

