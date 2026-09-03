# AI Editorial Desk Next — Editorial Series & Configuration Center 设计补充

> 文档定位：补充现有产品规划中“Series / Programming Context / Mission / Evaluation Profile / Agent Policy”的可配置产品能力。
>
> 目标：让栏目、发现任务、评估偏好、研究策略、创作风格和 Provider 策略可以被产品化管理，而不是前端写死或每新增栏目都修改代码。
>
> 注意：本文描述的是完整目标产品能力，不等于当前仓库已经实现这些 CRUD/API/UI。

---

## 1. 为什么必须补充配置中心

现有架构已经明确支持：

- Mission-driven Discovery；
- Editorial Opportunity；
- Editorial Value Evaluation；
- Candidate / Programming；
- Series / Mission-specific Pool；
- Research / Evidence / Human Decision；
- Prompt / Policy / Rubric / Schema 版本化。

但当前仍缺一个面向产品使用者的“配置层”来回答：

1. 一个栏目是什么；
2. 这个栏目希望系统主动找什么；
3. 什么样的 Opportunity 更适合这个栏目；
4. 缺什么证据时应该继续研究；
5. Adopt 后希望如何进入创作；
6. 哪些 Search / Feed / Platform / Trend Provider 可以参与；
7. 配置变更如何版本化、测试、发布与回滚。

因此建议正式新增：

**Editorial Configuration Center（编辑配置中心）**。

---

## 2. 必须分开的六个配置对象

### 2.1 Series（栏目 / 专栏）

Series 负责“内容最终如何被组织、呈现和长期运营”。

示例：

- 每日信息差
- 时政与民生观察
- 科技解释
- 人物与商业
- 历史回响
- 长期知识型栏目

Series 不负责直接决定事实真假，也不等于 Discovery Mission。

建议字段：

```text
series_id
name
slug
description
editorial_goal
target_audience
content_formats
cadence
status
icon
color_token
owner
created_at
updated_at
current_version
```

### 2.2 Discovery Mission（发现任务）

Mission 负责“系统主动寻找什么”。

一个 Series 可以绑定多个 Mission；一个 Mission 也可以给多个 Series 供料。

示例：

```text
Mission: 当日反常事件
Mission: 新规正式生效
Mission: 海外已热国内未热
Mission: 常见认知与证据冲突
Mission: 老内容在新语境下重新值得讲
Mission: 消费安全 / 诈骗 / 食品安全
```

建议配置项：

```text
mission_id
name
description
discovery_lane
query_strategy
keywords / entities / exclusions
language / region
recency preference
source preferences
source exclusions
budget policy
schedule / cadence
enabled providers
fallback strategy
status
version
```

### 2.3 Editorial Profile / Rubric（编辑评价画像）

负责定义“什么样的内容对这个栏目更有价值”。

不建议退化成单一权重总分，而是保持多维评价，例如：

```text
intrinsic
audience_connection
editorial_tension
angle_strength
context_value
outcome_value
execution
integrity
```

每个维度允许定义：

```text
priority: HIGH / MEDIUM / LOW
minimum expectation
positive signals
negative signals
hard risk rules
explanation guidance
```

UI 中可以表现“本栏目更看重什么”，但不强制显示一个 0–100 总分。

### 2.4 Research Policy（研究策略）

负责定义“什么时候需要继续研究、优先补什么”。

示例：

```text
事实确认缺口
原始来源缺失
反方证据缺失
图片 / 视频素材缺失
版权风险
人物背景不足
本地语境不足
趋势原因不明确
官方文件未找到
```

配置项：

```text
auto_suggest_research_conditions
required_claim_types
preferred_source_roles
minimum_primary_source_expectation
contradiction_check
material_availability_check
risk_gate
max_research_budget
research_timeout
```

### 2.5 Draft / Style Policy（创作与风格策略）

只在 Adopt 之后参与 Draft 阶段，不应该影响前面的事实判断。

可配置：

```text
preferred_format
length range
voice / tone
structure guidance
hook style
citation density
visual material preference
banned expressions
platform-specific constraints
```

### 2.6 Provider Strategy（数据与工具能力策略）

栏目不需要直接绑定“微博爬虫”等具体实现，而应绑定“能力”。

例如：

```text
Search capability
Fetch capability
Feed capability
Community research capability
Platform metrics capability
Trend capability
Knowledge capability
```

Provider Strategy 负责：

```text
primary provider
fallback provider
budget
rate limit
region/language preference
provider capability requirement
failure behavior
```

---

## 3. Series Fit 的正确产品语义

Series Fit 不应该表示“系统把一条内容唯一分类到某个栏目”。

正确语义是：

> 同一个 Candidate / Opportunity 可以同时适配多个 Series，每个 Series 下拥有独立的适配理由和 Programming 优先级。

示例：

```text
某城市户外直播管理新规

每日信息差        HIGH
时政与民生观察    HIGH
平台社会观察      MEDIUM
长期解释型内容    LOW
```

Series Fit 至少应返回：

```text
series_id
fit_level
confidence
reason
supporting evaluation refs
recommended_context
calculated_at
policy_version
```

不得只输出一个不可解释的“栏目分 92”。

---

## 4. Programming Context 与 Series 的关系

以下内容属于系统视图 / Programming Context，不应默认等同于用户自定义栏目：

```text
Today Main
Momentum / Current
Potential / Worth a Look
Explain / Curiosity
Utility / Safety
Story / Culture / Rediscovery
Researching / Watch
Evergreen
```

左侧导航应明确分区：

```text
今日视野 / System Views
- 今日主推
- 正在升温
- 值得一看
- 潜力发现
- 值得解释
- 实用 / 安全
- 正在研究
- Evergreen

栏目 / Series
- 每日信息差
- 时政与民生观察
- 科技解释
- 人物与商业
- 历史回响
- + 管理栏目
```

这样避免把“正在升温”错误理解成一个永久栏目。

---

## 5. Configuration Center 页面结构

### 5.1 配置中心首页

展示：

```text
栏目 Series
发现任务 Missions
评价画像 Profiles
研究策略 Research Policies
创作风格 Draft Styles
Provider Strategies
版本与发布
```

每种对象显示：

- 当前启用数量；
- Draft / Published / Deprecated 数量；
- 最近变更；
- 依赖关系；
- 健康状态。

### 5.2 栏目详情编辑器

建议采用“左侧配置导航 + 中间表单 + 右侧实时预览”的布局。

页签：

```text
基本信息
供料 Mission
评价偏好
研究策略
创作策略
Provider 策略
导航与展示
版本 / 历史
```

右侧 Preview 至少支持：

- 左侧导航中的显示效果；
- Opportunity Card 样例；
- Series Fit 解释；
- 默认筛选与排序；
- Draft / Style 示例。

### 5.3 Mission Builder

不建议做“纯关键词配置器”。

应该允许两种模式：

**Basic**

```text
任务名称
想找什么
不想找什么
区域 / 语言
时效偏好
来源偏好
运行频率
```

**Advanced**

```text
Query Strategy
Prompt / Agent Instruction
Provider capability
Budget
Fallback
Discovery Lane
Version
```

### 5.4 Evaluation Profile 编辑器

采用维度卡片，而不是传统百分比滑块总分。

示例：

```text
受众连接        高优先级
编辑张力        高优先级
Angle 强度      高优先级
完整性          必须达标
时效性          中优先级
执行难度        中优先级
```

每个维度可展开设置：

```text
看什么信号
什么情况加分
什么情况减弱推荐
什么情况必须 Research
什么情况必须阻止 Adopt
```

---

## 6. 配置生命周期

配置不能“保存后立即静默生效”。

建议状态：

```text
DRAFT
TESTING
PUBLISHED
DEPRECATED
ARCHIVED
```

发布流程：

```text
编辑配置
→ 保存 Draft
→ 运行样例测试
→ 对比旧版本
→ 发布
→ 新任务使用新版本
→ 历史 Opportunity 保留旧版本 provenance
```

必须支持：

- 版本号；
- change note；
- actor；
- published_at；
- rollback；
- test fixtures；
- impact preview。

---

## 7. 配置测试与模拟

配置中心必须有“试运行”能力。

输入可以是：

```text
一条 URL
一段文字
一个历史 Opportunity
一组历史 Candidate
```

系统返回：

```text
Mission 是否会命中
会生成什么 Discovery Reason
Evaluation Profile 如何判断
Research Policy 会补什么
适配哪些 Series
推荐 Programming Context
```

测试结果不能写入正式业务历史，除非用户明确“保存为真实对象”。

---

## 8. 权限与高级能力

建议区分：

```text
Editor
Series Owner
Configuration Admin
System Admin
```

普通 Editor 可以使用栏目和提交反馈，但不直接修改生产 Rubric / Prompt / Provider 策略。

---

## 9. 前端设计要求

配置中心视觉风格可以比 Editorial Workbench 更“工具化”，但仍应避免传统后台式密集表格。

推荐：

- 清晰的对象卡片；
- 左侧配置树；
- 中间结构化编辑；
- 右侧实时 Preview；
- 版本差异对比；
- 测试运行结果；
- 依赖关系图；
- 发布确认。

不推荐：

- 所有设置塞进一页；
- 直接暴露数据库字段；
- Prompt 与业务规则混成一个大文本框；
- 只靠百分比权重控制一切；
- 保存即覆盖历史版本。

---

## 10. 与完整产品 UI 的关系

Editorial Configuration Center 属于完整产品中的“管理 / 策略层”，不是普通编辑每天打开的首页。

推荐入口：

```text
主导航
今日 / 机会 / 研究 / 编排 / 创作 / 发布 / 表现 / 知识

次级管理区
采集 / 配置中心 / 系统管理
```

普通编辑最常用的是 Today / Opportunity / Research / Programming；只有需要调整栏目或系统策略时才进入配置中心。
