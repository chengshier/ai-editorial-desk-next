# AI Editorial Desk Next — UI Page / State / Overlay Map

> Status: Product UI information-architecture clarification
>
> Purpose: remove ambiguity between **independent product pages**, **page-internal states/tabs**, and **global overlays** when generating reference designs with Stitch or other design tools.
>
> This document is authoritative for page numbering and design-generation batches. If an older generation checklist treats `Opportunity Detail / Inspector`, `Evidence`, `Timeline`, `Human Submission` or similar modules as separate pages, use this document instead.

---

# 1. Why this clarification exists

The full product UI spec describes both independent pages and many page-internal modules. A design generator can incorrectly interpret every numbered functional section as a separate page.

The product must instead distinguish three concepts:

```text
P = Product Page      独立业务页面 / 独立一级工作空间
S = Page State        同一页面内部状态、Tab、展开态、对比态
O = Overlay           Modal / Drawer / Command Palette 等覆盖层
M = Management Page   管理侧页面，不进入一级日常业务工作流
```

Do not generate a new independent page merely because a module has its own functional specification section.

---

# 2. Final top-level product navigation

The primary daily editorial workflow is:

```text
今日
机会
研究
编排
创作
发布
表现
知识
```

The semantic workflow behind it is:

```text
Today / Discovery
→ Opportunity
→ Research
→ Adopt / Watch / Drop
→ Programming
→ Draft / Creation
→ Publication
→ Performance / Learning
```

Management capabilities are separated from the primary workflow:

```text
管理 / 采集与配置
├─ 采集任务
├─ 数据源 / Provider
├─ 编辑配置中心
└─ 系统设置
```

`采集任务中心` is therefore **not** a ninth daily-workflow navigation item. It is entered through the management area / “采集与配置” group.

---

# 3. Independent product pages

## P01 — Today / Editorial Radar

Purpose:

```text
今天有什么值得讲？
为什么值得我看？
下一步应该研究、比较、观察、采纳还是放弃？
```

Main structure:

```text
left: system views + Series
center: Opportunity Feed
right: lightweight Opportunity Inspector when selected
```

### P01 page states

```text
S01 default feed / no inspector focus
S02 selected Opportunity + Inspector Overview
S03 Inspector Evidence tab
S04 Inspector Research tab
S05 Inspector Timeline tab
S06 Inspector History tab
S07 Compare mode
```

**Important:** `Opportunity Detail / Inspector` is not an independent page. It is a P01 state.

### P01 overlays

```text
O01 Human Submission / 交给编辑部
O02 filter / saved view popover
O03 lightweight decision confirmation
```

---

## P02 — Opportunities Library

Purpose: browse and manage the complete long-term Opportunity corpus, not only “what matters today”.

Core capabilities:

```text
full-text search
multi-dimensional filters
saved views
status / research / evidence / readiness filters
card view / compact list view
batch Watch / Archive where appropriate
```

Opening an item should normally reuse the Opportunity Inspector pattern instead of inventing a second “Opportunity Detail page”.

---

## P03 — Research Workspace

Purpose:

```text
现在已经知道什么？
哪些 Claim 已证实？
哪些仍在调查或存在争议？
有哪些反证？
还缺什么？
事件如何演进？
Agent 正在做什么可观察的研究动作？
研究完成后新增了什么？
```

Recommended layout:

```text
left 260–280px: Research Plan
center flexible: Claim & Evidence Workspace
right 360–400px: Context Inspector
```

### Progressive disclosure rules

Do not show all information expanded simultaneously.

Left column should use compact sections / tabs:

```text
研究计划 | Unknowns | Jobs
```

Claim list rules:

```text
all Claims default to compact rows
only the currently selected Claim expands
expanded Claim may show supporting evidence + contradicting evidence
```

Right Inspector tabs:

```text
Timeline | Sources | Materials | Agent
```

Only one right-side context tab is expanded at a time.

Top header should remain light:

```text
← 返回机会
Opportunity title
研究状态 + progress
[追加研究目标] [完成研究]
```

Do not crowd the header with all Claim-state counters and all research actions.

Primary actions are research actions:

```text
继续研究
追加研究目标
完成研究
返回机会
```

`采纳 / 放弃 / 发布` must not dominate this workspace.

---

## P04 — Programming / Editorial Slate

Canonical Chinese product name: **编排** / **编排看板**.

Do not call this page “编辑看板”.

Purpose:

```text
已经决定值得做之后：
什么时候做？
放到哪个栏目？
优先级如何？
Today Main / Watch / Evergreen 如何安排？
```

Core areas:

```text
Candidate Pool
Today Main
Series
Watch
Evergreen
Potential
Calendar / scheduling
Pairwise Compare
```

Relationship:

```text
Adopted Opportunity
→ Programming
→ assigned Series / slot / priority / date
→ enter Creation
```

---

## P05 — Creation / Draft Studio

Canonical Chinese product name: **创作** / **创作工作室**.

This is the page containing:

```text
Brief
大纲
稿件
脚本
版本
Citation / 引用
Evidence snapshot
Materials
AI editing assistance
```

It must be visually and semantically distinct from Programming.

Programming decides **what / where / when to make**.

Creation decides **how the actual content is written and revised**.

---

## P06 — Publication Center

Canonical Chinese product name: **发布** / **发布中心**.

Prefer product wording:

```text
发布审阅
发布队列
待发布
已排期
已发布
已退回
```

Avoid making “出版审阅” the universal label because the product is not limited to publishing-house workflows.

Core responsibilities:

```text
final review
channel selection
frozen evidence / provenance snapshot
schedule
publication record
return for revision
```

---

## P07 — Performance & Learning

Purpose: compare editorial judgement with actual outcomes and improve future decisions.

Core areas:

```text
content performance
Series performance
Angle performance
Prediction vs Actual
Decision Review
Learning Suggestions
Calibration
```

It must not silently rewrite historical Evaluation / Human Decision.

---

## P08 — Knowledge Workspace

Purpose: persistent editorial knowledge, methodology and reusable context.

Core spaces:

```text
方法论
栏目知识
Audience Profile
Style Guide
Historical Cases
Knowledge Search / WeKnora
```

---

# 4. Management pages

Management pages use the same design system but are not part of the main daily workflow navigation.

## M01 — Acquisition Task Center

Entry:

```text
采集与配置 / 管理
→ 采集任务
```

or via a management menu from the global shell.

Purpose:

```text
Search Missions / acquisition tasks
Feed subscriptions
Momentum / Trend observation
Targeted Platform Research
source coverage
Provider health
coverage gaps
```

This page is for advanced users / operators. Today/Radar must not require the user to visit it before opportunities appear.

---

## M02 — Editorial Configuration Center

Entry:

```text
采集与配置 / 管理
→ 配置中心
```

Covers:

```text
Series
Discovery Mission
Editorial Profile
Rubric
Research Policy
Draft Style
Provider Strategy
Version / Test / Publish / Rollback
```

See `EDITORIAL_SERIES_CONFIGURATION_SPEC.md` for domain semantics.

---

## M03 — System / Providers

Purpose:

```text
provider credentials / health (without leaking secrets)
models
budget
risk policy
runtime status
system settings
```

Do not mix this information into editorial opportunity cards.

---

# 5. Global overlays and capabilities

These are not separate top-level pages by default.

## O01 — Human Submission / 交给编辑部

Global low-friction overlay.

Inputs:

```text
URL
Text
Question
Idea
Observation
```

It can be opened from every major editorial workspace.

## Opportunity Inspector

Reusable right-side Inspector used in P01 and P02, and optionally as context in other pages.

Tabs:

```text
Overview
Evidence
Research
Timeline
History
```

Do not generate every Inspector tab as a separate full product page.

## Agent / Harness

Agent capability is cross-product infrastructure, not necessarily one isolated “AI page”.

It may appear as:

```text
research job activity
comparison assistant
creation assistant
tool / approval card
session / replay context
```

---

# 6. Visual hierarchy and density rules

## 6.1 Main workbench

Use the established light product language:

```text
white / very light gray canvas
blue-purple primary accent
soft semantic green / amber / red only for states
clear Chinese-first typography
moderate radius and thin borders
limited shadows
```

Do not redesign the global shell independently for every page.

## 6.2 Density by workspace

```text
Today / Opportunity      medium-light density
Research                 medium-high density with progressive disclosure
Programming              board / slate density
Creation                 editor-centric, large writing canvas
Publication              review / queue density
Performance              analytical dashboard density
Knowledge                browsing / reading density
Management               structured configuration / operations density
```

“More professional” must not mean “show every field at the same time”.

## 6.3 Metadata hierarchy

Primary:

```text
editorial meaning
headline / angle
why worth telling
current action / state
```

Secondary:

```text
evidence / unknown / readiness / Series fit
```

Tertiary:

```text
internal IDs
hashes
provider implementation names
model versions
latency
```

Technical metadata should be available but visually quiet.

---

# 7. Design-generation rules for Stitch / image tools

Do not hand the complete specification to the generator and ask it to decide which “numbered section” is a page.

Each generation task must explicitly declare one target:

```text
Generate ONLY P03 Research Workspace.
Reference P01 image as the visual design system.
Do not generate P01 again.
Do not generate Inspector as a separate page.
Do not generate Human Submission unless O01 is specifically requested.
```

For every generation prompt specify:

```text
Target page code
Entry point from previous page
Primary user question
Required modules
What must stay collapsed / tabbed
Primary actions
What must NOT appear as a dominant action
Reference image / visual system
```

---

# 8. Recommended reference-design set

The minimum complete visual reference set should be generated as:

```text
P01 Today / Radar — Inspector open state
P02 Opportunities Library
P03 Research Workspace
P04 Programming / Editorial Slate
P05 Creation / Draft Studio
P06 Publication Center
P07 Performance & Learning
P08 Knowledge Workspace
M01 Acquisition Task Center
M02 Editorial Configuration Center
O01 Human Submission Overlay
```

Optional later states:

```text
P01 Compare Mode
P03 expanded disputed Claim state
P04 Pairwise Compare
P05 Script mode
P06 Publication Detail / frozen provenance
M02 Mission Builder / Rubric Editor
M03 System / Providers
```

---

# 9. Naming invariants

Use these product labels consistently:

```text
Today / Radar                 今日
Opportunities                 机会
Research                      研究
Programming                   编排
Creation / Draft Studio       创作
Publication                   发布
Performance & Learning        表现
Knowledge                     知识
Acquisition                   采集（管理侧）
Editorial Configuration       配置中心（管理侧）
```

Do not use “编辑” as a parallel top-level module competing with 编排 / 创作.

“编辑部” remains valid as the product/team metaphor:

```text
AI Editorial Desk
交给编辑部
编辑部建议
责任编辑
```

but not as an ambiguous workflow-stage name.

---

# 10. Current design correction summary

The current reference design direction is retained, with these corrections:

1. P01 Today remains the visual baseline.
2. Opportunity Detail is a P01/P02 Inspector state, not a separate page.
3. Add a true P02 Opportunities Library reference design.
4. Research is redesigned with more whitespace and progressive disclosure.
5. Rename “编辑看板” to P04 **编排看板**.
6. Treat the existing draft/editor reference as P05 **创作工作室**.
7. Treat the existing review/queue reference as P06 **发布中心**.
8. Acquisition Task Center moves to M01 management space and receives an explicit entry path.
9. Human Submission remains O01 global overlay.
10. Future design generation must follow page/state/overlay codes rather than functional-section numbering.
