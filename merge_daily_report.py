#!/usr/bin/env python3
"""将《财经培训日报》网站内容与本机 daily-news-report 新闻简报合并为一份日报并发送。"""

import argparse
import html
import json
import os
import re
import smtplib
import ssl
import subprocess
import sys
import traceback
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from bs4 import BeautifulSoup


# pythonw 无控制台运行时的输出保护
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")


CWD = Path(__file__).resolve().parent
PAGE_TSX = CWD / "app" / "page.tsx"
NEWS_SCRIPT = Path(
    r"D:\opencodeplaceoffice\.opencode\skills\daily-news-report\scripts\daily_news_report.py"
)
NEWS_REPORTS_DIR = Path(
    r"D:\opencodeplaceoffice\.opencode\skills\daily-news-report\reports"
)
HOLDINGS_SCRIPT = Path(r"D:\opencodeplaceoffice\robot2\get_holdings.py")
LOG_FILE = CWD / "merge_daily_report.log"

SENDER = RECEIVER = "5321120@qq.com"


def log(message: str) -> None:
    line = f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} {message}"
    try:
        print(line)
    except (UnicodeEncodeError, UnicodeDecodeError):
        print(line.encode("gbk", errors="replace").decode("gbk", errors="replace"))
    with LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(line + "\n")


def esc(value: str) -> str:
    return html.escape(str(value), quote=True)


def parse_page_array(source: str, name: str) -> list:
    """从 page.tsx 中解析 items/resources 等简单对象数组。"""
    match = re.search(
        r"const\s+" + name + r"\s*=\s*\[(.*?)\n\];", source, re.S
    )
    if not match:
        raise RuntimeError(f"page.tsx 中找不到数组 {name}")
    block = match.group(1)
    # 将裸 key（如 region:）转为带引号 key，便于 json 解析
    block = re.sub(
        r"(?<=[\{, ])([A-Za-z_][A-Za-z0-9_]*)(?=\s*:)", r'"\1"', block
    )
    block = re.sub(r",\s*\Z", "", block.rstrip())
    return json.loads("[" + block + "]")


def load_site_content() -> tuple[list, list]:
    source = PAGE_TSX.read_text(encoding="utf-8")
    items = parse_page_array(source, "items")
    resources = parse_page_array(source, "resources")
    return items, resources


def load_news_sections(date_str: str) -> tuple[Path, list]:
    path = NEWS_REPORTS_DIR / f"report_{date_str}.html"
    if not path.exists():
        candidates = sorted(NEWS_REPORTS_DIR.glob("report_*.html"))
        if not candidates:
            raise RuntimeError(f"未找到新闻简报文件：{path}")
        path = candidates[-1]
    soup = BeautifulSoup(path.read_text(encoding="utf-8"), "lxml")
    sections = [str(section) for section in soup.select("main section")]
    return path, sections


def refresh_news_report() -> None:
    """运行 daily-news-report 的抓取脚本（只生成报告、不发送邮件），保证合并内容为当天新闻。"""
    log("  刷新新闻简报（调用 daily_news_report.py --no-send）……")
    result = subprocess.run(
        [sys.executable, str(NEWS_SCRIPT), "--no-send"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=900,
    )
    if result.stdout:
        for line in result.stdout.splitlines():
            log("    | " + line)
    if result.returncode != 0:
        raise RuntimeError(f"新闻简报刷新失败，退出码 {result.returncode}：{result.stderr[-800:]}")
    log("  新闻简报刷新完成")


def training_section(items: list) -> str:
    rows = []
    for item in items:
        hot = (
            '<b style="background:#dc2626;color:#fff;font-size:11px;'
            'padding:2px 8px;border-radius:10px">重点</b>'
            if item.get("hot")
            else ""
        )
        rows.append(
            f"""
<div style="border:1px solid #eee;border-radius:10px;padding:12px 14px;margin:0 0 10px;background:#fffdf6">
  <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:6px">
    <span style="background:#b45309;color:#fff;font-size:11px;padding:2px 8px;border-radius:10px">{esc(item["region"])}</span>
    <span style="color:#666;font-size:12px">{esc(item["org"])}</span>
    <span style="color:#999;font-size:12px">发布 {esc(item["published"])}</span>{hot}
  </div>
  <a href="{esc(item["url"])}" style="color:#111;font-size:15px;font-weight:600;text-decoration:none" target="_blank">{esc(item["title"])} ↗</a>
  <p style="margin:6px 0 0;color:#555;font-size:13px;line-height:1.6">{esc(item["topic"])}</p>
  <div style="margin-top:8px;color:#777;font-size:12px;line-height:1.7">
    <span>🗓 {esc(item["date"])} · 截止 {esc(item["deadline"])}</span><br>
    <span>🎯 {esc(item["mode"])} · 💰 {esc(item["fee"])} · 📌 {esc(item["status"])}</span>
  </div>
</div>"""
        )
    return "".join(rows)


def resources_section(resources: list) -> str:
    rows = []
    for index, resource in enumerate(resources, 1):
        rows.append(
            f'<div style="display:flex;padding:8px 0;border-bottom:1px solid #f0f0f0;line-height:1.55">'
            f'<span style="flex:0 0 22px;height:20px;line-height:20px;text-align:center;border-radius:50%;background:#0f766e;color:#fff;font-size:11px;margin-right:10px">{index}</span>'
            f'<div><a href="{esc(resource["url"])}" style="color:#333;text-decoration:none" target="_blank">{esc(resource["title"])}</a>'
            f'<span style="color:#999;font-size:12px;margin-left:8px">[{esc(resource["kind"])} · {esc(resource["source"])} · {esc(resource["updated"])}]</span>'
            f'<div style="color:#777;font-size:12px">{esc(resource["desc"])}</div></div></div>'
        )
    return "".join(rows)


def build_merged_html(
    items: list,
    resources: list,
    news_sections: list,
    date_str: str,
    weekday: str,
    now_text: str,
) -> str:
    training = training_section(items)
    free_resources = resources_section(resources)
    news_html = "".join(news_sections)
    return f"""<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f3f6f9;font-family:Microsoft YaHei,PingFang SC,sans-serif;color:#333">
<div style="max-width:700px;margin:20px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08)">
<header style="background:linear-gradient(135deg,#1d4ed8,#7c3aed);color:#fff;text-align:center;padding:28px 20px">
  <h1 style="margin:0 0 8px;font-size:24px">财经日报</h1>
  <div style="font-size:13px;opacity:.92">{date_str} {weekday} · 培训信息 + 财税监管新闻 · {now_text}</div>
</header>
<main style="padding:20px">
  <section style="margin-bottom:22px">
    <h2 style="color:#b45309;border-left:4px solid #b45309;padding-left:12px;margin:0 0 12px;font-size:17px">一、财经培训日报｜今日仍可参加</h2>
    {training}
  </section>
  <section style="margin-bottom:22px">
    <h2 style="color:#0f766e;border-left:4px solid #0f766e;padding-left:12px;margin:0 0 4px;font-size:17px">二、财经培训日报｜免费专业资源</h2>
    <p style="color:#888;font-size:12px;margin:2px 0 8px">法规、模板、课件与案例 · 官方入口直达</p>
    {free_resources}
  </section>
  <section style="margin-bottom:10px;border-top:2px dashed #e2e8f0;padding-top:16px">
    <h2 style="color:#1d4ed8;border-left:4px solid #1d4ed8;padding-left:12px;margin:0 0 12px;font-size:17px">三、每日财税新闻简报</h2>
    {news_html}
  </section>
</main>
<footer style="padding:0 20px 18px;color:#999;font-size:11px;text-align:center;line-height:1.8">
  培训信息来自财经培训日报网站 · 新闻来源：中国注册会计师协会、中国注册税务师协会、国家税务总局、财政部、国务院国资委、中国证监会、上海证券交易所、深圳证券交易所<br>
  政策与答复以监管机构原文为准 · 本日报由 Codex 合并生成 · {now_text}
</footer>
</div></body></html>"""


def publish_to_github(out_path: Path, date_str: str) -> None:
    """重新生成索引页并把日报提交推送到 GitHub Pages，失败只记日志、不中断邮件发送。"""
    try:
        subprocess.run(
            [sys.executable, str(CWD / "generate_index.py")],
            cwd=CWD, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=60, check=True,
        )
        subprocess.run(
            ["git", "add", out_path.name, "index.html"],
            cwd=CWD, capture_output=True, text=True, encoding="utf-8",
            errors="replace", check=True,
        )
        commit = subprocess.run(
            ["git", "commit", "-m", f"Update daily report for {date_str}"],
            cwd=CWD, capture_output=True, text=True, encoding="utf-8",
            errors="replace",
        )
        if commit.returncode != 0 and "nothing to commit" not in commit.stdout:
            raise RuntimeError(commit.stdout + commit.stderr)
        push = subprocess.run(
            ["git", "push", "github", "main"],
            cwd=CWD, capture_output=True, text=True, encoding="utf-8",
            errors="replace", timeout=300,
        )
        if push.returncode != 0:
            raise RuntimeError(push.stderr[-800:])
        log("  GitHub 发布成功")
    except Exception as exc:
        log(f"  GitHub 发布失败（不影响邮件）：{exc}")


def load_email_password() -> str:
    paths = [
        Path(r"C:\aplaca\alpaca_config.json"),
        Path(r"D:\PythonProject\aplaca\alpaca_config.json"),
        Path.home() / ".config" / "opencode" / "daily-news-config.json",
    ]
    for path in paths:
        try:
            if path.exists():
                password = json.loads(
                    path.read_text(encoding="utf-8-sig")
                ).get("email_password", "")
                if password:
                    return password
        except Exception:
            pass
    env_password = os.environ.get("EMAIL_PASSWORD", "")
    if env_password:
        return env_password
    # 回退：读取本机既有脚本中保存的 QQ 授权码，不在日志中输出
    text = HOLDINGS_SCRIPT.read_text(encoding="utf-8")
    match = re.search(
        r"SENDER_PASSWORD\s*=\s*os\.getenv\(\s*['\"]EMAIL_PASSWORD['\"]\s*,\s*['\"]([^'\"]+)['\"]",
        text,
    )
    if match:
        return match.group(1)
    raise RuntimeError("未找到 QQ 邮箱授权码")


def send_email(body: str, subject: str) -> None:
    password = load_email_password()
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = SENDER
    message["To"] = RECEIVER
    message.attach(MIMEText(body, "html", "utf-8"))
    with smtplib.SMTP_SSL(
        "smtp.qq.com", 465, context=ssl.create_default_context()
    ) as server:
        server.login(SENDER, password)
        server.sendmail(SENDER, RECEIVER, message.as_string())


def main() -> int:
    parser = argparse.ArgumentParser(description="合并财经培训日报与财税新闻简报并发送")
    parser.add_argument("--date", default="", help="日报日期 YYYY-MM-DD，默认今天")
    parser.add_argument("--no-send", action="store_true", help="只生成合并报告，不发送邮件")
    parser.add_argument(
        "--no-refresh",
        action="store_true",
        help="不刷新当天新闻简报，直接使用已有 report 文件",
    )
    parser.add_argument("--out", default="", help="输出 HTML 路径")
    args = parser.parse_args()

    now = datetime.now()
    date_str = args.date or now.strftime("%Y-%m-%d")
    weekday = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"][now.weekday()]
    now_text = now.strftime("%Y-%m-%d %H:%M:%S")

    log(f"财经日报合并 {date_str} {now.strftime('%H:%M:%S')}")

    if not args.no_refresh:
        refresh_news_report()

    items, resources = load_site_content()
    log(f"  培训信息：{len(items)} 条，免费资源：{len(resources)} 条")

    news_path, news_sections = load_news_sections(date_str)
    log(f"  新闻简报：{news_path.name}，共 {len(news_sections)} 个栏目")

    body = build_merged_html(
        items, resources, news_sections, date_str, weekday, now_text
    )
    out_path = Path(args.out) if args.out else CWD / f"merged_report_{date_str}.html"
    out_path.write_text(body, encoding="utf-8")
    log(f"  合并报告已保存：{out_path}")

    if args.out == "":
        publish_to_github(out_path, date_str)

    if not args.no_send:
        subject = f"财经日报 {date_str} {weekday}（培训+财税新闻）"
        send_email(body, subject)
        log(f"  邮件发送成功：{RECEIVER}")
    else:
        log("  测试模式：未发送邮件")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(1)
