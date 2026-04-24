# RSC Fixture Route Taxonomy

This fixture app uses taxonomy-first routes so each page has one clear test purpose.

## Canonical route groups

- `/boundary/*`:
  - server/client boundary semantics (`Node`, `createNode`, client component handoff)
- `/theme/*`:
  - ThemeProvider boundaries and token resolution
- `/providers/*`:
  - cross-cutting provider plumbing (portal/style-registry)
- `/link/*`:
  - `next/link` boundary behavior and known repro paths
- `/diagnostic/*`:
  - anti-pattern/documentation-only runtime behavior

## Migrated routes

The following legacy flat routes were migrated to taxonomy routes and the flat
pages were removed from the fixture app:

- `/server-node-client` -> `/boundary/server-node-client`
- `/server-createnode-neutral` -> `/boundary/server-createnode-neutral`
- `/server-createnode-client` -> `/boundary/server-createnode-client`
- `/client-function-prop` -> `/boundary/client-function-prop`

- `/theme-server-children` -> `/theme/server-children`
- `/theme-client-children` -> `/theme/client-children`
- `/client-page-css-direct` -> `/theme/client-page-css-direct`
- `/theme-resolution-boundary` -> `/theme/resolution-boundary`
- `/theme-resolution-link-node` -> `/theme/resolution-link-node`

- `/portal-in-layout` -> `/providers/portal-in-layout`
- `/style-registry` -> `/providers/style-registry`

- `/next-link-neutral` -> `/link/neutral`
- `/next-link-inline` -> `/link/inline`
- `/next-link-client-module` -> `/link/client-module`
- `/next-link-wrapped-client` -> `/link/wrapped-client`

- `/server-direct-client` -> `/diagnostic/server-direct-client`
- `/next-link-direct-call` -> `/diagnostic/link-direct-call`
- `/next-link-direct-call-client` -> `/diagnostic/link-direct-call-client`
