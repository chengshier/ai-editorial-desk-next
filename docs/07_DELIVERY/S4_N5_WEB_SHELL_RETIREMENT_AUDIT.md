# S4-N5 Web Shell Retirement Audit

## Status

`COMPLETE / CI PASS / WINDOWS SMOKE PASS`

Final verification:

- automated head `a56b7b9bbe8844df88fed7071f2827dcc0b672b5`
- CI #289 PASS
- Harness Editorial Shell #151 PASS
- Harness Spike #243 PASS
- Harness Native Shell Spike #157 PASS
- Windows final local smoke PASS

Therefore S4-N5 Web Shell Retirement is complete and PR #16 may move from Draft to Ready. Merge still requires explicit user confirmation.

## Goal

Retire `apps/web` as a production Product Shell so AI Editorial Desk has only one formal product host:

```text
DeepSeek Harness Web
├ official Agent Runtime
├ stock Harness workbench
└ AI Editorial Desk Product Shell Plugin

Editorial API / PostgreSQL
└ canonical business truth
```

`apps/web` may remain temporarily only as an explicitly quarantined migration/reference surface. It must not be documented, routed, deployed, or tested as a second production entry.

## N5 decision

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

The directory is retained during PR #16 only as a regression/reference artifact. This is not a second supported production entry.

## Mechanical requirements — verified

1. `apps/web` visibly declares itself migration/reference-only.
2. Architecture and delivery docs no longer describe it as an active/future production host.
3. CI still compiles it only as a legacy reference regression check, not production-shell acceptance.
4. Formal Product acceptance runs through the exact-pin Harness Editorial Shell browser Gate.
5. No Product contract depends on iframe / `surface_url` / `embedded` transport.
6. Native Shell and formal Product Shell browser Gates pass after readiness-race hardening.
7. Windows fresh-profile native picker fallback is verified locally without upstream patches.
8. Product Shell ↔ stock Harness round-trip and both-mode F5 persistence are verified locally.

## Final evidence

```text
Automated head: a56b7b9bbe8844df88fed7071f2827dcc0b672b5
CI                         #289 PASS
Harness Spike              #243 PASS
Harness Editorial Shell    #151 PASS
Harness Native Shell Spike #157 PASS
Windows final local smoke       PASS
```

Windows smoke covered:

```text
Editorial API + pinned Harness Web start
→ Product Shell visible on :3080
→ Today / Opportunities / Inspector usable
→ fresh-profile native picker fallback
→ Workspace / Session bootstrap
→ Research Case reaches Runtime Ready
→ Scheduler status visible
→ Product Shell ↔ stock Harness round-trip
→ F5 persistence in both modes
→ no persistent blank page / Failed to load plugins
```

This closes the S4-N5 repository and human-acceptance Gate.

## Follow-up cleanup after PR #16

Once downstream product batches no longer need visual/interaction comparison against the old shell, a later cleanup PR may delete `apps/web` entirely. Deletion is not required to establish the production-host invariant as long as the reference-only quarantine is explicit and mechanically tested.
