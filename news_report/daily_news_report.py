#!/usr/bin/env python3
"""抓取财税监管机构最新信息，生成 HTML 日报（GitHub Actions 云端运行版）。

与原本地脚本的差异：邮箱账号/授权码改从环境变量 EMAIL_ACCOUNT / EMAIL_PASSWORD
读取，不落盘；使用北京时间，保证 UTC 时区的 CI runner 日期正确；报告输出到
脚本同级 reports/ 目录。
"""

import argparse
import html
import os
import re
import smtplib
import ssl
import sys
import traceback
from dataclasses import dataclass
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Dict, List
from urllib.parse import urljoin
from zoneinfo import ZoneInfo

import requests
import urllib3
from bs4 import BeautifulSoup

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

NOW = datetime.now(ZoneInfo("Asia/Shanghai"))
DATE_STR = NOW.strftime("%Y-%m-%d")
WEEKDAY = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"][NOW.weekday()]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


@dataclass(frozen=True)
class Source:
    section: str
    url: str
    base: str = ""
    selector: str = "a[href]"
    include_url: str = ""
    include_text: str = ""
    exclude_text: str = ""
    fallback_title: str = ""
    fallback_url: str = ""


# 原有行业协会 + 新增三部门的政策、答疑/解读和问题回复栏目。
SOURCES = [
    Source("中注协｜准则、指南与法规", "https://www.cicpa.org.cn/ztzl1/Professional_standards/", include_text=r"准则|指南|指引|规范|问题解答|标准"),
    Source("中注协｜年报审计与执业分析", "https://www.cicpa.org.cn/xxcx/annual_audit/", include_url=r"/xxfb/news/\d{6}/t\d+_\d+\.html"),
    Source("中注协｜执业质量检查通告", "https://www.cicpa.org.cn/ztzl1/Industry_regulation/zzxzyzljctg/", include_text=r"执业质量检查|检查通告|行业惩戒"),
    Source("中税协｜执业规范、准则与指南", "https://www.cctaa.cn/zygf/", include_text=r"规范|准则|指南|指引|规则|办法"),
    Source("中税协｜执业检查与监管公告", "https://www.cctaa.cn/zxtz/", include_text=r"执业|涉税专业服务|检查|监管|惩戒|处罚|处分|规范", fallback_title="查看中税协最新执业监管与检查公告"),
    Source("国家税务总局｜最新政策", "https://fgk.chinatax.gov.cn/zcfgk/c100027/list.html", include_url=r"/zcfgk/.+/content\.html"),
    Source("国家税务总局｜最新答疑", "https://www.chinatax.gov.cn/", include_url=r"/zcfgk/c100015/.+/content\.html"),
    Source("国家税务总局｜问题回复", "https://www.chinatax.gov.cn/chinatax/n810356/n3255681/common_listwyc.html", include_url=r"/content\.html", fallback_title="查看税务总局最新留言公开"),
    Source("财政部｜最新政策", "https://www.mof.gov.cn/zhengwuxinxi/zhengcefabu/", include_url=r"/t\d{8}_\d+\.htm"),
    Source("财政部｜最新答疑", "https://www.mof.gov.cn/zhengwuxinxi/zhengcejiedu/", include_url=r"/t\d{8}_\d+\.htm"),
    Source("财政部｜问题回复", "https://www.mof.gov.cn/bd/mhwzzxly/lyxd/index.htm", include_url=r"/lyxd/.*\.htm", fallback_title="查看财政部最新留言选登"),
    Source("国务院国资委｜最新政策", "https://wap.sasac.gov.cn/n2588035/n2588320/n2588335/index.html", include_url=r"/content\.html"),
    Source("国务院国资委｜最新答疑", "https://wap.sasac.gov.cn/n2588035/n2588320/n2588340/index.html", include_url=r"/content\.html"),
    Source("国务院国资委｜问题回复", "https://wap.sasac.gov.cn/n2588040/index.html", include_url=r"/content\.html", fallback_title="查看国资委最新政务咨询与互动热点"),
    Source("中国证监会｜政策解读", "https://www.csrc.gov.cn/csrc/c100039/common_list.shtml", selector="div.common-list ul.list li a", include_url=r"/csrc/c100028/.+/content\.shtml"),
    Source("上海证券交易所｜最新规则", "https://www.sse.com.cn/lawandrules/sselawsrules2025/latest/", selector="div.sse_list_1 a", include_url=r"/lawandrules/sselawsrules2025/.+/c/c_\d+_\d+\.shtml"),
    Source("深圳证券交易所｜最新规则", "https://www.szse.cn/lawrules/lawix/index.html", fallback_url="https://www.sse.org.cn/lawrules/lawix/index.html"),
    Source("证监会｜信息披露规则与准则", "https://www.csrc.gov.cn/csrc/c100039/common_list.shtml", selector="div.common-list ul.list li a", include_url=r"/csrc/c100028/.+/content\.shtml", include_text=r"信息披露|上市公司|公开发行|年度报告|定期报告|准则|规则"),
]

SKIP = {"首页", "返回", "更多", "查看更多", "下一页", "上一页", "尾页", "互动交流", "政策", "解读"}
DATE_RE = re.compile(r"(20\d{2})[-年/.](\d{1,2})[-月/.](\d{1,2})日?")


def get_page(url: str) -> requests.Response:
    response = requests.get(url, headers=HEADERS, timeout=30, verify=False)
    response.raise_for_status()
    if response.apparent_encoding and response.apparent_encoding.lower() != "ascii":
        response.encoding = response.apparent_encoding
    return response


def clean_title(text: str) -> str:
    text = " ".join(text.split())
    text = re.sub(r"^\d+\s+", "", text)
    text = DATE_RE.sub("", text)
    text = re.sub(r"\s{2,}", " ", text).strip(" -｜|")
    return text


def nearby_date(anchor) -> str:
    node = anchor.find_parent(["li", "tr", "div"]) or anchor
    match = DATE_RE.search(" ".join(node.get_text(" ", strip=True).split()))
    if not match:
        match = DATE_RE.search(anchor.get_text(" ", strip=True))
    return "-".join((match.group(1), match.group(2).zfill(2), match.group(3).zfill(2))) if match else ""


def extract(source: Source, limit: int) -> List[dict]:
    # 深交所列表由内嵌 JavaScript 生成。主站连接失败或无数据时使用公开镜像。
    if source.section.startswith("深圳证券交易所"):
        errors = []
        for url in (source.url, source.fallback_url):
            if not url:
                continue
            try:
                response = get_page(url)
                pair_re = re.compile(
                    r"var\s+curHref\s*=\s*'(?P<href>[^']+)'\s*;.*?"
                    r"var\s+curTitle\s*=\s*'(?P<title>[^']+)'\s*;.*?"
                    r"<span\s+class=\"time\">\s*(?P<date>\d{4}-\d{2}-\d{2})",
                    re.S,
                )
                items, seen = [], set()
                for match in pair_re.finditer(response.text):
                    title = clean_title(html.unescape(match.group("title")))
                    if title in seen:
                        continue
                    seen.add(title)
                    items.append({
                        "title": title,
                        "url": urljoin(response.url, match.group("href")),
                        "date": match.group("date"),
                    })
                    if len(items) >= limit:
                        break
                if items:
                    return items
                errors.append(f"{url}: 未发现规则数据")
            except Exception as exc:
                errors.append(f"{url}: {str(exc)[:80]}")
        raise RuntimeError("；".join(errors))

    response = get_page(source.url)
    soup = BeautifulSoup(response.text, "lxml")
    items, seen = [], set()
    pattern = re.compile(source.include_url) if source.include_url else None

    for anchor in soup.select(source.selector):
        href = (anchor.get("href") or "").strip()
        title = clean_title(anchor.get_text(" ", strip=True))
        full_url = urljoin(source.base or response.url, href)
        if not href or href.startswith("javascript") or href == "#":
            continue
        if pattern and not pattern.search(full_url):
            continue
        if len(title) < 6 or title in SKIP or title in seen:
            continue
        if source.include_text and not re.search(source.include_text, title):
            continue
        if source.exclude_text and re.search(source.exclude_text, title):
            continue
        seen.add(title)
        items.append({"title": title, "url": full_url, "date": nearby_date(anchor)})
        if len(items) >= limit:
            break

    # 某些留言页只在页面内嵌展示内容、没有逐条链接，至少保留官方栏目入口。
    if not items and source.fallback_title:
        items.append({"title": source.fallback_title, "url": source.url, "date": ""})
    return items


def scrape_all(limit: int = 5) -> Dict[str, List[dict]]:
    results = {}
    for source in SOURCES:
        try:
            print(f"  [{source.section}] 抓取中……")
            results[source.section] = extract(source, limit)
            print(f"  [{source.section}] {len(results[source.section])} 条")
        except Exception as exc:
            message = str(exc).replace("\n", " ")[:120]
            print(f"  [{source.section}] 失败：{message}")
            results[source.section] = [{"title": f"抓取失败：{message}", "url": source.url, "date": ""}]
    return results


def build_html(results: Dict[str, List[dict]]) -> str:
    colors = {"协会": "#287fb8", "税务": "#6a3ea1", "财政": "#c43d35", "国资": "#25805b", "证监会": "#7b1fa2", "上海证券": "#00695c", "深圳证券": "#0277bd"}
    sections = []
    for section, articles in results.items():
        color = next((value for key, value in colors.items() if key in section), "#287fb8")
        rows = []
        for index, article in enumerate(articles, 1):
            title = html.escape(article["title"])
            url = html.escape(article["url"], quote=True)
            date = f'<span style="color:#999;font-size:12px;margin-left:8px">[{html.escape(article["date"])}]</span>' if article["date"] else ""
            rows.append(f'<div style="display:flex;border-bottom:1px solid #eee;padding:9px 0;line-height:1.55"><span style="flex:0 0 24px;height:20px;line-height:20px;text-align:center;border-radius:50%;background:{color};color:#fff;font-size:12px;margin-right:10px">{index}</span><div><a href="{url}" style="color:#333;text-decoration:none" target="_blank">{title}</a>{date}</div></div>')
        sections.append(f'<section style="margin-bottom:18px"><h3 style="color:{color};border-left:4px solid {color};padding-left:12px;margin:0 0 4px;font-size:16px">📋 {html.escape(section)}</h3>{"".join(rows)}</section>')

    return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f3f6f9;font-family:Microsoft YaHei,PingFang SC,sans-serif;color:#333">
<div style="max-width:700px;margin:20px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08)">
<header style="background:linear-gradient(135deg,#205d82,#2d84b8);color:#fff;text-align:center;padding:28px 20px"><h1 style="margin:0 0 8px;font-size:23px">每日财税新闻简报</h1><div style="font-size:13px">{DATE_STR} {WEEKDAY} · {NOW.strftime('%H:%M')} 自动生成</div></header>
<main style="padding:20px">{"".join(sections)}</main>
<footer style="padding:0 20px 18px;color:#999;font-size:11px;text-align:center;line-height:1.8">数据来源：中国注册会计师协会、中国注册税务师协会、国家税务总局、财政部、国务院国资委、中国证监会、上海证券交易所、深圳证券交易所<br>政策与答复以监管机构原文为准 · {NOW.strftime('%Y-%m-%d %H:%M:%S')}</footer>
</div></body></html>'''


def send_email(body: str) -> None:
    account = os.environ.get("EMAIL_ACCOUNT", "")
    password = os.environ.get("EMAIL_PASSWORD", "")
    if not account or not password:
        raise RuntimeError("缺少 EMAIL_ACCOUNT / EMAIL_PASSWORD 环境变量")
    message = MIMEMultipart("alternative")
    message["Subject"] = f"每日财税简报 {DATE_STR}"
    message["From"] = account
    message["To"] = account
    message.attach(MIMEText(body, "html", "utf-8"))
    with smtplib.SMTP_SSL("smtp.qq.com", 465, context=ssl.create_default_context()) as server:
        server.login(account, password)
        server.sendmail(account, account, message.as_string())


def main() -> int:
    parser = argparse.ArgumentParser(description="每日财税新闻简报")
    parser.add_argument("--no-send", action="store_true", help="只生成报告，不发送邮件")
    parser.add_argument("--limit", type=int, default=5, help="每个栏目最多显示条数")
    args = parser.parse_args()

    print(f"每日财税新闻简报 {DATE_STR} {NOW.strftime('%H:%M:%S')}")
    results = scrape_all(max(1, min(args.limit, 10)))
    body = build_html(results)
    report_dir = Path(__file__).resolve().parent / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)
    report_path = report_dir / f"report_{DATE_STR}.html"
    report_path.write_text(body, encoding="utf-8")
    print(f"报告已保存：{report_path}")
    if not args.no_send:
        send_email(body)
        print("邮件发送成功")
    else:
        print("测试模式：未发送邮件")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc()
        sys.exit(1)
