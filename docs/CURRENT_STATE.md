# Current State

## 状态

`PHASE_0_5_A_READY_TO_MERGE`

Architecture + Functional Baseline v1 已通过 PR #1 合并到 `main`。

当前并行基线：
- Phase 0.5-A Harness Integration Spike：PR #2 / `spike/harness-integration`；**技术 Spike 已完成，exact-head CI 已通过，可合并**；真实浏览器/模型 UX 继续作为 post-merge Gate；
- Human Acquisition baseline amendment：已通过 PR #3 合并到 `main`，HumanSubmission 已冻结为一等发现入口；
- Phase 0.5-B Acquisition Provider Spike：PR #2 合并后可正式进入，不依赖 Harness Full Workbench 人工结论才开始。

本分支只收口 **PR #2 / Phase 0.5-A Harness Integration Spike**，不进入 Acquisition Provider Spike 正式实现。

## 已确认

- 新仓库独立演化，旧 `ai-editorial-desk` 冻结为 Legacy MVP/reference。
- 新核心以 Subject / Discovery / Editorial Opportunity 为中心。
- Editorial Opportunity 是 Value Evaluation 与 Candidate V2 的直接业务对象。
- Editorial Value 采用版本化 Profile，不以单个 0–100 总分作为业务真相。
- Trend 从前置必需步骤降级为可选 Feature Provider。
- Acquisition 改为 Mission-driven：Ambient Coverage + Potential Scouts + Momentum Radar + Search-first + Targeted Fetch + Targeted Platform Research。
- **热度不是 Discovery Gate**：未升温但本身有趣、有用、有故事、反常识、保护价值或再解释潜力的内容可以进入 Discovery/Opportunity。
- Reddit/论坛/社区等非官方来源允许作为 Discovery/Audience/Trend Signal；事实确认仍遵守 Evidence/Primary Source 规则。
- **Human Acquisition 是一等发现入口**：用户可以通过 HumanSubmission 提交 URL / Text / Question / Idea / Observation；归一化后仍进入统一 RawSignal / Subject / Discovery 主链。
- HumanSubmission 不是 Confirmed Fact、偏好正标签、Opportunity、Candidate 或 Adopt。
- `source_origin` 与 `acquisition_origin` 必须分离；用户提交第三方 URL 不改变第三方作为原始来源的事实。
- Candidate 前必须能够说明相对原始资料新增的 Editorial Advantage，而不是仅复述来源。
- 固定平台 crawler/Legacy MediaCrawler 只允许作为 PlatformProvider/Adapter，不是 Acquisition Core。
- **DeepSeek Harness 作为 V1 Agent Runtime 技术基线已通过 Spike**：exact-pin pristine build、official profile/plugin activation、FastAPI concurrent boot、Harness `ctx.tools.execute()` → Editorial API 均已自动化 PASS。
- Harness 是否承担全部复杂 Radar/Programming/Performance UI，仍须通过浏览器/模型 UX Gate 决定；若 Developer Preview 扩展点无法稳定满足要求，允许采用 Hybrid Web + Harness Runtime，不允许无限阻塞 MVP。
- PostgreSQL 是 System of Record。
- WeKnora 是 Knowledge Provider，通过 Knowledge Gateway 接入。
- Evidence、Decision、Publication、Performance 的审计语义尽量继承旧版成熟原则。

## 当前允许

- PR #2 合并前仅做 Harness Spike 文档/兼容性收口；
- PR #2 合并后进入 Acquisition Provider Spike；
- Harness browser/model M1~M9 人工验证可与 Acquisition Spike 并行；
- Human Acquisition / HumanSubmission 的 Contract 与 MVP 最小接口设计；
- 为 MVP Vertical Slice 实现最小 Foundation Contracts，但不得提前把候选 Provider SDK 耦合到 Domain；
- `/healthz`、mock endpoint、Spike fixture 等验证骨架。

## 当前禁止

- 把旧 Event/Trend/Score 模型复制到新仓库后继续作为主链。
- 把固定平台每天抓 N 条作为 V1 核心发现方式。
- 把“快速升温”设成所有 Discovery 的必要条件。
- 因来源非官方就直接丢弃 Community Signal，或把社区热帖直接当作 Confirmed Fact。
- 把 HumanSubmission 直接当成用户正偏好、事实确认或已采用选题。
- 使用 `source=human` 覆盖第三方真实 Source Origin。
- 在 Provider Spike 前把 Exa/Firecrawl/Crawl4AI/MediaCrawler/Trend Provider 等具体实现锁死为不可替换基础设施。
- 为了 Full Workbench 直接 fork/魔改 DeepSeek Harness core。
- 将 Candidate/Decision/Publication 真相写到 WeKnora 或 Harness Session。
- 为了“先跑起来”跳过 provenance/versioning。

## Phase 0.5-A Harness Integration Spike — 技术结论

Pin：

```text
DeepSeek Harness commit 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
release dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

同步最新 `main` 后的 exact head：

```text
3681e4e3e5161cf6716eaf9436a1e0161d8d4681
```

自动化证据：

```text
Standard CI                                            PASS
Python Ruff / Spike API pytest                         PASS
pristine exact-pin Harness dependency install         PASS
full pinned Harness Web runtime build                 PASS
out-of-tree dsh web profile/plugin install            PASS
FastAPI + Harness Web concurrent boot                  PASS
Harness ctx.tools.execute → list Tool → FastAPI       PASS
Harness ctx.tools.execute → inspect Tool → FastAPI    PASS
Harness Tool error propagation (missing id)           PASS
```

对应 runs：

```text
Harness Spike 33725911984 / job 100554708800 : SUCCESS
CI            33725911979 / job 100554708417 : SUCCESS
```

因此 PR #2 已经真实回答：
- exact-pin Harness 可以稳定构建并启动；
- out-of-tree Profile/Plugin/Tool seam 可工作，当前无需 patch Harness core；
- Tool → FastAPI 边界可通过 Harness 自身 `ctx.tools.execute()` 运行时链路工作；
- canonical Tool value 与 UI presentation 可以分离；
- Harness 可以作为 V1 **Agent Runtime 技术基线**。

仍未允许写成 PASS：
- Agent 根据自然语言稳定选择 Editorial Tool；
- Opportunity Card 的真实浏览器信息密度与交互质量；
- `start_editorial_research` 在真实 Agent Session 下的 Job/live progress；
- durable Conversation Node 的 refresh/replay；
- error/cancel 的浏览器 UX；
- Harness 是否足以承载复杂 Radar/Programming/Performance UI。

这些人工项目决定 **Full Harness vs Hybrid**，不再阻塞 PR #2 技术 Spike 合并。

## PR #2 合并语义

```text
MERGE PR #2
≠ Full Harness Workbench approved

MERGE PR #2
= Harness Agent Runtime technical integration accepted
+ compatibility seam frozen
+ manual UI strategy gate remains open
```

## 下一 Gate：Phase 0.5-B Acquisition Provider Spike

Acquisition Spike 必须同时验证：
- high-momentum discovery；
- low/no-momentum but high-potential discovery；
- community/non-official first discovery → reliable evidence follow-up。

Spike 输出 V1 Search/Fetch/Feed/Platform/Trend Provider 组合与 fallback strategy。

HumanSubmission 不参加 Provider 胜负比较；它作为产品自身入口，在 MVP 中复用选定 Provider 做 fetch / verification / research。

Harness M1~M9 browser/model 人工验证可以与 Acquisition Spike 并行，避免 Full Workbench 决策无限阻塞 MVP。

## MVP v0.1 Gate

两个 Spike 给出足够结论后，优先做 Discovery Desk Vertical Slice，不等待完整 Phase 1→7 全部完成。

最低闭环：

```text
Machine Discovery + HumanSubmission
→ RawSignal
→ Discovery
→ Editorial Opportunity
→ Evaluation / Research
→ Adopt / Watch / Drop
```

MVP 的第一成功标准不是“功能齐全”，而是：
1. 系统能主动发现用户真实认为值得看的内容；
2. 用户能把自己刷到的一条低结构化线索交给编辑部，并得到可验证、可解释的 Opportunity；
3. 两类入口最终都能形成可追溯的 Human Decision。
