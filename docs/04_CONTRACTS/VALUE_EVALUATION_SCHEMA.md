# Editorial Value Evaluation Contract — Draft

此文档冻结语义，不代表数据库字段已经最终确定。

```json
{
  "opportunity_id": "uuid",
  "editorial_profile_id": "default-general-profile",
  "evaluation_version": "editorial-evaluation-v1",
  "rubric_version": "editorial-value-rubric-v1",
  "policy_version": "editorial-policy-v1",
  "schema_version": "editorial-value-schema-v1",
  "context_snapshot": {},
  "objective_features": {},
  "value_profile": {
    "intrinsic": {},
    "audience_connection": {},
    "editorial_tension": {},
    "angle_strength": {},
    "context_value": {},
    "outcome_value": {},
    "execution": {},
    "integrity": {}
  },
  "strengths": [],
  "weaknesses": [],
  "research_gaps": [],
  "recommended_action": "RESEARCH_REQUIRED",
  "confidence": "MEDIUM",
  "provenance": {
    "ai_invocation_id": null,
    "input_hash": "sha256"
  }
}
```

维度项建议形态：

```json
{
  "level": "HIGH",
  "confidence": "MEDIUM",
  "reason": "...",
  "evidence_refs": ["..."]
}
```

禁止：缺少依据时自动填 0；模型无法判断时应为 unavailable/unknown，并附原因。
