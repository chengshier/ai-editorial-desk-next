# Glossary

## RawSignal
连接器产生的一条不可变规范化信息。回答“当时我们实际看到了什么”。

## SubjectObservation
RawSignal 与 Subject 的显式关系。回答“这条信号提到了/描述了哪些对象”。

## Subject
长期存在的对象或认知对象。V1 类型：`EVENT, PERSON, ORGANIZATION, PRODUCT, WORK, CONCEPT, PHENOMENON, ASSERTION, PLACE, TECHNOLOGY, TOPIC`。

## Event
Subject 的一种特殊类型。Legacy `EventRecord` 可通过 adapter 映射为 `Subject(type=EVENT)`，不再是所有内容的总根。

## Discovery
为什么系统在此时注意到某个 Subject。一个 Subject 可在不同时间拥有多个 Discovery。

## Mission
系统正在寻找哪种编辑价值，例如 TREND、CURIOSITY、KNOWLEDGE、PEOPLE、VERIFICATION、CULTURE、UTILITY、REDISCOVERY。

## Trigger
这次 Discovery 被触发的原因，例如热度变化、跨源扩散、常见认知冲突、当前语境匹配、新一手资料、人工 Seed。

## Editorial Opportunity
可被编辑部判断、研究、储备、做成内容的完整编辑机会。至少包含 Subject/Discovery 上下文、Angle、Theme、Audience Promise、Why Now。

## Angle
从哪里切入；决定故事入口与 Hook。

## Theme
具体故事最终讨论的更大问题或意义。

## Audience Promise
用户花时间看完后能得到什么：知识、纠偏、行动建议、安全保护、情绪、谈资、重新理解等。

## EditorialValueEvaluation
对一个 Opportunity 在给定 EditorialProfile/Context 下的版本化价值判断；不是永恒真理，也不是单一总分。

## EditorialProfile
账号/受众/栏目策略的可配置上下文。V1 可只有 `default-general-profile`，架构上允许多 Profile。

## Research Gap
阻止当前机会可靠进入制作的缺口：事实、来源、素材、上下文、视觉、风险等。

## CandidateV2
已达到候选门槛的 Editorial Opportunity 快照。Candidate 不等于最终 Adopt。

## Editorial Programming
在 Today Main、固定栏目、Evergreen、Safety 等上下文中做组合与编排，而非单一全局排名。

## HumanDecisionV2
人工 Adopt / Watch / Drop / Archive 等 append-only 决策。
