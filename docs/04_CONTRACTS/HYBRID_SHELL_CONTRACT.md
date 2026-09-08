# Hybrid Web Shell ↔ Harness Contract v1

> Status: Contract baseline after Harness UI Spike PR #5–#9.
>
> Architecture decision: `HYBRID_WEB_HARNESS` (ADR-0009).
>
> This contract defines product routing, ownership, stable IDs, launch/return semantics and failure boundaries. It does **not** freeze the final browser transport (iframe / reverse proxy / same-tab / separate-tab).

---

# 1. Purpose

AI Editorial Desk Next now has two UI/runtime surfaces with different responsibilities:

```text
Product Web Shell
+
Harness-powered Agent / Research Workbench
```

The goal is not to make them look like unrelated products. The goal is to keep one product information architecture while preserving Harness as an isolated Agent runtime.

This contract prevents four classes of coupling:

1. product routes depending on Harness private route/store internals;
2. business state becoming dependent on one Harness Session;
3. Shell and Harness implementing duplicate domain logic;
4. runtime IDs replacing canonical business IDs.

---

# 2. Authority and precedence

For UI page semantics, use:

`docs/01_PRODUCT/UI_PAGE_STATE_AND_GENERATION_MAP.md`

For final Full-vs-Hybrid architecture, use:

`docs/ADR/ADR-0009-hybrid-web-shell-harness.md`

For backend business semantics, existing Domain / Use Case / API Contracts remain authoritative.

If this document conflicts with Harness internal behavior, **the compatibility layer must adapt**. Domain IDs and product route semantics do not change merely because Harness internals change.

---

# 3. Ownership matrix

| Concern | Owner | Notes |
|---|---|---|
| Global product IA / router | Web Shell | Never delegated to a Harness Session |
| Today / Radar | Web Shell | P01 |
| Opportunities Library | Web Shell | P02 |
| Research product route / entry / return | Web Shell | P03 outer product surface |
| Research Agent interaction / replay | Harness | P03 inner Agent-heavy surface |
| Programming | Web Shell | P04, global business scope |
| Creation / Draft Studio | Web Shell | P05 |
| Publication | Web Shell | P06 |
| Performance & Learning | Web Shell | P07 |
| Knowledge Workspace | Web Shell | P08 |
| Acquisition / Configuration / System | Web Shell | Management pages |
| Global Opportunity Inspector | Web Shell | Reusable P01/P02 state |
| Human Submission overlay | Web Shell | Same backend HumanSubmission API as Agent entry |
| Agent Conversation | Harness | Session scoped |
| Tool / ToolView / Job / Replay | Harness | Runtime presentation |
| Research Case canonical state | Editorial API / PostgreSQL | Not Harness Session truth |
| Opportunity / Evidence / Unknown | Editorial API / PostgreSQL | Canonical business truth |
| Candidate / Programming / Decision | Editorial API / PostgreSQL | Canonical business truth |
| Draft / Publication / Performance | Editorial API / PostgreSQL | Canonical business truth |
| Shell ↔ Harness launch association | Integration layer | Runtime metadata only |

---

# 4. Product route contract

The Web Shell owns canonical product URLs.

Initial route baseline:

```text
P01  /today
P02  /opportunities
P03  /research
P03  /research/:research_case_id
P04  /programming
P05  /creation
P06  /publication
P07  /performance
P08  /knowledge

M01  /manage/acquisition
M02  /manage/configuration
M03  /manage/system
```

These routes are business/product routes. They must remain valid if the Harness version, Session ID, workspace directory or internal Web URL changes.

`/research` is the global Research Hub entry used by primary navigation and “正在研究”. It may list or resume Research Cases, but it is not itself a Research Case identity.

## 4.1 Opportunity focus state

P01/P02 may encode shareable Inspector focus as query state, for example:

```text
/today?opportunity=opp_xxx&inspector=overview
/opportunities?opportunity=opp_xxx&inspector=evidence
```

Allowed Inspector values:

```text
overview
evidence
research
timeline
history
```

The Shell resolves `opportunity_id` through Editorial API. It must not recover it by parsing Harness message text.

## 4.2 Research route

The Research navigation model has two levels:

```text
/research
/research/:research_case_id
```

`/research` is the global hub. The canonical URL for one specific Research Case uses the business Research Case ID:

```text
/research/:research_case_id
```

It does **not** use Harness Session ID as the canonical route key.

The Shell may show Harness inside this product route or launch a separate Harness surface, but the user-facing product identity remains the Research Case.

## 4.3 Agent entry

Agent / Harness is a cross-product capability, not a ninth primary workflow page.

A general Agent launch may exist as a utility action, but it must not redefine the primary IA:

```text
今日 / 机会 / 研究 / 编排 / 创作 / 发布 / 表现 / 知识
```

---

# 5. Stable identity contract

## 5.1 Canonical business IDs

Business navigation and API actions use stable backend IDs such as:

```text
opportunity_id
research_case_id
candidate_id
draft_id
publication_id
human_submission_id
```

## 5.2 Harness runtime IDs

The following are runtime/integration metadata:

```text
harness_session_id
harness_job_id
harness_workspace_id
harness_view_id
```

Rules:

- runtime IDs never replace business IDs;
- losing a runtime ID must not lose business state;
- a Research Case may be resumed in a new Harness Session;
- a Harness Session may reference more than one business object over time;
- product routes must not require Harness internals to be decoded.

## 5.3 Association semantics

The integration layer may persist a mapping such as:

```text
research_case_id ↔ harness_session_id
```

for resume convenience.

That mapping is **not canonical domain truth**. If it is absent or stale, the system may create/resume another Harness Session and rehydrate business context from Editorial API.

Deleting a Harness Session must never delete the Research Case, Evidence, Decision or Draft.

---

# 6. Shell → Harness launch contract

The Web Shell must not build Harness internal URLs or mutate private Harness stores directly.

It requests a launch descriptor from the Editorial integration boundary.

Proposed stable API seam:

```http
POST /api/v1/integrations/harness/launches
```

Conceptual request:

```json
{
  "intent": "research",
  "opportunity_id": "opp_dishwasher_water",
  "research_case_id": "rc_xxx",
  "return_path": "/opportunities?opportunity=opp_dishwasher_water&inspector=research"
}
```

Supported first-class intents:

```text
research
agent
```

Conceptual response:

```json
{
  "launch_id": "hl_xxx",
  "intent": "research",
  "opportunity_id": "opp_dishwasher_water",
  "research_case_id": "rc_xxx",
  "harness_session_id": "session-xxx",
  "surface_url": "<opaque compatibility-layer URL>",
  "return_url": "/opportunities?opportunity=opp_dishwasher_water&inspector=research",
  "transport": "embedded"
}
```

The exact response schema can gain optional presentation fields, but these invariants are fixed:

1. `surface_url` is opaque to the Shell;
2. the Shell does not parse or rewrite Harness internal routes;
3. business IDs remain explicit structured fields;
4. `return_url` points to a product route, not a Harness view id;
5. launch resolution belongs to the integration / compatibility layer.

The endpoint is a **contract target** in this documentation PR; implementation follows in a separate batch after the Shell foundation is established.

---

# 7. Harness launch context

Harness must receive enough structured context to act without asking the user to restate the whole task.

For Research intent the minimum context is:

```text
opportunity_id
research_case_id
intent = research
return_url
```

Harness then retrieves current business state through Editorial Tools / API.

Do not serialize the entire Opportunity / Evidence graph into a browser URL merely to hydrate Harness.

Do not treat the launch payload as a replacement for canonical API reads.

---

# 8. Harness → Shell return contract

The user must always have a deterministic path back to product context.

The return target is a Web Shell business URL, e.g.:

```text
/opportunities?opportunity=opp_xxx&inspector=research
```

or:

```text
/research/rc_xxx
```

If Harness is embedded, the Shell chrome may provide the return/navigation control.

If Harness is opened as a separate or same-tab surface, the Harness compatibility plugin must surface a return action based on launch context.

It must not rely on:

- `document.querySelector(...).click()`;
- private `setView()` store actions;
- hard-coded Harness DOM structure;
- message-text parsing.

---

# 9. Research workflow contract

Typical flow:

```text
P01/P02 Opportunity
→ user chooses “继续研究 / 进入研究”
→ Editorial API resolves or creates Research Case
→ Shell navigates to /research/:research_case_id
→ Shell resolves Harness launch descriptor
→ Harness opens/resumes Agent Session
→ Harness Tool / Job operates on research_case_id
→ Evidence / Unknown / Result persists in Editorial API
→ Harness presents/replays interaction
→ Shell can reload canonical Research state independently
```

The global `/research` hub may additionally list or resume Research Cases, but it never substitutes for the case-level route above.

Critical invariant:

> Harness Session replay improves continuity, but Research correctness must survive without the old Session.

---

# 10. State ownership rules

## Shell-local UI state

Examples:

```text
active primary nav
Inspector open / selected tab
filter drawer state
saved-view selection
layout width
modal open state
```

These may live in browser state / URL / Shell store.

## Backend canonical state

Examples:

```text
Opportunity
Evaluation
Evidence
Unknown
Research Case
Candidate
Programming assignment
Human Decision
Draft
Publication
Performance
```

Must come from Editorial API / PostgreSQL.

## Harness runtime state

Examples:

```text
conversation turns
Tool calls/results
runtime Job state
Session replay / trajectory
active Harness conversation view
```

Must not silently overwrite backend canonical state.

---

# 11. Data mutation rule

Web Shell and Harness are two clients of the same application boundary.

```text
Shell ───────┐
             ├─→ Editorial Intelligence API → Domain → PostgreSQL
Harness Tool ┘
```

Forbidden:

```text
Shell implements Programming rules locally
Harness plugin implements Programming rules separately
```

Allowed:

```text
Shell renders Programming UI
→ calls Programming Use Case API

Harness compares candidates
→ calls the same Programming / Compare Use Case API
```

Human Decision append-only, Evidence rules, risk policy and provenance checks remain server-side.

---

# 12. Failure semantics

## Harness unavailable

The Web Shell remains a usable product surface for canonical business state.

Required behavior:

- Today / Opportunities / Programming pages still load if Editorial API is healthy;
- Research page shows Harness/Agent surface unavailable with an explicit reason;
- previously persisted Research Result / Evidence can still be displayed from Editorial API;
- do not show `0` for unavailable runtime capability.

## Harness Session missing / incompatible

Required behavior:

- do not mark the business Research Case missing;
- resolve a new Session if possible;
- rehydrate Opportunity / Research context through Editorial API;
- retain prior business Evidence / Unknown / Result.

## Editorial API unavailable

Both Shell and Harness business actions must fail explicitly; Harness Session text is not a fallback business database.

---

# 13. Browser transport boundary

Allowed implementation transports include:

```text
same-origin reverse proxy + embedded surface
iframe-style embedded surface where security headers allow
same-tab launch
separate-tab/window launch
```

Transport selection is infrastructure / compatibility configuration.

It must not change:

- canonical product routes;
- business IDs;
- ownership matrix;
- Tool/API semantics;
- return contract.

A future Harness upgrade may change transport without a Domain migration.

---

# 14. Security and trust

- Never put provider credentials or secrets in launch URLs.
- Any opaque launch token must be short-lived / scoped if introduced.
- Browser-provided `return_path` must be validated as an allowed product path before use.
- Backend permission / risk checks remain authoritative; Harness approval UI is not authorization.
- Cross-origin embedding, if used, must define explicit CSP / frame / cookie policy rather than disabling security globally.

---

# 15. First Shell implementation sequence

After this contract is merged, implementation should proceed in separate PRs:

```text
S1  Web Shell foundation / router / design system shell
S2  P01 Today + Opportunity Inspector using Editorial API
S3  P02 Opportunities Library
S4  Harness launch adapter + /research/:research_case_id outer route
S5  Human Submission global overlay
S6  P04 Programming foundation
```

This sequence deliberately proves the Web Shell as an independent product surface before coupling it to Harness transport details.

Acquisition Provider Spike remains a separate Phase 0.5 workstream and must not be silently replaced by Shell work.

---

# 16. Acceptance invariants

A Hybrid Shell implementation is conformant only if all are true:

1. `/programming` works without selecting a Harness Session.
2. `/research` works as a global Research entry without requiring a preselected Harness Session.
3. `/research/:research_case_id` remains meaningful if the previous Harness Session is gone.
4. Shell does not import Harness internal TypeScript packages.
5. Harness plugin does not import Web Shell application code.
6. both call stable Editorial API contracts.
7. product URLs use business IDs, not only runtime IDs.
8. no DOM/private-store hack is required for cross-surface navigation.
9. canonical business state can be reconstructed independently of Harness replay.
