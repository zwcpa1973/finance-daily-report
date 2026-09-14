#!/usr/bin/env python3
"""扫描目录下的 merged_report_*.html，生成 GitHub Pages 首页索引 index.html。"""

import re
from datetime import datetime
from pathlib import Path

CWD = Path(__file__).resolve().parent
WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]


def collect_reports() -> list[dict]:
    reports = []
    for path in sorted(CWD.glob("merged_report_*.html")):
        match = re.fullmatch(r"merged_report_(\d{4}-\d{2}-\d{2})\.html", path.name)
        if not match:
            continue
        date = datetime.strptime(match.group(1), "%Y-%m-%d")
        first_line = path.read_text(encoding="utf-8").splitlines()
        subtitle = next(
            (line.strip() for line in first_line if "培训信息" in line and "·" in line),
            "",
        )
        subtitle = re.sub(r"<[^>]+>", "", subtitle)
        reports.append(
            {
                "file": path.name,
                "date": date,
                "date_text": date.strftime("%Y-%m-%d"),
                "weekday": WEEKDAYS[date.weekday()],
                "subtitle": subtitle,
            }
        )
    reports.sort(key=lambda item: item["date"], reverse=True)
    return reports


def report_card(report: dict) -> str:
    return f"""
<a class="card" href="/{report['file']}">
  <div class="card-head"><span class="date">{report['date_text']}</span><span class="weekday">{report['weekday']}</span></div>
  <div class="card-sub">{report['subtitle']}</div>
</a>"""


def build_index(reports: list[dict]) -> str:
    latest = reports[0] if reports else None
    cards = "\n".join(report_card(report) for report in reports)
    updated = latest["date_text"] if latest else "暂无"
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>财经日报 · 合刊归档</title>
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin: 0; background: #f3f6f9; font-family: "Microsoft YaHei", "PingFang SC", sans-serif; color: #333; }}
  header {{ background: linear-gradient(135deg, #1d4ed8, #7c3aed); color: #fff; text-align: center; padding: 40px 20px 32px; }}
  header h1 {{ margin: 0 0 10px; font-size: 30px; letter-spacing: 2px; }}
  header p {{ margin: 0; font-size: 14px; opacity: .92; }}
  header .latest {{ display: inline-block; margin-top: 18px; background: rgba(255,255,255,.16); border: 1px solid rgba(255,255,255,.45); border-radius: 999px; padding: 8px 22px; color: #fff; text-decoration: none; font-size: 14px; }}
  header .latest:hover {{ background: rgba(255,255,255,.28); }}
  main {{ max-width: 760px; margin: 26px auto 60px; padding: 0 16px; }}
  h2 {{ font-size: 16px; color: #555; border-left: 4px solid #7c3aed; padding-left: 10px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px; }}
  .card {{ display: block; background: #fff; border-radius: 12px; padding: 14px 16px; box-shadow: 0 2px 8px rgba(0,0,0,.06); text-decoration: none; color: #333; border: 1px solid transparent; transition: transform .12s, border-color .12s; }}
  .card:hover {{ transform: translateY(-2px); border-color: #7c3aed; }}
  .card-head {{ display: flex; justify-content: space-between; align-items: baseline; }}
  .card .date {{ font-size: 17px; font-weight: 700; color: #1d4ed8; }}
  .card .weekday {{ font-size: 12px; color: #999; }}
  .card-sub {{ margin-top: 6px; font-size: 12px; color: #777; line-height: 1.6; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }}
  footer {{ text-align: center; color: #999; font-size: 12px; padding: 0 16px 40px; line-height: 1.8; }}
</style>
</head>
<body>
<header>
  <h1>财经日报</h1>
  <p>财经培训信息 · 免费专业资源 · 每日财税新闻</p>
  {f'<a class="latest" href="/{latest["file"]}">📖 阅读最新一期：{latest["date_text"]} {latest["weekday"]}</a>' if latest else ''}
</header>
<main>
  <h2>全部期刊（{len(reports)} 期）</h2>
  <div class="grid">{cards}
  </div>
</main>
<footer>
  培训信息来自财经培训日报网站 · 新闻来源：中注协、中税协、国家税务总局、财政部、国务院国资委、中国证监会、沪深交易所<br>
  政策与答复以监管机构原文为准
</footer>
</body>
</html>
"""


def main() -> None:
    reports = collect_reports()
    out = CWD / "index.html"
    out.write_text(build_index(reports), encoding="utf-8")
    print(f"index.html 已生成，共 {len(reports)} 期")


if __name__ == "__main__":
    main()
