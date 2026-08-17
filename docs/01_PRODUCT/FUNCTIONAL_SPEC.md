# Functional Specification v1

> 状态：Architecture / Functional Baseline。本文定义“V1 要做什么”，不代表所有能力在第一个开发批次同时交付。

## 1. 产品目标

AI Editorial Desk Next 不是平台内容管理后台，也不是单纯热点监控器。它持续发现“值得讲的东西”，把原始资料转化为可研究、可解释、可编排、可人工决策的 Editorial Opportunity。

核心闭环：

```text
持续感知 / 主动侦察
→ Discovery
→ Editorial Opportunity
→ Value Evaluation
→ Research
→ Candidate
→ Programming
→ Human Decision
→ Draft
→ Publication
→ Performance
→ Calibration
```

## 2. V1 功能域

### F-01 情报感知与主动发现
- 常驻 Feed / RSS / API / Platform Connector 感知新信息。
- Discovery Scout 按 Mission 主动搜索，而不是只按固定平台关键词抓取。
- 支持 SearchProvider、FetchProvider、FeedProvider、PlatformProvider 可替换。
- 每条进入系统的资料必须记录 acquisition provenance。

### F-02 Subject / Discovery
- 将 RawSignal 关联到长期存在的 Subject。
- 记录“为什么现在值得注意”的 Discovery，而不是把所有对象都强行解释成 Event。
- 一个 Subject 可以在不同时间产生多个 Discovery。

### F-03 Editorial Opportunity
- 从 Discovery 生成一个或多个编辑机会。
- Opportunity 必须显式描述 `Angle / Theme / Audience Promise / Why Now`。
- 允许同一 Subject/Discovery 因不同 Angle 形成多个 Opportunity。

### F-04 Editorial Value Evaluation
- 使用版本化 Editorial Profile + Rubric 评价 Opportunity。
- 不以单一 0–100 总分作为业务真相。
- 输出 strengths、weaknesses、research gaps、integrity、production readiness、recommended action、confidence。
- Trend 只是可选 Feature Provider；没有 Trend 不阻止非热点内容进入后续流程。

### F-05 Research & Evidence
- 对值得追的 Opportunity 发起 Research Case。
- Research 可以调用 Web Search、Web Fetch、Platform Research、Knowledge Gateway/WeKnora。
- Claim / Unknown / supporting / contradicting provenance 必须可追溯。
- Research 完成后允许重新 Evaluation。

### F-06 Candidate & Programming
- Candidate V2 绑定 Opportunity，而不是 Event。
- 支持 Today Main、Series、Evergreen、Watch 等不同 Programming Context。
- 同一 Candidate 在不同 Context 中可有不同优先级。
- 允许 Pairwise Compare，不要求一个全局统一榜单。

### F-07 Human Editorial Decision
- 支持 Adopt / Watch / Drop / Archive 等人工决定。
- Decision append-only；算法重排不得覆盖人工历史。
- 记录 reason、actor、context snapshot、policy/evaluation provenance。

### F-08 Draft / Publication / Performance
- Adopt 不自动生成 Draft；Draft 不等于 Publication。
- Draft 保留 citation / evidence / risk / version / stale context 规则。
- Publication 冻结 editorial provenance。
- Performance snapshot append-only，并用于后续 Calibration，而不是静默改写历史判断。

### F-09 Editorial Knowledge
- 通过 Knowledge Gateway 接入 WeKnora 等 Provider。
- 存放方法论、栏目规则、账号画像、历史案例、风格与背景资料。
- Canonical Subject/Candidate/Decision/Publication 状态仍归 PostgreSQL。

### F-10 Harness Workbench
- Harness 作为首选 Agent Workbench / Product Runtime。
- Agent 通过 Editorial Tools 调用本项目 FastAPI，不直接访问数据库。
- 支持 Opportunity 卡片、Research 进度、Evidence、Decision、Draft 等结构化交互。
- 独立 Dashboard / Radar 是否完全由 Harness 承担，必须经过 Harness UI Spike 后再冻结。

## 3. V1 必须可完成的用户任务

1. 打开工作台即可看到系统此前已经发现的编辑机会，而不是先手动发起一次抓取。
2. 查看“为什么值得讲”、当前 Angle、Theme、Audience Promise、证据与未知项。
3. 要求 AI 更换 Angle、补充研究、比较多个候选。
4. 将机会 Adopt / Watch / Drop，并说明原因。
5. 按 Today / Series / Evergreen 等 Context 组织内容 Slate。
6. 对 Adopt 项继续产生可追溯 Draft，并记录真实发布和表现。

## 4. V1 非目标

- 不追求一次支持所有社交平台的完整爬取能力。
- 不以抓取数量、平台数量作为核心成功指标。
- 不让 Harness Session Log 或 WeKnora 成为业务事实数据库。
- 不做 silent self-evolution；任何 policy/rubric/prompts 的升级必须版本化、可回放、可审批。

## 5. 验收原则

V1 的核心验收不是“抓了多少条”，而是能否稳定完成：

```text
真实资料 → 可解释 Discovery → 有价值 Opportunity → 可研究 → 可人工决策 → 可发布 → 可回看结果
```

并且每一步都能回答：数据从哪里来、AI 为什么这么判断、人做过什么决定、后来结果如何。