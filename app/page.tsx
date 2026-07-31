"use client";

import { useMemo, useState } from "react";

const items = [
  { region: "上海", org: "上海市注册会计师协会", type: "注册会计师", title: "2026年度助理审计人员网络培训", topic: "在线选课学习，完成24学时可按规定抵免会计继续教育90分", published: "07.01", date: "2026年度", deadline: "年度内", mode: "线上录播", fee: "协会组织", status: "开放学习", hot: true, url: "https://www.shcpa.org.cn/info/?pid=7420" },
  { region: "上海", org: "上海市注册会计师协会", type: "注册会计师", title: "2026年度注册会计师网络录播", topic: "专业课程、职业道德及直播回放，自主在线选课", published: "06.22", date: "06.22—12.31", deadline: "12.31", mode: "线上录播", fee: "协会组织", status: "开放学习", hot: true, url: "https://www.shcpa.org.cn/info/?pid=7410" },
  { region: "上海", org: "上海市注册会计师协会", type: "注册会计师", title: "胜任力专题直播（一）课程回放", topic: "可持续信息鉴证、国际可持续准则及AI审计实务", published: "06.08", date: "07.01—12.31", deadline: "12.31", mode: "线上回放", fee: "限已报名会员", status: "开放回放", hot: false, url: "https://www.shcpa.org.cn/info/?pid=7388" },
  { region: "北京", org: "北京注册会计师协会", type: "注册会计师", title: "免费开放注册会计师考试辅导与思政课程", topic: "面向北京地区两师行业从业人员，注册会计师六科网络辅导", published: "04.27", date: "即日起—12.20", deadline: "12.20", mode: "线上课程", fee: "明确免费", status: "开放学习", hot: true, url: "https://www.bicpa.org.cn/p1/tzgg/20260427/55271.html" },
  { region: "山东", org: "山东省注册会计师协会", type: "注册会计师", title: "2026年“继续教育在线”线上培训", topic: "注册会计师年度继续教育录播课程", published: "01.05", date: "即日起—12.09", deadline: "12.09", mode: "线上录播", fee: "会员课程", status: "开放学习", hot: false, url: "https://sdicpa.org.cn/news/202615/n94786144.html" },
  { region: "上海", org: "上海市注册会计师协会", type: "注册会计师", title: "2026年度非执业会员继续教育", topic: "投入式网络课程与产出式学时，年度继续教育不少于40学时", published: "02.28", date: "03.01—12.24", deadline: "12.24", mode: "线上课程", fee: "会员课程", status: "开放学习", hot: false, url: "https://shcpa.org.cn/info/?pid=7294" },
];

const filters = ["全部", "注册会计师", "税务师", "财政局", "法律合规"];

export default function Home() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("全部");
  const [region, setRegion] = useState("全国");
  const shown = useMemo(() => items.filter((item) => {
    const typeOk = active === "全部" || item.type.includes(active) || item.topic.includes(active);
    const regionOk = region === "全国" || item.region === region;
    const q = query.trim().toLowerCase();
    return typeOk && regionOk && (!q || `${item.title}${item.org}${item.topic}`.toLowerCase().includes(q));
  }), [query, active, region]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top"><span className="brandMark">财</span><span>财经培训日报</span></a>
        <nav><a href="#today">今日速览</a><a href="#list">培训清单</a><a href="#sources">信息来源</a></nav>
        <span className="mailBadge">每日 08:00 邮件送达</span>
      </header>

      <section className="hero" id="top">
        <div className="heroNoise" />
        <div className="heroInner">
          <div className="eyebrow"><span /> 2026年7月31日 · 星期五</div>
          <h1>重要的财经培训，<br /><em>不错过。</em></h1>
          <p>聚合各省市注册会计师协会、税务师协会及财政局公开发布的免费财务、税务与法律培训信息。</p>
          <div className="heroActions"><a className="primary" href="#list">浏览有效培训 <b>→</b></a><span>本次核验 <strong>31</strong> 个省级官方入口</span></div>
        </div>
        <aside className="brief" id="today">
          <div className="briefHead"><span>DAILY BRIEF</span><b>07 / 31</b></div>
          <div className="bigNum">06</div><p>条仍可参与的培训信息</p>
          <div className="rule" />
          <div className="miniStats"><div><b>00</b><span>近7日新增</span></div><div><b>06</b><span>仍可参加</span></div><div><b>03</b><span>覆盖地区</span></div></div>
          <small>人工核验于 2026-07-31 19:35</small>
        </aside>
      </section>

      <section className="ticker"><span>新鲜度提示</span><div>近 7 天暂无可确认的新增免费培训 · 当前展示仍在开放的有效项目 · 已结束培训不进入主列表</div></section>

      <section className="content" id="list">
        <div className="sectionTitle"><div><span className="kicker">VERIFIED &amp; STILL OPEN</span><h2>仍可参加</h2></div><p>按有效性排序 · 旧通知不等于过期项目</p></div>
        <div className="freshness"><b>本期口径</b><span>近7天新发：0条</span><span>近30天新发且有效：1条</span><span>长期有效：5条</span><em>发布日期与参与截止日分开显示</em></div>
        <div className="toolbar">
          <div className="tabs">{filters.map(f => <button key={f} className={active === f ? "active" : ""} onClick={() => setActive(f)}>{f}</button>)}</div>
          <div className="tools"><select aria-label="选择地区" value={region} onChange={e => setRegion(e.target.value)}><option>全国</option><option>北京</option><option>上海</option><option>山东</option></select><label className="search">⌕<input aria-label="搜索培训" placeholder="搜索主题或机构" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
        </div>
        <div className="listHead"><span>培训信息</span><span>有效期与形式</span><span>状态</span></div>
        <div className="cards">
          {shown.map((item, i) => <article className="card" key={item.title}>
            <div className="index">{String(i + 1).padStart(2, "0")}</div>
            <div className="mainInfo"><div className="meta"><span>{item.region}</span><span>{item.org}</span><span className="published">发布 {item.published}</span>{item.hot && <b>重点</b>}</div><h3>{item.title}</h3><p>{item.topic}</p><div className="fee">{item.fee}</div><a href={item.url} target="_blank" rel="noreferrer">查看官方通知 <b>↗</b></a></div>
            <div className="dateInfo"><b>{item.date}</b><span>{item.mode}</span><small>截止 {item.deadline}</small></div>
            <div className={`status ${item.status === "已结束" ? "muted" : ""}`}><i />{item.status}</div>
          </article>)}
          {!shown.length && <div className="empty">没有找到匹配的培训信息，试试其他关键词。</div>}
        </div>
      </section>

      <section className="sources" id="sources"><div><span className="kicker">SOURCE &amp; FRESHNESS</span><h2>信息收录标准</h2></div><p>优先收录近7天发布的官方信息；近30天信息仅在仍可报名或学习时保留；更早通知必须有明确的年度开放期限才会进入主列表。已结束、已截止项目转入归档，不再占用今日清单。</p><div className="sourceTags"><span>发布日期可核验</span><span>参与期限有效</span><span>费用如实标注</span><span>官方原文直达</span></div></section>
      <footer><div className="brand"><span className="brandMark">财</span><span>财经培训日报</span></div><p>让专业成长信息，每天准时抵达。</p><span>© 2026 · 官方信源智能聚合</span></footer>
    </main>
  );
}
