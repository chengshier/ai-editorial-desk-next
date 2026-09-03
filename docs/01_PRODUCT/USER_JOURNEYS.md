# User Journeys v1

本文用真实使用过程约束产品，不允许后续实现退化成 CRUD 管理后台。

## Journey A — 早上打开工作台，不先“点抓取”

1. 系统夜间通过 Ambient Sensor 与 Discovery Scout 持久在线运行。
2. Feed/Search/Platform 等 Provider 产生带 provenance 的 RawSignal。
3. 系统生成 Subject / Discovery / Opportunity，并完成初步 Value Evaluation。
4. 用户早上打开 Workbench，直接看到：今日主推、值得解释、值得查证、实用/安全、故事/文化、长期储备等机会。
5. 每个 Opportunity 显示：为什么值得讲、当前 Angle、Theme、Audience Promise、主要证据、主要 Unknown、Production Readiness。
6. 用户可以直接 Adopt / Watch / Drop，或要求继续 Research。

**关键验收：**用户不需要先选择“抓 B 站/微博”才能获得今日候选。

## Journey B — 一个普通事实被转化为强 Angle

例：资料显示“洗碗机在某些条件下可能比手洗更省水”。

1. Scout 通过 Mission `common_belief_contradiction` 发现资料。
2. Subject = 洗碗机用水；Discovery = 常见节约认知与证据存在反差。
3. Editorial Agent 生成多个 Angle：纯科普、代际冲突、年度用水、时间/成本。
4. Value Evaluation 发现“代际节约观念”具有更高 Self Projection / Social Tension。
5. Opportunity 固化当前 Angle + Theme + Audience Promise，而不是只保存一句标题。
6. 用户可以要求“换一个更生活化的切口”，系统生成新 Opportunity 版本或 sibling Opportunity，并保留 provenance。

## Journey C — Research 补齐事实与可执行建议

例：用户看到“不要冲洗生鸡肉”，但认为“没告诉我应该怎么办”。

1. 用户点击/说“继续研究，补充正确处理方法”。
2. Harness 调用 `start_research(opportunity_id, goals)`。
3. Backend 创建 Research Case，并按需要调用 SearchProvider / FetchProvider / KnowledgeProvider。
4. Harness 显示结构化 Research Progress，不用纯文本模拟进度。
5. Evidence 层新增 supporting/contradicting claims 与 Unknown resolution。
6. Research 完成后自动触发或由用户触发重新 Evaluation。
7. 新 Evaluation 的 Outcome Value / Actionability 可以改变推荐去向，但不覆盖旧 Evaluation。

## Journey D — 热点不是唯一入口

1. Emerging Scout 发现某科技话题正在升温。
2. Rediscovery Scout 同时发现一部老电影因当前 AI 语境重新值得讲。
3. Utility Scout 发现一个食品安全误区。
4. 三者都可形成 Opportunity；只有第一项可能拥有 Trend Feature。
5. Candidate Programming 按 Today Main / Series / Evergreen 分别排序，而不是因为没有 Trend 就淘汰后两项。

## Journey E — 平台抓取是研究工具，不是产品入口

1. Web Search 先发现“电解质饮料是否被过度日常化”的机会。
2. Research 需要判断国内用户真实认知。
3. Research Agent 再调用 PlatformProvider 搜索知乎/B站/微博等讨论与评论。
4. 平台结果作为 Research Evidence / Audience Context 回流。
5. PlatformProvider 失败只降低对应 feature availability，不使整个 Opportunity 不可用。

## Journey F — 从 Adopt 到真实结果

1. 用户 Adopt Opportunity，并写原因。
2. Adopt 本身不自动生成稿件。
3. 用户显式要求 Draft，Draft 绑定 exact Evaluation / Evidence / Research snapshot。
4. 人工修改形成版本链。
5. 发布时冻结 Candidate、Decision、Draft、Evidence、Policy provenance。
6. Performance 以 append-only snapshot 回流。
7. Calibration 后续可以提出 rubric/policy 调整建议，但历史 Evaluation/Decision 不被改写。

## Journey G — 用户随手投喂一条线索

例：用户刷到一条 Reddit 帖子、新闻链接，或者只是想到“这个说法是真的吗？”。

1. 用户在 Workbench/Harness 里粘贴 URL 或输入一句话：“刚看到这个，帮我看看有没有值得讲的。”
2. Backend 创建 `HumanSubmission`，保存 raw input、actor、submitted_at 与 `acquisition_origin = HUMAN_SUBMISSION`。
3. 如果是第三方 URL，Source Origin 仍是原站点；系统复用 FetchProvider 读取正文。若只是用户陈述，则以 unverified human assertion 进入验证。
4. 归一化结果进入统一 RawSignal，不建立第二套 HumanSignal 模型。
5. 系统识别 Subject，生成 `Discovery(trigger=HUMAN_SEED)`，并判断是否需要 Research。
6. Research 可以补：事实来源、反方证据、背景、真实讨论、Why Now、未来回访节点。
7. 系统形成或拒绝 Editorial Opportunity，并明确说明 Editorial Advantage：相对用户原始线索新增了什么。
8. 用户再做 Adopt / Watch / Drop；Submission 本身不被当成“喜欢”或“采用”。
9. 后续 Calibration 使用 `Submission → Evaluation → Decision + reason` 完整 trajectory，而不是把所有投喂都当正样本。

**关键验收：**用户不需要先理解 Subject、Mission、Rubric 等内部字段，只需要把低结构化线索交给编辑部；系统负责验证、组织与解释。
