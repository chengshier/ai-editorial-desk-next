# Legacy Web Shell — migration reference only

Status: `RETIRED_AS_PRODUCTION_HOST`

The formal AI Editorial Desk product host is the out-of-tree DeepSeek Harness Product Shell Plugin under `integrations/harness/editorial-shell-package`.

This `apps/web` Vite application is retained temporarily only as a migration/reference and regression surface while PR #16 closes S4-N5. It is **not** a supported production entry, must not be deployed as a second product shell, and must not be used to reintroduce iframe / `surface_url` / `embedded` transport.

Its remaining standalone routes include migrated Today/Opportunities views, the superseded hybrid Research host, and placeholder future-product routes. Canonical production acceptance is performed by the exact-pin Harness Editorial Shell Gate.
