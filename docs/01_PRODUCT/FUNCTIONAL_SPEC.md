# Functional Specification v1

> 状态：Architecture / Functional Baseline。本文定义“V1 要做什么”，不代表所有能力在第一个开发批次同时交付。

## 1. 产品目标

AI Editorial Desk Next 不是平台内容管理后台，也不是单纯热点监控器。它持续发现“值得讲的东西”，把原始资料转化为可研究、可解释、可编排、可人工决策的 Editorial Opportunity。

核心闭环：

```text
持续感知 / 主动侦察 / 人工投喂
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
- 同时支持两类核心机器发现：
  - **Potential-driven**：即使尚未升温，只要内容本身有趣、有用、反常识、有故事性、保护价值、再解释价值或潜在受众连接，就可以收集、观察和评价。
  - **Momentum-driven**：发现搜索、社区、平台或跨平台注意力正在快速变化的内容。
- 支持 SearchProvider、FetchProvider、FeedProvider、PlatformProvider、TrendProvider 可替换。
- Reddit/论坛/社区等非官方来源允许作为 Discovery/Audience/Trend Signal，但不自动作为 Confirmed Evidence。
- 每条进入系统的资料必须记录 acquisition provenance、discovery lane 与 source role。
- 热度不是 Discovery、Opportunity 或 Candidate 的硬门槛。

### F-01B Human Acquisition / HumanSubmission
- 用户可以把刚看到的 URL、文字、问题、想法或观察直接“交给编辑部”。
- `HumanSubmission` 是 Acquisition 入口，不新建第二套 `HumanSignal` 事实体系；归一化后仍进入 RawSignal / Subject / Discovery 主链。
- 必须区分：
  - `source_origin`：信息原始来自哪里；
  - `acquisition_origin`：系统通过什么入口注意到它，例如 `HUMAN_SUBMISSION`。
- 用户粘贴 Reddit URL 时，原始来源仍是 Reddit；用户直接陈述且无外部来源时，以 unverified human assertion 语义进入验证流程。
- HumanSubmission 只代表“值得系统看一眼”，不等于 Confirmed Fact、正偏好标签、Opportunity、Candidate 或 Adopt。
- 首版最低支持 `text + url`；截图/图片等富媒体 Submission 可以后续扩展。
- 提交后系统复用现有 Fetch / Research / Evidence / Evaluation 流程完成：读取原文、查证、补背景、寻找反证、生成 Opportunity，并向用户说明结果。

### F-02 Subject / Discovery
- 将 RawSignal 关联到长期存在的 Subject。
- 记录“为什么值得注意”的 Discovery；该原因既可以是“正在升温”，也可以是“本身有价值/有潜力”，也可以是 `HUMAN_SEED`，而不是把所有对象都强行解释成 Event。
- 一个 Subject 可以在不同时间产生多个 Discovery。

### F-03 Editorial Opportunity
- 从 Discovery 生成一个或多个编辑机会。
- Opportunity 必须显式描述 `Angle / Theme / Audience Promise / Why Now`；对于 Evergreen / Potential Discovery，`Why Now` 可以是“当前无强时效、适合长期储备”，不能为了格式完整伪造热点理由。
- 允许同一 Subject/Discovery 因不同 Angle 形成多个 Opportunity。
- 进入 Candidate 前必须满足 **Editorial Advantage invariant**：说明系统相对于原始信息新增了什么编辑价值，例如跨源连接、事实验证、背景补充、角度转换、主题提升、受众连接、行动建议或后续回访钩子。

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
- HumanSubmission 进入后不得因为“是用户投喂的”而跳过 Evidence；机器发现与人工投喂共享同一事实核验标准。

### F-06 Candidate & Programming
- Candidate V2 绑定 Opportunity，而不是 Event。
- 支持 Today Main、Series、Evergreen、Watch、Potential 等不同 Programming Context。
- 同一 Candidate 在不同 Context 中可有不同优先级。
- 允许 Pairwise Compare，不要求一个全局统一榜单。

### F-07 Human Editorial Decision
- 支持 Adopt / Watch / Drop / Archive 等人工决定。
- Decision append-only；算法重排不得覆盖人工历史。
- 记录 reason、actor、context snapshot、policy/evaluation provenance。
- HumanSubmission 本身不作为偏好正样本；只有 Submission → Evaluation → Decision + reason 的完整链条才可作为后续 Rubric 校准数据。

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
2. 同时看到“正在升温”和“尚未升温但值得一看”的机会，不让热点挤掉 Evergreen / Curiosity / Story / Utility 内容。
3. 用户可以随手粘贴一条 URL、文字、问题或想法，交给系统验证、追问和组织，而不是自己手工创建完整选题。
4. 查看“为什么值得讲”、当前 Angle、Theme、Audience Promise、证据与未知项。
5. 要求 AI 更换 Angle、补充研究、比较多个候选。
6. 将机会 Adopt / Watch / Drop，并说明原因。
7. 按 Today / Series / Evergreen / Potential 等 Context 组织内容 Slate。
8. 对 Adopt 项继续产生可追溯 Draft，并记录真实发布和表现。

## 4. MVP v0.1 Vertical Slice

第一版最小可用产品必须至少包含两种入口：

```text
Machine Discovery
→ Potential / Momentum / Feed

Human Submission
→ URL / Text
```

并共同进入：

```text
RawSignal
→ Discovery
→ Opportunity
→ Evaluation / Research
→ Adopt / Watch / Drop
```

MVP 的成功标准不是完整自动写稿，而是系统能够在没有预先喂答案时找到值得看的素材，同时能把用户随手投喂的线索快速变成可验证、可判断的编辑机会。

## 5. V1 非目标

- 不追求一次支持所有社交平台的完整爬取能力。
- 不以抓取数量、平台数量、热点数量作为核心成功指标。
- 不要求一条内容必须有显著 Trend 才能进入 Editorial Opportunity。
- 不把 HumanSubmission 当作 Confirmed Fact 或默认正偏好标签。
- 不让 Harness Session Log 或 WeKnora 成为业务事实数据库。
- 不做 silent self-evolution；任何 policy/rubric/prompts 的升级必须版本化、可回放、可审批。

## 6. 验收原则

V1 的核心验收不是“抓了多少条”或“追到了多少热点”，而是能否稳定完成：

```text
真实资料 / 人工线索 → 可解释 Discovery → 有价值 Opportunity → 可研究 → 可人工决策 → 可发布 → 可回看结果
```

并且不同价值入口都能工作：

```text
正在升温 → Discovery
尚未升温但很有趣/有用/有故事 → Discovery
社区真实经历/争论 → Discovery Signal → Research → Evidence
用户随手投喂 → HumanSubmission → Research/Evaluation → Opportunity
```

每一步都必须回答：数据从哪里来、系统为什么看到了它、为什么值得讲、AI 为什么这么判断、人做过什么决定、后来结果如何。
