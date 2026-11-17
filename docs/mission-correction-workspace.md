# Mission evidence correction workspace

This UI flow handles Inspector findings that can be corrected with existing Mission media or original files from the completed flight.

| Order | Screen | Actor | Next action |
|---|---|---|---|
| 1 | Mission inspection (`inspection/:missionId`) | Inspector | Assess checklist results, record failed scope and choose dossier adjustment |
| 2 | Review request (`corrections/:missionId`) | Reporting Staff | Read the grouped findings and related files |
| 3 | Add files (optional) | Reporting Staff | Upload original files from the same flight if suitable media is missing |
| 4 | Update evidence | Reporting Staff | Detach incorrect links and attach suitable media to requested checklist items |
| 5 | Resubmit | Reporting Staff | Review per-item evidence readiness, describe corrections and explicitly submit |
| 6 | Review corrected evidence | Inspector | Reassess requested items, select accepted delivery evidence and resolve/return the request |
| 7 | Mission inspection | Inspector | Confirm and publish through the existing result workflow |

## Screen boundaries

- Postflight remains the equipment/operational check. Once every device is checked, the assigned Inspector goes directly to inspection. A separate reporting Staff member returns to Mission details; there is no postflight dossier preparation screen.
- The inspection route never opens an unfinished physical equipment check form. It links back to postflight when those checks are still pending.
- Initial checklist and evidence preparation stays on the existing workspace without a separate dossier submission gate. The correction page is for an existing correction request; explicit resubmission applies only to corrections.
- Existing checklist/media widgets are embedded in the correction workspace. The embedded view hides the physical flight stepper, duplicate handoff/correction panels and unrelated checklist items.
- Media ingestion, validation, local-first Staff presentation, authorized previews, evidence version checks and removal rules are reused.
- The separate inspection/correction routes do not advance or reset physical flight progress.

## Correction states

- OPEN: reporting Staff can work through request → optional files → evidence → resubmit.
- SUBMITTED: reporting edits are hidden; Inspector receives the reinspection workspace. An account holding both assignments changes responsibility at this boundary and must make a separate review decision.
- RESOLVED: show confirmation and a link to Mission inspection. Resolving a correction does not itself publish results.
- A returned request prominently shows the latest Inspector feedback. Original findings and event history remain available.
- If original data is insufficient, Staff may request a supplemental flight with a reason. The existing internal Mission planning flow handles that branch.

## Guards and user feedback

- Show only the checklist IDs listed in the correction request. Backend scope/role/version checks remain authoritative.
- Block resubmission while requested evidence is incomplete or unvalidated, and block acceptance until requested assessments and delivery evidence are ready.
- Block step navigation during an active transfer. Queue state continues to use the existing persisted upload/evidence queue.
- Retain entered notes during background refresh and disable submission while synchronizing the correction snapshot. Stale commands are rejected by the expected-version/review-token contract.
- Query failures display localized retry feedback and do not expose server details.
- Related files in the request are read-only references, with thumbnails and authorized preview.
- All new workflow controls provide Vietnamese and English copy.

No backend API, database schema, S3 storage or flight-control behavior is changed by this screen rearrangement.

## Retired initial dossier UI

The Mission header no longer exposes a preparation action. The separate handoff panel, its API client and its UI tests have been removed. Old postflight checklist links redirect to the main inspection route for an assigned Inspector, or Mission details for reporting Staff. The shared in-flight checklist/evidence controls and Mission media library remain. A future supplemental-media UI can be implemented independently of this retired main-flow step.


## Reinspection

After dossier resubmission, assigned Inspectors return to the normal Mission inspection page. Checklist decisions and accepted Customer media selections drive request reconciliation. A separate decision-note form is no longer displayed. Failed checklist decisions require a reason. Staff see the remaining items when work is returned; accepted items retain their decisions.

## Accepted supplemental flights

The supplemental Inspector accepts that flight's checklist scope. Accepted evidence is returned to the source Mission automatically. Source inspection displays the supplemental results for reference and offers synchronization for older accepted records. Source acceptance is completed automatically once the combined package satisfies delivery requirements.
