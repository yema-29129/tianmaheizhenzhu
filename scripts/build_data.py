#!/usr/bin/env python3
import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "content-data.js"


def clean(value: str) -> str:
    return (value or "").strip()


def normalize_date(value: str) -> tuple[str, str]:
    raw = clean(value)
    if not raw:
        return "", ""

    try:
        parsed = datetime.strptime(raw, "%Y/%m/%d")
    except ValueError:
        return raw, ""

    return parsed.strftime("%Y-%m-%d"), parsed.strftime("%Y.%m.%d")


def normalize_year(row: dict, iso_date: str) -> str:
    if iso_date:
        return iso_date[:4]

    source = clean(row.get("年份", ""))
    match = re.search(r"(20\d{2})", source)
    return match.group(1) if match else ""


def row_key(row: dict) -> tuple[str, str, str]:
    return (
        clean(row.get("发布时间", "")),
        clean(row.get("标题", "")),
        clean(row.get("星球链接", "")),
    )


def load_rows(csv_paths: list[Path]) -> list[dict]:
    seen = set()
    items = []

    for csv_path in csv_paths:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                key = row_key(row)
                if key in seen:
                    continue

                seen.add(key)
                iso_date, display_date = normalize_date(row.get("发布时间", ""))
                year = normalize_year(row, iso_date)
                item_id = f"{iso_date or year or 'unknown'}-{len(items) + 1:04d}"

                items.append(
                    {
                        "id": item_id,
                        "title": clean(row.get("标题", "")),
                        "category": clean(row.get("项目推荐", "")) or "未分类",
                        "link": clean(row.get("星球链接", "")),
                        "issue": clean(row.get("期数", "")),
                        "author": clean(row.get("内容作者", "")),
                        "elite": clean(row.get("是否精华", "")) == "精华",
                        "planetType": clean(row.get("星球类型", "")),
                        "note": clean(row.get("备注", "")),
                        "publishedAt": iso_date,
                        "publishedAtLabel": display_date or clean(row.get("发布时间", "")) or "日期缺失",
                        "year": year,
                        "sortDate": iso_date if iso_date else (f"{year}-00-00" if year else "0000-00-00"),
                    }
                )

    return sorted(items, key=lambda item: (item["sortDate"], item["title"]), reverse=True)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: build_data.py <csv-file> [<csv-file> ...]")
        return 1

    csv_paths = [Path(arg).expanduser().resolve() for arg in argv[1:]]
    items = load_rows(csv_paths)
    payload = "window.CONTENT_DATA = " + json.dumps(items, ensure_ascii=False, separators=(",", ":")) + ";\n"
    OUTPUT.write_text(payload, encoding="utf-8")
    print(f"Wrote {len(items)} items to {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
