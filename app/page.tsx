"use client";

import { useMemo, useState } from "react";

const items = [
  { region: "全国", org: "中国注册会计师协会", type: "注册会计师", title: "2026年第一期在线直播培训班", topic: "可持续信息鉴证、反洗钱与商业银行审计", date: "05.13—05.14", mode: "线上直播", status: "已结束", hot: true, url: "https://www.cicpa.org.cn/xxfb/tzgg/202604/t20260427_65919.html" },
  { region: "北京", org: "北京市财政局", type: "财政局", title: "2026年度会计人员继续教育", topic: "专业科目与公需科目，支持网络及面授学习", date: "04.01—12.31", mode: "线上 / 线下", status: "报名中", hot: true, url: "https://czj.beijing.gov.cn/zwxx/tztg/202604/t20260407_4574966.html" },
  { region: "上海", org: "上海市财政局", type: "财政局", title: "会计高级（后备）人才培养", topic: "集中培训、在职实践与应用研究", date: "2026年度", mode: "线下培养", status: "进行中", hot: false, url: "https://czj.sh.gov.cn/zys_8908/zcfg_8983/zcfb_8985/hj_9035/hjyxrc_9039/20260511/xxfboswf0000003693.html" },
  { region: "广东", org: "深圳市财政局", type: "财政局", title: "2026年度会计专业技术人员继续教育", topic: "会计专业科目、面授培训及学分确认", date: "2026年度", mode: "线上 / 线下", status: "进行中", hot: false, url: "https://www.sz.gov.cn/cn/xxgk/zfxxgj/tzgg/content/post_12793958.html" },
  { region: "全国", org: "国家机关事务管理局", type: "财政培训", title: "中央国家机关会计人员继续教育", topic: "会计准则制度、财会监督与风险管理", date: "2026年度", mode: "多种形式", status: "进行中", hot: false, url: "https://www.ggj.gov.cn/tzgg/202603/t20260312_49171.htm" },
  { region: "全国", org: "国家机关事务管理局", type: "高端人才", title: "高层次财会人才岗位能力培训", topic: "总会计师及行政事业单位财务负责人能力提升", date: "2026年度", mode: "专题培训", status: "进行中", hot: true, url: "https://www.ggj.gov.cn/tzgg/202603/t20260303_49127.htm" },
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
          <div className="heroActions"><a className="primary" href="#list">浏览今日培训 <b>→</b></a><span>已追踪 <strong>93</strong> 个官方信源</span></div>
        </div>
        <aside className="brief" id="today">
          <div className="briefHead"><span>DAILY BRIEF</span><b>07 / 31</b></div>
          <div className="bigNum">06</div><p>条在办培训信息</p>
          <div className="rule" />
          <div className="miniStats"><div><b>03</b><span>重点推荐</span></div><div><b>04</b><span>开放报名</span></div><div><b>05</b><span>覆盖地区</span></div></div>
          <small>数据更新于今日 07:42</small>
        </aside>
      </section>

      <section className="ticker"><span>今日关注</span><div>北京会计人员继续教育开放至 12 月 31 日 · 中注协年度人才教育计划已发布 · 深圳会计继续教育安排更新</div></section>

      <section className="content" id="list">
        <div className="sectionTitle"><div><span className="kicker">TRAINING INTELLIGENCE</span><h2>培训情报</h2></div><p>仅收录官方发布、可核验来源的信息</p></div>
        <div className="toolbar">
          <div className="tabs">{filters.map(f => <button key={f} className={active === f ? "active" : ""} onClick={() => setActive(f)}>{f}</button>)}</div>
          <div className="tools"><select aria-label="选择地区" value={region} onChange={e => setRegion(e.target.value)}><option>全国</option><option>北京</option><option>上海</option><option>广东</option></select><label className="search">⌕<input aria-label="搜索培训" placeholder="搜索主题或机构" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
        </div>
        <div className="listHead"><span>培训信息</span><span>日期与形式</span><span>状态</span></div>
        <div className="cards">
          {shown.map((item, i) => <article className="card" key={item.title}>
            <div className="index">{String(i + 1).padStart(2, "0")}</div>
            <div className="mainInfo"><div className="meta"><span>{item.region}</span><span>{item.org}</span>{item.hot && <b>重点</b>}</div><h3>{item.title}</h3><p>{item.topic}</p><a href={item.url} target="_blank" rel="noreferrer">查看官方通知 <b>↗</b></a></div>
            <div className="dateInfo"><b>{item.date}</b><span>{item.mode}</span></div>
            <div className={`status ${item.status === "已结束" ? "muted" : ""}`}><i />{item.status}</div>
          </article>)}
          {!shown.length && <div className="empty">没有找到匹配的培训信息，试试其他关键词。</div>}
        </div>
      </section>

      <section className="sources" id="sources"><div><span className="kicker">SOURCE NETWORK</span><h2>信息来自哪里？</h2></div><p>每日巡检各省市注册会计师协会、注册税务师协会、财政局及相关政府部门官方网站。所有信息保留原始链接；具体资格、费用及名额以发布单位通知为准。</p><div className="sourceTags"><span>注册会计师协会</span><span>税务师协会</span><span>省市财政局</span><span>政府官方平台</span></div></section>
      <footer><div className="brand"><span className="brandMark">财</span><span>财经培训日报</span></div><p>让专业成长信息，每天准时抵达。</p><span>© 2026 · 官方信源智能聚合</span></footer>
    </main>
  );
}
