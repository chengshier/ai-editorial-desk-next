# S4-N5 Web Shell Retirement Audit

## Status

`COMPLETE / CI PASS`

Final engineering verification:

- PR #16 head `280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6`
- CI #268 PASS
- Harness Editorial Shell #130 PASS
- Harness Spike #222 PASS
- Harness Native Shell Spike #136 PASS

Therefore S4-N5 Web Shell Retirement is engineering-complete. PR #16 remains Draft until the final Windows local smoke is completed.

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

## Audit of current `apps/web`

The current standalone Web Shell contains only:

- real Today page;
- real Opportunities Library page;
- legacy Research host using `HarnessSurfaceHost`;
- placeholder routes for Programming, Creation, Publication, Performance, Knowledge, Acquisition, Configuration, and System.

The production-capable parts above are already superseded by the Harness-native Product Shell work completed in S4-N1 through S4-N4:

- Today / Opportunities migrated in N2;
- Research runtime binding and Product Shell interaction migrated in N3;
- background manual/scheduled/event execution and canonical Scheduler status migrated in N4;
- stock Harness workbench remains reachable from the same Harness Web.

The remaining standalone routes are placeholders and do not constitute unique production business capability. They do not block retirement.

## N5 decision

Use the allowed retirement mode from the S4 migration plan:

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
formal product host = DeepSeek Harness Product Shell
```

The directory is retained during PR #16 only as a regression/reference artifact. This is not a second supported production entry.

## Mechanical requirements — verified

All N5 requirements are now satisfied:

1. `apps/web` visibly declares itself migration/reference-only.
2. Architecture and delivery docs no longer describe it as an active/future production host.
3. CI still compiles it only as a legacy reference regression check, not production-shell acceptance.
4. Formal Product acceptance runs through the exact-pin Harness Editorial Shell browser Gate.
5. No Product contract depends on iframe / `surface_url` / `embedded` transport.
6. Native Shell and formal Product Shell browser Gates both pass after readiness-race hardening.
7. PR #16 remains Draft pending final Windows local smoke.

## Final CI evidence

Verified head:

```text
280e7c9b2ba3a9bf7019b94b85e4acf0d4c213f6
```

Verified workflows:

```text
CI                         #268 PASS
Harness Spike              #222 PASS
Harness Editorial Shell    #130 PASS
Harness Native Shell Spike #136 PASS
```

This closes the repository-level S4-N5 Gate.

## Remaining human acceptance before merge

A final Windows local smoke is intentionally kept outside the automated engineering Gate. It should verify only the environment-sensitive product path:

```text
start Editorial API + pinned Harness Web
→ AI Editorial Desk Product Shell visible
→ Today / Opportunities usable
→ Product Shell ↔ stock Harness round-trip
→ Research Case / Scheduler status visible
→ no persistent blank page / Failed to load plugins / obvious runtime boot failure
```

This smoke is the only remaining S4 acceptance item before PR #16 may move from Draft to Ready. It does not add a new architecture requirement and does not claim production provider/content quality.

## Follow-up cleanup after PR #16

Once downstream product batches no longer need visual/interaction comparison against the old shell, a later cleanup PR may delete `apps/web` entirely. Deletion is not required to establish the production-host invariant as long as the reference-only quarantine is explicit and mechanically tested.
