# Phase 0.5-B E — Multi-channel Corpus Correction

## 状态

`IN_PROGRESS / CORPUS_CORRECTION`

本补充用于修正 Human Editorial Acceptance 的样本代表性问题。当前 D2-B Potential 样本能够验证 Search/Fetch 和 science/knowledge explainer，但不能代表 AI Editorial Desk Next 的完整多栏目目标。

## 1. 产品事实

AI Editorial Desk Next 是多栏目编辑部，不是单一“严谨科普频道”。现有产品规范已经把以下对象分开：

```text
Discovery Lane
→ 为什么系统发现它：ambient / potential / momentum / community / research

Series
→ 最终在哪个长期栏目中运营

Editorial Profile / Rubric
→ 这个栏目更看重什么

Research Policy
→ 缺什么证据、何时继续补证

Draft / Style Policy
→ Adopt 后如何表达、什么语气、什么长度、什么 Hook

Provider Strategy
→ Search / Fetch / Feed / Platform / Trend 等能力由谁提供
```

同一 Opportunity 可以同时适配多个 Series，不应被唯一分类。

## 2. 当前两类真实风格

### A. 深度解释 / 严谨科普

代表当前 D2-B Potential 样本：

- 科学共识与错误认知；
- 日常现象解释；
- AI 辅助诈骗机制；
- 低频 Hum / 耳鸣研究；
- 先入为主如何压过证据质量。

典型生产方式：

```text
问题 / 反常识点
→ 多来源研究
→ Primary / Evidence
→ 机制解释
→ 限定条件 / 反例
→ 深度成稿
```

### B. 信息差 / 社会反差 / 快节奏栏目

参考人工提供的短视频与示例素材：

- 社会生活小事件；
- 反转 / 澄清 / 辟谣；
- 惊险但有结果的人物事件；
- 治愈 / 考古 / 童年照进现实；
- 诈骗 / 风险提醒；
- 娱乐人物回应；
- 神评论 / 社会反应；
- 可直接使用的截图、通报、现场素材。

典型生产方式：

```text
一句强 Hook
→ 发生了什么
→ 反差 / 反转 / 信息差
→ 核心事实链
→ 社会反应 / 评论
→ 一句编辑点评或梗
→ 快速进入下一条
```

A 与 B 都属于编辑部目标，不应互相替代。

## 3. 对外部诊断建议的事实校正

### 3.1 “Firecrawl 把系统带偏到学术站”——不准确

D2-B 中的职责是：

```text
Exa Search
→ 发现候选 URL

Firecrawl Fetch
→ 读取 Exa 已发现 URL 的正文
```

因此 `phase-0.5b-d2b-firecrawl` 标签只能说明该样本经过 Firecrawl Fetch，不说明 Firecrawl 决定了选题来源。

当前样本偏严谨，主要来自：

1. D2-B 只挑了 4 个 Potential Mission 做 bounded comparison；
2. Query Seed 为英文；
3. `common-belief-contradiction` / `everyday-why` 等 Mission 本身偏解释型；
4. Source preferences 中存在 research / professional-media / official；
5. 当前 Spike 尚未真实接入足够丰富的平台 / 本地社会 / 评论 / 热榜数据。

### 3.2 “Mission Prompt 强制提取实验与科学依据”——仓库事实不支持

现有 Mission 是结构化 objective / query seeds / source preferences / required source roles；并不存在一个全局 Prompt 要求“只提取实验结果和学术报告”。

完整 Mission corpus 已经包含 human story、culture discovery、rediscovery、open curiosity、community acceleration、cross-platform spread 等方向。

问题是当前真实 benchmark 没有把这些方向都跑进 Human Acceptance，而不是架构只支持科学内容。

### 3.3 “Evidence Rigor / Academic Depth 权重点满，改成 Drama 40% + Hook 30% + Comments 30%”——仓库事实不支持，也不应作为全局模型

当前 Value Evaluation Contract 的维度是：

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

仓库没有 `Academic Depth` 字段，也没有上述固定百分比。

Series Configuration Spec 还明确建议：

- 不退化成一个单一权重总分；
- 不同 Series 使用自己的 Evaluation Profile；
- Hook / tone / length 属于 Adopt 后的 Draft / Style Policy，不能反向污染事实判断。

因此短视频栏目应该拥有自己的 Series Profile，但不应该把全局 Editorial Value 改成“情绪 40%”。

## 4. 正确修正方向

不是把系统从“严谨科普”整体改成“社会爽文”，而是补全多栏目矩阵。

建议至少验证以下 Series / Editorial Modes：

```text
Series: 每日信息差
Modes: FAST_INFO_GAP / REVERSAL / CLARIFICATION / SOCIAL_ODDITY / CULTURE_RESPONSE

Series: 深度解释
Modes: DEEP_EXPLAINER / EVERYDAY_WHY / SCIENCE_EXPLAINER / CONTEXT_EXPLAINER

Series: 实用与风险
Modes: SCAM_WARNING / CONSUMER_SAFETY / POLICY_IMPACT

Series: 人物与文化
Modes: HUMAN_STORY / HEALING / REDISCOVERY / ENTERTAINMENT_RESPONSE
```

这些 Series 可以共享同一 Opportunity。例如“AI 高管冒充诈骗”可以同时适配：

```text
每日信息差        HIGH
实用与风险        HIGH
深度解释          MEDIUM
```

## 5. 数据源层应如何补

需要补的是 Platform / Community / Trend Discovery Coverage，而不是废弃 Search / Fetch。

```text
平台 / 热榜 / 社区
→ 发现社会事件、讨论、评论、反转信号、人物回应

Search
→ 横向找报道、背景、跨平台传播

Fetch
→ 读取明确 URL 的正文、官方通报、Primary Source

Trend
→ 记录注意力变化

Research
→ 把 Discovery Signal 追到可验证 Evidence
```

评论、截图、现场图、官方通报应分别进入 AudienceSignal / MaterialSource / PrimarySource / EvidenceSource 等角色，不应全部塞进 Mission Prompt。

## 6. Phase 0.5-B-E Gate 修正

在进入 0.5B-F Provider Decision 前，Human Acceptance corpus 必须同时包含：

- 深度解释 / 严谨科普；
- 信息差 / 反转 / 澄清；
- 社会生活小事件；
- 实用 / 风险；
- 人物 / 文化 / 治愈；
- Community-first；
- Momentum；
- 负样本 / 对照样本。

否则只能得出“某 Provider 对解释型英文 Web Search 表现如何”，不能得出 V1 编辑部的最终 Provider 组合。

## 7. 下一步

1. 保留当前 D2-B 作为深度解释型 benchmark；
2. 新增一组 multi-channel acceptance fixtures / missions，优先覆盖“每日信息差”和“人物 / 社会 / 文化”；
3. 再评估是否需要新增 PlatformProvider / 社交趋势来源；
4. 完成代表性更完整的 Human Acceptance 后，再做 Provider Decision + ADR。
