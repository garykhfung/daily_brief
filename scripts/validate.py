#!/usr/bin/env python3
"""Validate data/data.json against the Daily Brief v1 schema (cheap checks)."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "data.json"

AI_CATEGORIES = {
    "frontier",
    "open-source",
    "hk",
    "hardware-shipping",
    "hardware-gadgets",
    "companies",
    "markets",
}
GAMING_CATEGORIES = {
    "pc-switch2",
    "news",
    "other-consoles",
    "other",
}
CATEGORIES = {"ai": AI_CATEGORIES, "gaming": GAMING_CATEGORIES}

# ISO 8601 with +08:00 offset (HKT)
ISO_HKT = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+08:00$"
)


def fail(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def require(cond: bool, msg: str) -> None:
    if not cond:
        fail(msg)


def check_iso(value: str, path: str) -> None:
    require(isinstance(value, str) and ISO_HKT.match(value), f"{path}: need ISO +08:00 time, got {value!r}")


def check_item(item: dict, tab_id: str, path: str) -> None:
    require(isinstance(item, dict), f"{path}: item must be object")
    for key in ("id", "title", "summary", "source", "sourceUrl", "publishedAt", "category"):
        require(key in item, f"{path}: missing {key}")
        require(isinstance(item[key], str) and item[key].strip(), f"{path}.{key}: non-empty string required")

    require(item["sourceUrl"].startswith("https://"), f"{path}.sourceUrl: must be https")
    check_iso(item["publishedAt"], f"{path}.publishedAt")

    cats = CATEGORIES.get(tab_id, set())
    require(item["category"] in cats, f"{path}.category: {item['category']!r} not valid for tab {tab_id}")

    if item.get("image"):
        require(isinstance(item.get("imageAlt"), str) and item["imageAlt"].strip(), f"{path}: imageAlt required when image set")

    if "uncertain" in item:
        require(isinstance(item["uncertain"], bool), f"{path}.uncertain: must be bool")

    if "platforms" in item and item["platforms"] is not None:
        require(isinstance(item["platforms"], list), f"{path}.platforms: must be list")
        require(all(isinstance(p, str) for p in item["platforms"]), f"{path}.platforms: strings only")

    if "releaseDate" in item and item["releaseDate"] is not None:
        require(isinstance(item["releaseDate"], str), f"{path}.releaseDate: must be string")


def main() -> None:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DATA_PATH
    require(path.is_file(), f"missing file: {path}")

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON: {exc}")

    require(isinstance(data, dict), "root must be object")
    for key in ("updatedAt", "timezone", "tabs"):
        require(key in data, f"missing root.{key}")

    check_iso(data["updatedAt"], "updatedAt")
    require(data["timezone"] == "Asia/Hong_Kong", "timezone must be Asia/Hong_Kong")
    require(isinstance(data["tabs"], list) and data["tabs"], "tabs must be non-empty list")

    seen_tabs = set()
    item_count = 0
    for i, tab in enumerate(data["tabs"]):
        tpath = f"tabs[{i}]"
        require(isinstance(tab, dict), f"{tpath}: must be object")
        require(tab.get("id") in CATEGORIES, f"{tpath}.id: must be ai|gaming")
        require(isinstance(tab.get("label"), str) and tab["label"], f"{tpath}.label required")
        require(tab["id"] not in seen_tabs, f"{tpath}: duplicate tab id")
        seen_tabs.add(tab["id"])

        sections = tab.get("sections")
        require(isinstance(sections, list), f"{tpath}.sections must be list")
        seen_sections = set()
        for j, section in enumerate(sections):
            spath = f"{tpath}.sections[{j}]"
            require(isinstance(section, dict), f"{spath}: must be object")
            require(isinstance(section.get("id"), str) and section["id"], f"{spath}.id required")
            require(section["id"] in CATEGORIES[tab["id"]], f"{spath}.id invalid for {tab['id']}")
            require(section["id"] not in seen_sections, f"{spath}: duplicate section id")
            seen_sections.add(section["id"])
            require(isinstance(section.get("label"), str) and section["label"], f"{spath}.label required")
            items = section.get("items")
            require(isinstance(items, list), f"{spath}.items must be list")
            for k, item in enumerate(items):
                check_item(item, tab["id"], f"{spath}.items[{k}]")
                item_count += 1

    print(f"OK: {path} ({item_count} items, tabs={sorted(seen_tabs)})")


if __name__ == "__main__":
    main()
