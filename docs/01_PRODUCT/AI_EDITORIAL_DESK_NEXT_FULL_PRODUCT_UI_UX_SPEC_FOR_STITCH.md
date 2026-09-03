# AI Editorial Desk Next — Full Product UI/UX Design Specification for Stitch

> 用途：作为 Stitch 生成完整产品设计稿的统一输入文档。
>
> 目标：设计 AI Editorial Desk Next 的完整目标产品 UI，而不是只设计 MVP / V1 页面。
>
> 工程实现可以分阶段，但设计范围必须覆盖完整产品信息架构、跨模块流程、核心状态与配置体系。

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

视觉可借鉴用户提供的深色高密度方案，但默认产品主视觉仍保持浅色。

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

## 页面布局建议

```text
左：Research Cases / Unknowns / Sources
中：Timeline / Evidence / Documents / Claims
右：Research Goal / Agent Progress / Actions
```

或全屏工作台。

## 核心模块

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

## 视觉风格

允许比主工作台更深、更高密度、更“指挥中心”，但保持产品设计语言一致。

---

# 8. Opportunities Library

用于长期浏览全部 Opportunity。

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

---

# 9. Programming / 编排

Programming 不是 TOP 榜，而是把 Candidate 放到不同 Context / Series / 日期中做人工编排。

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

支持拖拽，但 Human Decision /历史必须保留。

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

主入口：

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

点击后使用轻量 Modal / Command Palette，而不是传统表单。

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

只对 Adopt 后的对象开放。

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

# 13. Publication

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

支持人工确认。

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

# 16. Acquisition

这个模块面向高级用户 / 管理者，不作为产品首页。

## 页面

```text
Mission Runs
Search Coverage
Feed Sources
Platform Research
Trend Observations
Provider Health
Coverage / Failure Audit
```

展示“系统为什么看到 / 没看到”某类信息。

不要把产品退化成“微博抓取任务后台”。

---

# 17. AI Agent / Harness Workspace

Agent 是横跨产品的能力，不应只存在一个孤立“AI 页面”。

各模块都可以唤起：

```text
换 Angle
比较两个 Candidate
继续研究 Unknown
查原始来源
生成 Research Plan
根据 Evidence 修改 Draft
解释 Performance 偏差
```

如果需要独立 Harness Workspace，建议包含：

```text
Conversation
Structured Tool Cards
Research Jobs
Approval
Replay
Task History
```

---

# 18. System Management

低频管理区：

```text
Providers
Models
Budget
Risk
Audit
Users / Team
Settings
```

与普通编辑工作区明确分开。

---

# 19. 全局状态规范

任何页面必须设计：

```text
Loading
Empty
Unavailable + reason
Partial data
Error
Retry
Permission denied
Risk blocked
Stale data
Researching
Completed
Cancelled
```

关键语义：

```text
Unavailable ≠ 0
Unknown ≠ Fact
Single Source ≠ Confirmed
Human Seed ≠ Adopt
Adopt ≠ Draft
Draft ≠ Publication
```

---

# 20. 视觉语言

## 主视觉

整体推荐：Modern Clean Editorial Intelligence。

关键词：

```text
浅色
清晰
现代
专业但不过度企业后台
高可读性
信息密度可切换
少卡片堆砌
蓝紫主色
状态色克制
```

## 颜色语义

```text
Purple / Indigo：主操作 / AI / Selected
Green：Confirmed / Healthy / Ready
Orange：Investigating / Attention / Warning
Red：Integrity Risk / Blocked
Blue：Information / Research
Gray：Unavailable / Archived / Secondary
```

## 卡片

- 轻边框；
- 小圆角；
- 少阴影；
- 避免所有内容都是独立 Card；
- 允许分区线与留白组织信息。

## 字体与层级

优先中文可读性，标题和业务判断高于技术元数据。

ID、版本号、Provider 名称应弱化。

---

# 21. Stitch 设计稿生成优先级

建议按以下批次生成，每页必须单独设计，不要将多个页面拼在一张总览图中。

## 第一批：核心日常工作流

```text
1. Today / Editorial Radar
2. Opportunity Detail / Inspector
3. Research Workspace
4. Human Submission Modal
```

## 第二批：编排与配置

```text
5. Programming / Today Slate
6. Series Detail
7. Pairwise Compare
8. Editorial Configuration Center
9. Series Configuration Editor
10. Mission Builder
```

## 第三批：创作发布

```text
11. Draft Studio
12. Draft Review
13. Publication Queue
14. Publication Detail
```

## 第四批：长期闭环

```text
15. Performance Dashboard
16. Decision Review
17. Calibration Suggestions
18. Knowledge Home
19. Acquisition / Provider Health
20. System Settings
```

---

# 22. Stitch 生成时的关键约束

每一张设计稿都必须遵守：

```text
不要设计成传统 Admin Dashboard
不要以 VIRAL / 综合总分作为核心
不要把热度等于价值
不要把 AI 脚本直接放在未 Adopt Opportunity 上
不要在 Opportunity 页面出现“立即发布”
不要把 System Views 与 Series 混为一类
不要把 Provider / 爬虫任务放在首页主导航中心
不要只给 Summary，要能下钻 Evidence / Research / Timeline
不要暴露模型隐藏推理链
不要让所有页面都采用同一种三栏布局
```

必须体现：

```text
Why worth telling
Angle
Audience Promise
Editorial Advantage
Evidence / Unknown
Research
Human Decision
Programming
Version / Provenance
```

---

# 23. 推荐的总体布局关系

```text
AI Editorial Desk NEXT
│
├─ Today / Radar        ← 轻量发现与判断
├─ Opportunity          ← 业务详情
├─ Research Focus       ← 高密度事实核验
├─ Programming          ← 栏目 / 排期 / 比较
├─ Draft Studio         ← 创作
├─ Publication          ← 发布审核
├─ Performance          ← 结果与复盘
├─ Knowledge            ← 方法论 / 长期知识
│
├─ Acquisition          ← 高级采集能力管理
├─ Configuration        ← 栏目 / Mission / Rubric / Policy
└─ System               ← Provider / Model / Risk / Audit
```

最终产品应形成：

**轻量 Editorial Desk + 深度 Research Console + Programming Studio + Creation Studio + Learning Loop**。
