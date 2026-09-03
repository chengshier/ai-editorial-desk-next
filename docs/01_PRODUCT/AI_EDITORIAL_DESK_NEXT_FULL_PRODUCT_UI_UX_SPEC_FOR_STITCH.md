# AI Editorial Desk Next — Full Product UI/UX Design Specification for Stitch

> 用途：作为 Stitch 生成完整产品设计稿的统一输入文档。
>
> 目标：设计 AI Editorial Desk Next 的完整目标产品 UI，而不是只设计 MVP / V1 页面。
>
> 工程实现可以分阶段，但设计范围必须覆盖完整产品信息架构、跨模块流程、核心状态与配置体系。
>
> **页面编号、页面状态、Overlay 与 Stitch 生成顺序以 `UI_PAGE_STATE_AND_GENERATION_MAP.md` 为准。** 本文中的功能章节不是“一章对应一张独立页面”。例如 Opportunity Detail / Inspector、Evidence、Timeline、Human Submission 均可能是页面内部状态或 Overlay，而不是新的一级页面。

---

# 1. 产品定位

AI Editorial Desk Next 不是传统 CMS、热点榜单、舆情监控后台，也不是单纯的 AI 写稿工具。

它是一个 **Editorial Intelligence Workbench（编辑智能工作台）**：

```text
持续发现信息
→ 识别值得讲的编辑机会
→ 解释为什么值得讲
→ 研究与核验
→ 人工决定
→ 栏目与排期编排
→ 创作
→ 发布
→ 观察表现
→ 校准未来判断
```

UI 必须始终体现三件事：

```text
今天有什么值得讲？
AI 为什么这么判断？
我下一步能做什么？
```

---

# 2. 核心设计原则

## 2.1 价值优先，不做“爆款后台”

不要把 VIRAL 9.6、综合评分 92、TOP10 热榜做成产品主心智。

允许显示 Momentum / Attention，但必须与 Editorial Value 分开。

## 2.2 Opportunity 是主界面业务对象

一条 Opportunity 应优先回答：

```text
它是什么
为什么值得讲
当前 Angle 是什么
受众能得到什么
我们增加了什么编辑价值
为什么现在值得做 / 是否不急
证据是否足够
还有什么未知项
下一步建议是什么
```

## 2.3 Research 必须可观察

Research 不是一个“AI 正在思考”的 loading。

应该显示：

```text
Research Goal
已解决问题
待解决 Unknown
Source Types
关键 Claim
Supporting Evidence
Contradicting Evidence
Timeline / Provenance
Agent Task Progress
```

不展示模型隐藏推理链。

## 2.4 Human Decision 是一级行为

核心操作：

```text
Adopt / 采纳
Watch / 观察
Drop / 放弃
Archive / 归档
```

Human Decision 与算法排序分离，并可查看历史原因。

## 2.5 Adopt ≠ Draft ≠ Publication

Opportunity 页不能出现“立即发布”。

Adopt 后才进入 Programming / Draft；Draft 审核后才进入 Publication。

## 2.6 复杂信息按需展开

首屏保持轻量、清晰；Evidence、Timeline、Agent Trace 等高密度内容进入详情 / Research Focus。

## 2.7 完整产品设计，分阶段实现

设计稿应覆盖完整产品，不因为当前工程阶段较早而省略未来模块。

---

# 3. 全局信息架构

## 一级业务导航

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

## 次级管理导航

```text
采集
配置中心
系统管理
```

## 全局能力

```text
交给编辑部（Human Submission）
全局搜索
AI Agent / Harness Workspace
通知
快捷键
个人 / 团队
```

> “采集”属于管理侧，不作为日常编辑主导航中的独立第九步。进入方式与页面编号见 `UI_PAGE_STATE_AND_GENERATION_MAP.md`。

---

# 4. 全局 Shell

## 4.1 顶部栏

包含：

```text
Logo + AI Editorial Desk NEXT
一级导航
全局搜索
AI Agent 状态
通知
帮助
用户 / 编辑部
```

搜索 placeholder：

```text
搜索线索、机会、主题、人物、来源……
```

## 4.2 左侧导航

根据当前模块变化，但 Today / Opportunity 页面建议分为两个区域：

### 今日视野 / 系统视图

```text
今日主推
正在升温
值得一看
潜力发现
值得解释
实用 / 安全
故事 / 文化 / 再发现
正在研究
Evergreen
```

### 栏目 / Series

```text
每日信息差
时政与民生观察
科技解释
人物与商业
历史回响
+ 管理栏目
```

系统视图与用户栏目必须视觉分组，不能混为一类。

管理侧入口建议独立成：

```text
采集与配置
├─ 采集任务
├─ 数据源 / Provider
├─ 配置中心
└─ 系统设置
```

## 4.3 右侧 Inspector

在列表页中点击 Opportunity 后打开右侧详情，不强制跳转整页。

Inspector 顶部 Tabs：

```text
概览
证据
研究
时间线
历史
```

支持：固定、展开全屏、关闭。

**Opportunity Detail / Inspector 不是独立一级页面。** 它是 Today / Opportunities Library 中可复用的页面状态。

---

# 5. 首页：Today / Editorial Radar

## 5.1 页面目标

用户打开产品后无需先点击“抓取”，直接看到系统此前已发现的机会。

## 5.2 页面结构

顶部 Summary 区：

```text
今日主推
正在升温
值得一看
潜力发现
正在研究
```

可以是轻量统计卡，不做重 Dashboard。

中部 Opportunity Feed。

右侧 Inspector。

## 5.3 Opportunity Card

卡片字段建议：

```text
状态 / Discovery Lane
发现时间
Series / 推荐去向
Headline / Working Angle
Why worth telling
Theme / Tags
Attention / Momentum（如果有）
Evidence 数量
Unknown 数量
Integrity
Production Readiness
Editorial Advantage 简述
```

核心操作：

```text
查看详情
换个角度
继续研究
比较
采纳
观察
放弃
```

卡片不得用一个综合分作为主视觉。

## 5.4 卡片视觉优先级

一级：Headline + Why worth telling

二级：状态 + 证据 / Unknown + Readiness

三级：Trend / Series / metadata

---

# 6. Opportunity Detail / Inspector

> 本章描述 **P01 / P02 内部 Inspector 状态**，不是新的独立页面。

## 6.1 Overview

展示：

```text
Headline
Subject
Discovery Reason
Angle
Theme
Audience Promise
Why Now / Evergreen Note
Editorial Advantage
Recommended Destination
```

下方 Evaluation Overview：

```text
受众连接
新颖程度
编辑张力
Angle 强度
上下文价值
可行动性
完整性
诚信 / 风险
制作准备度
```

用等级 / 点阵 / 标签表示，不做唯一总分。

首屏不应把全部 Evaluation 维度都以等权小卡同时铺满；优先展示最关键的 4–6 项，其余进入“完整评价”。

## 6.2 Evidence Tab

采用 Claim Matrix。

状态：

```text
Confirmed
Investigating
Single Source
Disputed
False
Unknown
```

每条 Claim 显示：

```text
Claim 文本
verification state
confidence
supporting sources
contradicting sources
primary source
source role
editor note
```

## 6.3 Research Tab

展示：

```text
Research Goal
Current Status
Completed Tasks
Open Questions
Unknowns
Source Types
Research Result Summary
What changed after research
```

支持：

```text
继续研究
追加目标
取消研究
重新评价
```

## 6.4 Timeline Tab

高密度 Timeline Provenance：

```text
时间
节点
来源
Claim / 状态变化
是否官方确认
AI / Human action
```

默认产品主视觉保持浅色；高密度不等于所有信息同时展开。

## 6.5 History Tab

展示 append-only 历史：

```text
Evaluation v1
User → Watch + reason
Research Case complete
Evaluation v2
User → Adopt + reason
Draft created
Published
Performance snapshot
```

---

# 7. Research Workspace / Focus Mode

这是完整产品中的高密度专业工作区，可以明显区别于轻量 Today 页面。

## 7.1 页面职责

Research Workspace 的核心不是再次做“选题审批”，而是回答：

```text
已经知道什么？
哪些 Claim 已证实？
哪些仍在调查？
哪些存在争议或反证？
还有什么 Unknown？
事件如何演进？
Agent 当前在执行什么可观察任务？
本轮研究新增了什么？
```

## 7.2 推荐布局

```text
左 260–280px：Research Plan
中 flexible：Claim & Evidence Workspace
右 360–400px：Context Inspector
```

### 左侧

不要同时纵向堆满 Goals / Unknowns / Jobs。

优先采用：

```text
研究计划 | Unknowns | Jobs
```

或同等层级的渐进式展开。

### 中间 Claim Workspace

所有 Claim 默认使用紧凑行，只展开当前选中的一条。

```text
✓ Confirmed
◐ Investigating
! Disputed
◇ Single Source
? Unknown
× False
```

被选中的 Claim 才展开：

```text
Supporting Evidence
Contradicting Evidence
Primary Source
Notes / verification actions
```

### 右侧 Context Inspector

不要同时纵向堆满 Timeline + Sources + Materials + Agent Activity。

采用 Tabs：

```text
Timeline | Sources | Materials | Agent
```

默认只展开一个。

## 7.3 顶部信息密度

顶部只保留：

```text
← 返回机会
Opportunity 标题
研究状态 + Progress
追加研究目标
完成研究
```

Claim 状态统计放回 Claim Workspace，不要全部塞在顶栏。

## 7.4 核心模块

```text
Research Goal
Claim Verification Matrix
Source Browser
Primary Source
Contradiction Panel
Timeline Provenance
Unknown Queue
Material Availability
Risk / Copyright
Agent Activity
Research Result Diff
```

## 7.5 主操作

```text
继续研究
追加研究目标
完成研究
返回机会
```

`采纳 / 放弃 / 发布` 不应成为 Research Workspace 最强主按钮。

## 7.6 视觉风格

允许比主工作台更高密度，但保持浅色 Design System 和足够留白。专业感来自信息结构与证据关系，不来自把所有字段同时塞进一屏。

---

# 8. Opportunities Library

用于长期浏览全部 Opportunity，也是顶部“机会”的独立目标页。

## 功能

```text
多条件筛选
全文搜索
按更新时间 / 状态 / Readiness 排序
保存视图
批量加入 Watch / Archive
```

筛选维度：

```text
Discovery Lane
Series Fit
Status
Evidence State
Research State
Integrity
Production Readiness
Attention availability
Human Seed
Time range
Source type
```

列表允许：卡片视图 / 紧凑列表视图。

点击一条机会默认复用右侧 Opportunity Inspector，而不是再跳一个重复的 Opportunity Detail 独立页。

---

# 9. Programming / 编排

页面产品名统一为 **编排 / 编排看板**，不要叫“编辑看板”。

Programming 不是 TOP 榜，而是把 Candidate 放到不同 Context / Series / 日期中做人工编排。

Programming 解决的是：

```text
已经决定值得做之后
什么时候做？
放哪个栏目？
优先级是什么？
Today Main / Watch / Evergreen 如何安排？
```

## 页面子模块

```text
Candidate Pool
Today Slate
Series
Evergreen Pool
Potential Pool
Watch / Researching
Pairwise Compare
Calendar / 排期
```

## Today Slate

建议采用横向优先级板：

```text
主推
备选
观察
暂缓
```

支持拖拽，但 Human Decision / 历史必须保留。

## Series View

每个 Series 显示：

```text
Series Goal
当前供料 Missions
候选数量
近期 Adopt
近期 Published
Fit 解释
栏目健康度
```

## Pairwise Compare

左右两条 Candidate 对比：

```text
Why worth telling
Editorial Advantage
Evidence
Unknowns
Readiness
Series Fit
Timing
Risk
```

底部：

```text
今天选 A
今天选 B
都观察
继续研究
```

---

# 10. Editorial Configuration Center

完整配置规范见 `EDITORIAL_SERIES_CONFIGURATION_SPEC.md`。

主入口属于管理侧：

```text
采集与配置 / 管理
→ 配置中心
```

配置范围：

```text
栏目 Series
发现任务 Mission
评价画像 Profile / Rubric
研究策略
创作风格
Provider 策略
版本与发布
```

栏目详情采用：

```text
左：配置导航
中：结构化编辑
右：实时 Preview / 测试结果
```

必须支持：

```text
Draft
Test
Publish
Version Diff
Rollback
```

---

# 11. Human Submission — “交给编辑部”

这是全局入口，应始终容易找到。

它是 Overlay / Modal / Command Palette，不是独立主页面。

## 输入

```text
URL
Text
Question
Idea
Observation
```

示例：

```text
刚看到什么值得我们看一下？
粘贴链接、文字、问题或一个想法……
```

提交后显示真实处理状态：

```text
已收到
正在读取 / 规范化
正在查证 / 补背景
正在判断是否形成 Opportunity
```

结果可能是：

```text
形成 Opportunity
建议继续 Research
合并到已有 Opportunity
事实不成立 / 证据不足
暂时无明显编辑价值
```

---

# 12. Draft Studio / 创作

页面产品名统一为 **创作 / 创作工作室**。

只对 Adopt 后并进入制作流程的对象开放。

Programming 决定“做什么 / 放哪 / 什么时候做”；Creation 决定“内容具体怎么写、怎么改”。

## 页面结构

```text
左：Brief / Evidence / Material
中：Editor
右：AI Assistant / Citation / Version
```

## 内容阶段

```text
Brief
Outline
Draft / Script
Revision
Review
```

## 必须显示

```text
绑定的 Opportunity
绑定的 Evaluation
Evidence snapshot
Research snapshot
Citation
Risk warning
Draft version
Human / AI actor
```

AI 功能：

```text
生成 Outline
换 Hook
压缩 / 扩写
调整语气
根据 Evidence 改写
检查事实一致性
```

不能默认自动发布。

---

# 13. Publication / 发布中心

页面产品名统一为 **发布 / 发布中心**。

优先使用：

```text
发布审阅
发布队列
待发布
已排期
已发布
已退回
```

避免把“出版审阅”作为通用一级命名。

## 模块

```text
Review Queue
Publish Queue
Channel / Platform
Publication Record
Frozen Provenance
```

发布前必须展示：

```text
Draft version
Evidence snapshot
Risk / Integrity
Citation completeness
Target channel
Scheduled time
```

支持人工确认与退回修改。

---

# 14. Performance & Learning

不是传统播放量报表，而是“结果与之前判断的差异”。

## 页面

```text
内容表现
栏目表现
Angle 表现
Prediction vs Actual
Decision Review
Calibration Suggestions
```

## 核心视图

```text
当初为什么 Adopt
当初 Evaluation 如何判断
实际表现如何
哪些判断准确
哪些判断偏差
是否建议修改 Rubric / Mission / Policy
```

历史判断不被静默覆盖。

---

# 15. Knowledge

用于方法论、栏目规则、账号画像、历史案例、研究资料等长期知识。

## 页面

```text
知识首页
方法论
栏目知识
Audience Profiles
Style Guides
Historical Cases
WeKnora Provider
```

UI 以知识浏览 / 搜索为主，不做数据库管理感。

---

# 16. Acquisition / 采集任务中心

这个模块面向高级用户 / 管理者，**不作为顶部日常业务导航**。

进入路径：

```text
采集与配置 / 管理
→ 采集任务
```

Today / Radar 不要求用户先进入采集页执行抓取；采集与发现应作为后台持续能力。

## 页面

```text
Search Missions / Tasks
Feed subscriptions
Momentum / Trend Radar
Targeted Platform Research
Source Coverage
Provider Health
Coverage Gaps
```

## 核心目标

```text
系统现在在主动寻找什么？
覆盖了哪些来源？
哪些领域存在 coverage gap？
哪些 Provider 能力健康 / unavailable？
哪些任务正在运行？
```

Provider 数值不等于 Editorial Value。

---

# 17. System / Providers

管理侧页面。

显示：

```text
Provider health
Models
Budget
Risk Policy
Runtime Status
System Settings
```

密钥不得明文展示。

---

# 18. Agent / Harness Workspace

Agent / Harness 是跨产品能力，不一定作为孤立一级业务页面。

适合出现在：

```text
Research Job
Opportunity Compare
Draft Assistant
Tool / Approval Card
Session / Replay
```

业务状态必须来自 Editorial API，而不是聊天文本反解析。

---

# 19. 完整页面 / 状态关系

正式页面代码与生成规则见 `UI_PAGE_STATE_AND_GENERATION_MAP.md`。

摘要：

```text
P01 今日 / Today Radar
P02 机会 / Opportunities Library
P03 研究 / Research Workspace
P04 编排 / Programming Slate
P05 创作 / Draft Studio
P06 发布 / Publication Center
P07 表现 / Performance & Learning
P08 知识 / Knowledge Workspace

M01 采集任务中心
M02 编辑配置中心
M03 System / Providers

O01 交给编辑部
```

Opportunity Detail / Inspector、Evidence、Timeline、History、Compare 等根据上下文属于 Page State，不应机械生成成新的一级页面。

---

# 20. 视觉系统

## 主方向

```text
浅色
现代
高信息清晰度
专业编辑工具
AI 原生
非传统 ERP 后台
```

## 颜色

```text
背景：白 / 极浅灰
主色：蓝紫
Confirmed / Healthy：绿
Investigating / Attention：橙
Risk / False：红
Unknown：灰 / 中性
```

避免所有颜色同时高饱和出现。

## Typography

中文为主；英文主要作为术语辅助：

```text
为什么值得讲
受众承诺
编辑优势
研究中
证据
```

而不是大量纯英文后台字段。

## Density

不同工作区允许不同密度：

```text
Today / Opportunity：中低密度
Research：中高密度 + 渐进披露
Programming：看板 / 排期密度
Creation：大画布编辑器
Publication：审阅 / 队列密度
Performance：分析 Dashboard
Knowledge：阅读 / 浏览密度
Management：结构化配置 / 运维密度
```

专业感不等于把所有字段同时展示。

---

# 21. Stitch / 设计生成规则

**不要把本文每个编号章节理解为一张独立页面。**

设计工具必须先读取 `UI_PAGE_STATE_AND_GENERATION_MAP.md`。

每一次生成任务都必须明确：

```text
目标 Page Code
从哪个页面进入
这一张页面要回答的核心问题
必须出现的模块
哪些信息需要折叠 / Tab
主操作
禁止成为主操作的按钮
参考图 / Design System
```

例如：

```text
Generate ONLY P03 Research Workspace.
Reference P01 as the visual system.
Do not regenerate P01.
Do not generate Opportunity Inspector as another page.
Do not generate Human Submission unless O01 is requested.
```

---

# 22. 参考设计图生成顺序

建议按“独立页面 + 必要 Overlay”生成，而不是按功能章节编号生成。

## 第一批：日常核心链路

```text
P01 Today / Radar — Inspector open state
P02 Opportunities Library
P03 Research Workspace
P04 Programming / Editorial Slate
```

## 第二批：制作与结果

```text
P05 Creation / Draft Studio
P06 Publication Center
P07 Performance & Learning
P08 Knowledge Workspace
```

## 第三批：管理与配置

```text
M01 Acquisition Task Center
M02 Editorial Configuration Center
M03 System / Providers
```

## Overlay / 状态补充

```text
O01 Human Submission
P01 Compare Mode
P03 expanded disputed Claim
P04 Pairwise Compare
P05 Script mode
P06 frozen provenance / publication detail
M02 Mission Builder / Rubric Editor
```

---

# 23. Stitch 禁止事项

不要生成：

```text
深色 SOC 风格首页
VIRAL 9.6 主导布局
TOP 榜作为唯一发现机制
一个综合分决定一切
大面积密集表格后台
所有模块都套卡片
首页直接生成稿件
Opportunity 直接立即发布
所有 Research 信息同时展开
将每个功能章节机械生成成独立页面
把采集任务中心放进顶部日常业务主导航
把“编辑看板”与“编排 / 创作”并列造成语义冲突
```

不要使用：

```text
传统 ERP 蓝灰色
舆情监控大屏
纯黑赛博朋克
大量荧光渐变
过度 Glassmorphism
```

---

# 24. 最终产品感觉

设计完成后，用户应该感觉：

> “这不是一个数据后台，也不是一个自动写稿器，而是一个真正懂编辑判断、会主动找东西、会查证、会解释、会帮助我安排内容并且能够和我一起工作的 AI 编辑部。”

产品长期视觉关键词：

```text
Calm
Editorial
Intelligent
Trustworthy
Explainable
Human-in-control
Dense when needed
Quiet by default
```
