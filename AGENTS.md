# AGENTS.md

Repo: `ondemand-monitoring-web` — React 19 + Vite 8 + TypeScript web app.

Key commands: `npm run dev`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles mapped 1:1 (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `GLOSSARY.md` + `docs/adr/` at the root (created lazily by domain-modeling). See `docs/agents/domain.md`.

## CodeGraph First Policy

Apply this policy automatically to coding tasks; do not wait for the user to mention CodeGraph.

- Before editing, identify the relevant features, modules, files, and symbols. For non-trivial changes, use the `codegraph_local` MCP server to inspect definitions, callers, callees, dependencies, call chains, and impact where relevant.
- The frontend and backend are separate Git checkouts with separate local indexes. Set `projectPath` to the checkout containing the code being analyzed; for cross-repository work, inspect both sides and confirm the API contract in source.
- Use `codegraph_semantic` as a supplementary structural graph only. It is configured graph-only, so semantic embeddings/search are unavailable.
- Verify graph findings against source and tests. Follow existing patterns, reuse helpers, avoid duplicate logic, and inspect API consumers/contracts before changing an API.
- After implementation, recheck affected references and run relevant verification. Skip graph queries for small, isolated edits. If CodeGraph is unavailable, continue with source analysis and report that limitation. Never claim a graph query was run unless its tool was actually executed.
- If the local index reports stale state after material changes, run `codegraph sync` from this checkout root. Index data stays under ignored `.codegraph/`.

## Frontend Rules

- Inspect related components, hooks, API services, and types; trace API calls and shared state.
- Check affected routes and UI consumers. Preserve established UI conventions and responsive behavior.
