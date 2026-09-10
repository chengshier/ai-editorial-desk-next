# S4-N5 Web Shell Retirement Audit

## Status

`IN_PROGRESS`

Verified predecessor Gate:

- PR #16 head `06ca19f629d22b39f28948c11ac10744feafa04b`
- CI #254 PASS
- Harness Editorial Shell #116 PASS
- Harness Spike #208 PASS
- Harness Native Shell Spike #122 PASS

Therefore S4-N4 Scheduler / Headless Orchestration is closed and S4-N5 may start.

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

The remaining standalone routes are placeholders and do not constitute unique production business capability. They must not block retirement.

## N5 decision

Use the allowed retirement mode from the S4 migration plan:

```text
apps/web = RETIRED_AS_PRODUCTION_HOST
apps/web = MIGRATION_REFERENCE_ONLY
```

The directory is retained during PR #16 only as a regression/reference artifact. This is not a second supported production entry.

## Mechanical requirements

N5 is complete only when all of the following are true:

1. `apps/web` visibly declares itself migration/reference-only.
2. Architecture and delivery docs no longer describe it as an active/future production host.
3. CI may still compile it as a reference regression check, but the job must not be interpreted as production-shell acceptance.
4. Formal Product acceptance continues to run through the exact-pin Harness Editorial Shell browser Gate.
5. No Product contract may depend on iframe / `surface_url` / `embedded` transport.
6. PR #16 remains Draft until the final N5 Gate is green.

## Follow-up cleanup after PR #16

Once downstream product batches no longer need visual/interaction comparison against the old shell, a later cleanup PR may delete `apps/web` entirely. Deletion is not required to establish the production-host invariant as long as the reference-only quarantine is explicit and mechanically tested.
