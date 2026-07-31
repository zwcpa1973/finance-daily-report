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

const resources = [
  { kind: "法规库", title: "国家法律法规数据库", desc: "全国人大常委会办公厅建设，检索现行法律、行政法规、地方性法规与司法解释。", source: "全国人大", updated: "持续更新", url: "https://flk.npc.gov.cn/" },
  { kind: "法规库", title: "中国注册会计师执业准则库", desc: "审计准则、职业道德守则、应用指南及其他专业标准的官方汇集。", source: "中国注册会计师协会", updated: "持续更新", url: "https://www.cicpa.org.cn/ztzl1/Professional_standards/" },
  { kind: "报告模板", title: "财务报表审计报告参考格式", desc: "审计准则第1501号附录，含上市实体单体及合并财务报表审计报告参考格式。", source: "中国注册会计师协会", updated: "官方PDF", url: "https://www.cicpa.org.cn/ztzl1/Professional_standards/201601/W020210421547026807846.pdf" },
  { kind: "报告模板", title: "高等学校财务报表审计指引", desc: "附录提供无保留意见等审计报告参考格式，可用于教育行业项目参考。", source: "中国注册会计师协会", updated: "官方PDF", url: "https://www.cicpa.org.cn/xxfb/news/201412/W020210118389976201481.pdf" },
  { kind: "案例讲解", title: "企业会计准则应用案例库", desc: "覆盖收入、金融工具、股份支付、租赁、所得税等准则的具体业务案例。", source: "财政部会计司", updated: "持续更新", url: "https://kjs.mof.gov.cn/zt/kjzzss/srzzzq/" },
  { kind: "案例讲解", title: "政府及非营利组织会计应用案例", desc: "包含合并财务报表、成本核算、预算管理一体化及长期股权投资案例。", source: "财政部会计司", updated: "持续更新", url: "https://kjs.mof.gov.cn/zt/zfkjzz/yyal/" },
  { kind: "最新案例", title: "准则解释第20号实施问答与案例", desc: "2026年7月24日发布，跟进最新企业会计准则解释及配套实务口径。", source: "财政部会计司", updated: "07.24", url: "https://kjs.mof.gov.cn/gongzuotongzhi/index.htm" },
  { kind: "培训资料", title: "继续教育课程与直播回放入口", desc: "上海注协公开的年度录播与专题直播回放入口，按会员资格登录学习。", source: "上海市注册会计师协会", updated: "开放至12.31", url: "https://www.shcpa.org.cn/column/?psid=71" },
  { kind: "IMA免费资源", title: "CMA官方免费备考资源", desc: "包含CMA练习题、考试模拟器、个性化学习计划、考试指南及备考策略网络研讨会。", source: "IMA官方", updated: "持续开放", url: "https://prodcm.imanet.org/ima-certifications/cma-certification/prepare/resources" },
  { kind: "IMA网络课程", title: "IMA Webinars 专题中心", desc: "覆盖数据分析、财务报告、领导力、职业发展及战略管理；部分资源会员免费。", source: "IMA官方", updated: "持续更新", url: "https://www.imanet.org/continuing-education/webinars" },
  { kind: "IMA框架", title: "管理会计能力素质框架", desc: "IMA管理会计能力素质框架及技术分析、报告控制、战略绩效等学习资源索引。", source: "IMA官方", updated: "免费PDF", url: "https://prodcm.imanet.org/-/media/IMA/Files/Home/Insights-and-Trends/SMA/IMA-Management-Accounting-Competency-Framework/IMA-Management-Accounting-Competency-Framework.ashx" },
];

const bigFourResources = [
  { firm: "德勤 Deloitte", kind: "会计准则", title: "IAS Plus 国际财务报告资源库", desc: "IFRS、IASB 与可持续披露动态，含准则摘要、项目进展、示例报表、清单及技术刊物。", access: "公开免费", language: "英文 / 多语种", url: "https://www.iasplus.com/" },
  { firm: "德勤 Deloitte", kind: "准则课程", title: "IFRS 免费电子学习模块", desc: "按IAS及IFRS准则编排的在线学习模块，适合系统复习确认、计量、列报和披露要求。", access: "公开免费", language: "英文", url: "https://www.iasplus.com/en/publications/e-learning" },
  { firm: "普华永道 PwC", kind: "会计准则", title: "Viewpoint 财务报告知识库", desc: "美国会计、财务报告与可持续披露技术解读，配套播客、网络研讨会及每周更新。", access: "美国内容免费", language: "英文", url: "https://www.pwc.com/us/en/products/viewpoint.html" },
  { firm: "普华永道 PwC", kind: "税务指南", title: "Worldwide Tax Summaries", desc: "由各地税务专家编写，覆盖全球企业税和个人税，可跨国家、按专题生成定制对比报告。", access: "公开免费", language: "英文", url: "https://taxsummaries.pwc.com/" },
  { firm: "安永 EY", kind: "会计准则", title: "International GAAP", desc: "国际财务报告准则的解释与实务应用指南，可通过EY Atlas客户端免费阅读数字版本。", access: "免费注册阅读", language: "英文", url: "https://www.ey.com/en_gl/technical/ifrs-technical-resources/international-gaap-2024-global-perspective-on-ifrs" },
  { firm: "安永 EY", kind: "税务指南", title: "Worldwide Corporate Tax Guide", desc: "约150个司法管辖区的企业所得税、预提税、转让定价和反避税制度年度汇编。", access: "免费PDF", language: "英文", url: "https://www.ey.com/content/dam/ey-unified-site/ey-com/en-gl/technical/tax-guides/documents/ey-worldwide-corporate-tax-guide-10-2025.pdf" },
  { firm: "毕马威 KPMG", kind: "会计准则", title: "IFRS Institute", desc: "IFRS与可持续披露技术文章、实务手册、工具包、播客及网络研讨会回放。", access: "公开免费", language: "英文", url: "https://kpmg.com/us/en/insights-by-topic/ifrs-institute.html" },
  { firm: "毕马威 KPMG", kind: "税务工具", title: "Tax Tools & TaxNewsFlash", desc: "全球税率比较工具、国际税务动态、监管政策与重要司法意见的快速摘要。", access: "公开免费", language: "英文", url: "https://kpmg.com/ee/en/services/tax/tax-tools-and-resources.html" },
];

const bilibiliVideos = [
  { category: "CPA财务管理", title: "2026 CPA《财管》零基础入门课", creator: "斩六将CPA", published: "2026.01.15", lessons: "约15小时 · 系列课", note: "从财务报表分析、货币时间价值到投融资决策，适合零基础搭建财管框架。", risk: "站内免费观看；配套资料需跳转APP", url: "https://www.bilibili.com/video/BV182rfBnEK9/" },
  { category: "财税实务", title: "2026财税系统课：企业税与个人税", creator: "B站财税创作者", published: "2026.01.20", lessons: "127集 · 系列课", note: "覆盖费用税前扣除、增值税、个人所得税与常见企业财税问题。", risk: "站内免费观看；观点需对照现行法规", url: "https://www.bilibili.com/video/BV1HfkhBaEnp/" },
  { category: "CPA税法", title: "注册会计师《税法》系统课程", creator: "之了课堂", published: "持续更新", lessons: "96集 · 系列课", note: "从税法总论到增值税、企业所得税及国际税收，适合CPA税法系统学习。", risk: "视频免费；讲义为条件领取", url: "https://www.bilibili.com/video/BV1t84y1p71Y/" },
  { category: "管理会计", title: "中央财经大学《管理会计》", creator: "金融知识库", published: "2023.04.13", lessons: "44讲 · 完整课程", note: "讲解管理会计框架、职业道德、预算、成本与经营决策等基础内容。", risk: "站内免费观看；非校方账号上传", url: "https://www.bilibili.com/video/BV1za4y1N74x/" },
];

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
        <nav><a href="#today">今日速览</a><a href="#list">培训清单</a><a href="#resources">免费资源</a><a href="#sources">信息来源</a></nav>
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

      <section className="resourceSection" id="resources">
        <div className="sectionTitle"><div><span className="kicker">FREE PROFESSIONAL TOOLKIT</span><h2>免费专业资源</h2></div><p>法规、模板、课件与案例 · 官方入口直达</p></div>
        <div className="wechatRadar"><span>公众号雷达</span><div><b>新增微信信源</b><p>同步检索各地注协、税协、财政局官方公众号；仅收录账号身份可由官网或政府信息交叉验证的文章。</p></div><em>公众号首发 → 身份核验 → 链接入库</em></div>
        <div className="communityRadar"><span>小红书社区资源</span><p>平台要求登录后才返回搜索结果；当前不展示未经核验的帖子。登录检索后将按“直接免费 / 条件领取 / 待核验”分类，并保留原帖链接与作者。</p><b>待登录采集</b></div>
        <div className="resourceGrid">
          {resources.map((resource, i) => <a className="resourceCard" href={resource.url} target="_blank" rel="noreferrer" key={resource.title}>
            <div className="resourceTop"><span>{resource.kind}</span><b>{String(i + 1).padStart(2, "0")}</b></div>
            <h3>{resource.title}</h3><p>{resource.desc}</p>
            <div className="resourceFoot"><span>{resource.source}</span><em>{resource.updated}</em><b>↗</b></div>
          </a>)}
        </div>
        <div className="bigFourHead"><div><span className="kicker">BIG FOUR TECHNICAL LIBRARY</span><h2>四大税务与会计准则资源</h2></div><p>仅收录事务所官方入口 · 访问条件如实标注</p></div>
        <div className="bigFourGrid">
          {bigFourResources.map((resource) => <a className="bigFourCard" href={resource.url} target="_blank" rel="noreferrer" key={resource.title}>
            <div className="bigFourMeta"><span>{resource.firm}</span><em>{resource.kind}</em></div>
            <h3>{resource.title}</h3><p>{resource.desc}</p>
            <div className="bigFourFoot"><b>{resource.access}</b><span>{resource.language}</span><i>访问官网 ↗</i></div>
          </a>)}
        </div>
        <div className="bigFourHead bilibiliHead"><div><span className="kicker">BILIBILI FREE CLASSROOM</span><h2>Bilibili 免费财务课程</h2></div><p>站内可直接观看 · 标注课程完整度与引流风险</p></div>
        <div className="bilibiliGrid">
          {bilibiliVideos.map((video) => <a className="bilibiliCard" href={video.url} target="_blank" rel="noreferrer" key={video.title}>
            <div className="bilibiliMeta"><span>{video.category}</span><em>{video.published}</em></div>
            <h3>{video.title}</h3><p>{video.note}</p>
            <div className="videoFacts"><span>{video.creator}</span><b>{video.lessons}</b></div>
            <div className="videoRisk">核验提示：{video.risk}<i>播放 ↗</i></div>
          </a>)}
        </div>
        <p className="resourceNote">说明：标注“会员课程”的培训资料可能需要协会会员账号登录，但资源入口及通知均可公开访问。</p>
      </section>

      <section className="sources" id="sources"><div><span className="kicker">SOURCE &amp; FRESHNESS</span><h2>信息收录标准</h2></div><p>优先收录近7天发布的官方信息；近30天信息仅在仍可报名或学习时保留；更早通知必须有明确的年度开放期限才会进入主列表。微信公众号须核验官方账号身份；Bilibili课程优先机构、高校或实名讲师账号，并标注课程完整度、时效及站外引流风险。</p><div className="sourceTags"><span>官方网站</span><span>官方微信公众号</span><span>Bilibili免费课程</span><span>发布日期可核验</span><span>参与期限有效</span><span>费用如实标注</span></div></section>
      <footer><div className="brand"><span className="brandMark">财</span><span>财经培训日报</span></div><p>让专业成长信息，每天准时抵达。</p><span>© 2026 · 官方信源智能聚合</span></footer>
    </main>
  );
}
