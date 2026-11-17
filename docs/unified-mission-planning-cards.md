# Unified Mission cards in Order planning

Original, internal supplemental and Customer rework Missions share `MissionGridCard` and the existing planning components. The original workspace keeps separate groups using the same full-width responsive layout.

- Original scope/coverage, finalization and payment allocation continue to use original Missions only.
- Derived cards load active checklist assignments for their own Mission rather than inferring scope from the original coverage plan.
- The overview renders derived cards read-only, with links to Mission details and the existing internal-correction or Customer-rework planning route. Editing and finalization remain in their scoped workspace.
- Type badges distinguish the three origins. Internal supplemental cards link to the original Mission; Customer rework cards identify the Customer request and link to its existing scoped planning workspace.
- Shared cards show Staff response state and flight-permit state. Internal/Customer flight-permit processing rules are unchanged.
- The permit tab uses the existing FlightPermitCard for derived Missions too, without enabling mutations from the original workspace.
- No BE API, database, quote, payment or checklist-assignment mutation contract is changed.

Verification uses source analysis, focused component/workspace tests, TypeScript/Vite build and mocked-data browser fixtures at desktop/mobile widths in Vietnamese and English. The CodeGraph MCP tool was unavailable in this session.
