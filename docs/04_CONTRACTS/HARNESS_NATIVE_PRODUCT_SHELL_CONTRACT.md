# Harness-native Product Shell Contract v1

> Status: Active Contract
>
> Architecture decision: `HARNESS_NATIVE_EDITORIAL_PRODUCT_SHELL` (ADR-0010).
>
> This contract supersedes the active use of `HYBRID_SHELL_CONTRACT.md`. The old Hybrid contract remains historical evidence only.

---

# 1. Purpose

AI Editorial Desk Next uses one Harness Web runtime with two first-class user surfaces:

```text
DeepSeek Harness Web
├─ AI Editorial Desk Product Shell
└─ stock Harness workbench
```

The Product Shell is an out-of-tree plugin. It must not fork or patch Harness upstream core.

The contract prevents four classes of coupling:

1. canonical business state depending on one Harness Session;
2. Product Shell depending on Harness private routes, stores or DOM structure;
3. runtime IDs replacing business IDs;
4. business rules being duplicated between Product Shell, Harness tools and backend.

---

# 2. Authority and precedence

Use these documents in order:

1. `docs/CURRENT_STATE.md`
2. `docs/ADR/ADR-0010-harness-native-product-shell.md`
3. this contract
4. `docs/03_ARCHITECTURE/HARNESS_INTEGRATION.md`
5. `docs/03_ARCHITECTURE/HARNESS_RUNTIME_TOPOLOGY.md`
6. Domain / Use Case / API Contracts

`docs/ADR/ADR-0009-hybrid-web-shell-harness.md` and `docs/04_CONTRACTS/HYBRID_SHELL_CONTRACT.md` are superseded historical artifacts.

---

# 3. Ownership matrix

| Concern | Owner | Notes |
|---|---|---|
| Global product IA / primary navigation | AI Editorial Desk Product Shell | Runs inside Harness Web via public root Slot seam |
| Today / Radar | Product Shell | Cross-Session business scope |
| Opportunities Library | Product Shell | Cross-Session business scope |
| Opportunity Inspector | Product Shell | Reusable business UI state |
| Research business entry / status | Product Shell | Canonical Research Case is backend-owned |
| Research Agent / Tool / Replay | Harness Runtime | Session-scoped runtime interaction |
| Programming / Creation / Publication | Product Shell | Must not depend on active Harness Session |
| Performance / Knowledge / Management | Product Shell | Cross-Session product modules |
| Human Submission / Global Search | Product Shell | Backend use cases remain canonical |
| stock Agent Conversation | stock Harness workbench | Free Agent / Session mode |
| Tool / ToolView / Job / Replay | Harness Runtime | Runtime presentation and execution |
| Subject / Discovery / Opportunity | Editorial API / PostgreSQL | Canonical business truth |
| Evidence / Unknown / Research Case | Editorial API / PostgreSQL | Canonical business truth |
| Candidate / Programming / Decision | Editorial API / PostgreSQL | Canonical business truth |
| Draft / Publication / Performance | Editorial API / PostgreSQL | Canonical business truth |
| Research Case ↔ Session mapping | Integration layer | Runtime metadata only |

---

# 4. Product Shell hosting contract

Formal package:

```text
integrations/harness/editorial-shell-package
@ai-editorial-desk/harness-editorial-shell
```

In editorial mode the plugin may replace the stock root AppFrame through the pinned public Slot contract. In Harness mode the stock AppFrame remains untouched.

The Product Shell must not use:

- iframe embedding as its normal host;
- `surface_url` launch descriptors as the Product UI transport;
- `editorial_embed` / `editorial_launch` URL host parameters;
- `document.querySelector(...).click()` navigation hacks;
- private Harness store actions;
- upstream core patches.

The Product Shell and stock Harness workbench must remain switchable without losing canonical business state.

---

# 5. Product state contract

Product Shell state is namespaced from Harness state.

Current browser state convention:

```text
ed_section
ed_* product filters / inspector / layout state
```

Business IDs may appear in Product state, but Harness Session IDs must never become the only product identity.

Examples of canonical IDs:

```text
opportunity_id
research_case_id
candidate_id
draft_id
publication_id
human_submission_id
```

Runtime metadata:

```text
harness_session_id
harness_job_id
harness_workspace_id
```

Rules:

- losing a runtime ID must not delete business state;
- changing active Harness Session must not change the selected canonical business object silently;
- Product Shell refresh must be able to reconstruct business context from Editorial API;
- Session text is not a fallback business database.

---

# 6. Workbench switching contract

There are two deliberate modes:

```text
Editorial Product Shell
↔
stock Harness workbench
```

The switch must use public plugin/slot/runtime seams. It may change UI mode, but it must not mutate canonical business state simply because the user entered or left the stock workbench.

The stock workbench remains the unrestricted Agent / Session surface. The Product Shell remains the structured editorial workflow surface.

---

# 7. Research Runtime Adapter contract

Canonical Research identity:

```text
research_case_id
```

Runtime binding API:

```http
GET  /api/v1/integrations/harness/runtime/research/{research_case_id}
POST /api/v1/integrations/harness/runtime/research/{research_case_id}/session
POST /api/v1/integrations/harness/runtime/research/{research_case_id}/bootstrap-complete
```

Required flow:

```text
Product Shell
→ resolve canonical Research Case
→ get runtime binding
→ reuse bound Harness Session when available
→ otherwise obtain/create a valid Session
→ bind/rebind Session to Research Case
→ drive Agent via public Session.prompt()
→ call get_editorial_research_result
→ wait for durable structured Tool Result
→ mark bootstrap complete
```

The adapter may not create a second Research Case merely because a Harness Session is missing.

---

# 8. Fresh profile bootstrap contract

A completely fresh Harness profile may contain no Workspace.

Product Shell must still be able to start Research without requiring the user to visit stock Harness first.

Current allowed bootstrap uses only pinned public `IWorkspaces` outward methods:

```text
listDirectory()
createDirectory()
create({ path })
connectWorkspace()
```

The integration owns a dedicated runtime directory name:

```text
ai-editorial-desk-runtime
```

Rules:

1. never manufacture an unknown host path in the browser;
2. ask the Host for the home directory through public API;
3. create/reuse the runtime directory idempotently;
4. register/reuse the Workspace through public API;
5. connect/create Session only after Workspace exists;
6. no manual user setup is required for this technical runtime Workspace.

---

# 9. Research result / replay contract

Harness Session log may contain durable Tool Result metadata used for replay and continuity.

That replay data is not the canonical Research Case database.

Required invariant:

> Research correctness must survive the loss of the old Harness Session.

If a Session disappears:

```text
Research Case remains
→ new Session may be created
→ binding is updated
→ canonical result is rehydrated through Editorial API / Tool
→ durable runtime replay can be rebuilt
```

`bootstrap_complete` is valid only after the corresponding durable structured Tool Result exists in the Session.

---

# 10. Business action execution contract

Standard Product actions must not require a human to enter stock Harness Chat and type a prompt.

Allowed execution paths:

```text
Manual Product Command
Schedule
Event
        │
        ▼
Editorial Scheduler / Orchestrator
        │
        ├─ Harness Runtime Adapter
        ├─ Harness SDK
        └─ JSON-RPC / headless seam
        │
        ▼
Agent / Tool / Job
        │
        ▼
Editorial API / PostgreSQL
```

S4-N4 implements this orchestration layer.

---

# 11. Failure semantics

## Harness unavailable

- Product business objects remain intact;
- Product Shell must show explicit Runtime unavailable/error state;
- persisted backend results may still be displayed;
- do not convert unavailable runtime capability to a fake zero/empty success.

## Session missing / incompatible

- do not mark Research Case missing;
- create/reuse another Session through public outward API;
- rebind runtime metadata;
- rehydrate business context from Editorial API.

## Workspace missing

- bootstrap the dedicated runtime Workspace through public `IWorkspaces` API;
- do not ask the user to prepare stock Harness manually as a normal product prerequisite.

## Editorial API unavailable

- Product and Agent business actions fail explicitly;
- Harness Session text is not canonical fallback storage.

---

# 12. Security / trust

- Provider credentials never enter Product browser state or business IDs.
- Backend authorization/risk policy remains authoritative.
- Harness approval UI does not replace server-side permission checks.
- Product Shell plugin must not bypass Editorial API to write PostgreSQL directly.
- Runtime bootstrap may create only its intended dedicated Host directory / Workspace through the public Host contract.

---

# 13. Compatibility contract

Pinned baseline:

```text
DeepSeek Harness commit 99f6f02fecdb7dff40c3fbc9470f5907c29f74ca
dsh@0.1.0-rc.7
Node 22.19.0
pnpm 11.7.0
```

Any Harness upgrade must rerun:

```text
pristine pinned/upgraded Harness build
→ Product Shell prepare
→ typecheck
→ bundle
→ isolated profile install
→ browser smoke
→ business ID invariants
→ fresh-profile runtime bootstrap
```

Breaking changes are absorbed in `integrations/harness`, not by changing Domain semantics merely to match Harness internals.

---

# 14. Migration contract

Until S4-N5:

- `apps/web` remains migration reference/regression baseline only;
- formal Product features go to `editorial-shell-package`;
- do not maintain two production product entrances.

S4 sequence:

```text
N1 Product Shell Foundation           COMPLETE
N2 Today / Opportunities Migration    COMPLETE
N3 Research Runtime Adapter           COMPLETE
N4 Scheduler / Headless Orchestration NEXT
N5 Web Shell Retirement               NOT_STARTED
```

---

# 15. Acceptance invariants

A conformant Harness-native Product Shell implementation must satisfy all of the following:

1. Product Shell runs as an out-of-tree Harness plugin without upstream core patch.
2. stock Harness workbench remains usable.
3. Today / Opportunities do not require an active Agent Session.
4. Research uses `research_case_id` as canonical identity.
5. fresh Harness profile can self-bootstrap the required runtime Workspace through public API.
6. missing Session can be rebound without losing Research Case.
7. Product action can drive Harness runtime without manual Chat prompt.
8. no iframe / `surface_url` / private-store / DOM-click dependency is required for the formal Product Shell.
9. canonical business state remains reconstructable independently of Session replay.
10. exact-pin CI and browser Gate remain green.
