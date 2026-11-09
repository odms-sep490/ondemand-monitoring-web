---
target: customer order detail page in Vietnamese
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\ACER\\Documents\\GitHub\\doan\\ondemand-monitoring-web\\src\\features\\customer\\pages\\OrderDetail\\OrderDetailPage.tsx"
target_fingerprint: "sha256:4b73e107a5e4135912e447156c5c288acc658182ad112bf28e31a34178a6fa4c"
target_path: "C:\\Users\\ACER\\Documents\\GitHub\\doan\\ondemand-monitoring-web\\src\\features\\customer\\pages\\OrderDetail\\OrderDetailPage.tsx"
timestamp: 2026-10-29T17-23-27Z
slug: mer-pages-orderdetail-orderdetailpage-tsx-383015a8
---
# UI/UX critique — Customer Order Detail

**Target:** `src/features/customer/pages/OrderDetail/OrderDetailPage.tsx`  
**Scope:** 1 customer order detail surface; Vietnamese UI. Assessment A and B ran independently. Live browser viewports: 390×844, 768×1025, 1440×900; user-provided desktop capture also reviewed. The 390×844 capture was emitted inline by Assessment B and not saved as a file; DOM measurements are recorded below.  
**Visual style:** Medium product specificity. The construction image, radius map and service location make the page belong to this drone monitoring product. The surrounding dashboard-card language is familiar and coherent, though not especially distinctive.

## Nielsen heuristic score

| Heuristic | Score | Observation |
|---|---:|---|
| Visibility of system status | 2/4 | “Hoàn thành” does not distinguish mission completion from customer result review and payment. |
| Match to real world | 2/4 | Order, delivery review and payment are separate concepts, but the summary badge compresses them into one state. |
| User control and freedom | 3/4 | Back navigation, result review and accept/revision actions are present. |
| Consistency and standards | 2/4 | FAQ suggestions do not follow the current order state. |
| Error prevention | 2/4 | Customer can confuse mission completion with acceptance of results. |
| Recognition rather than recall | 3/4 | Order code, map and labeled result actions help recognition. |
| Flexibility and efficiency | 2/4 | The main result-review path requires scrolling past the large visual hero. |
| Aesthetic and minimalist design | 3/4 | Clean cards and strong map/photo composition; the page becomes long. |
| Error recovery | 3/4 | Error/retry patterns exist in source, but recovery paths were not exercised in this review. |
| Help and documentation | 2/4 | The first order FAQ remains about waiting for approval on a completed order. |
| **Total** | **24/40** | **Acceptable; clarify state and mobile layout first.** |

## Overall impression

The page gives useful context for the job site and inspection area, then makes the customer infer whether the order, delivered results, and payment are all complete. The strongest improvement is to show those as distinct states and make the next result-review action obvious near the top.

## What works

- The service image, address and 300 m map radius make the order concrete.
- Order code, back link and visible “Kết quả” tab support navigation.
- Result acceptance and revision are represented as explicit customer actions.

## Priority issues

### [P1] “Hoàn thành” obscures result-review and payment state — State & trust

- **Evidence:** The header shows “Hoàn thành”; the live result panel still presents a preview for customer review and an outstanding balance.
- **Why it matters:** A customer may believe there is nothing left to do, or mistake mission completion for accepting the deliverable.
- **Fix:** Separate “Mission completed”, “Awaiting your review” and payment status. Add a direct “Review results” action beside the order status.
- **Source:** `OrderDetailPage.tsx` determines whether results are available from the order status; `CustomerDeliveryPanel` has a separate preview/review state.

### [P1] Evidence chip clips the mobile viewport — Responsive

- **Evidence:** Assessment B at 390×844: `main.clientWidth=372`, `main.scrollWidth=494`; the checklist evidence chip is 421 px wide and ends at x=495.
- **Why it matters:** Part of the checklist requirement is off-screen and the page gains horizontal overflow.
- **Fix:** Let evidence chips wrap on small screens and constrain them to their parent width; verify the order detail grid has `min-width: 0` and no child forces a wider layout.
- **Source:** `Checklist.css` sets `white-space: nowrap` for `.checklist-snapshot-evidence`.

### [P2] Result review is below a large hero and has a second entry point — Journey / information architecture

- **Evidence:** On the supplied desktop screenshot, the large photo/map hero precedes the “Tổng quan / Kết quả” tabs; “Xem media” is also shown in the header.
- **Why it matters:** The customer must scroll to reach the review tab and may not know how it differs from media browsing.
- **Fix:** Put “Review results” near the status for completed missions; label “Xem media” as the media library/archive destination.
- **Source:** `OrderDetailPage.tsx` renders the visual card before the tabs; `OrderActions.tsx` exposes the separate media action.

### [P2] FAQ suggestions ignore the order state — Content / help

- **Evidence:** A completed order still suggests “Tại sao yêu cầu giám sát của tôi vẫn đang chờ phê duyệt?”.
- **Why it matters:** It undermines confidence that the page understands the customer’s order.
- **Fix:** Choose FAQ suggestions by status and delivery state, or replace the stale item with a result-review/payment question.
- **Source:** `ContextAwareHelpWidget.tsx` uses a fixed `ORDER_QUESTIONS` list regardless of status.

### [P2] The title can render as a single letter — Content / first impression

- **Evidence:** The supplied screenshot shows only “f” as the order title.
- **Why it matters:** It does not identify the job and reads like incomplete or accidental data.
- **Fix:** Validate meaningful order names at entry, and provide a useful display fallback such as service + area + order code when the title is too short.
- **Source:** `OrderHeader.tsx` renders `order.title`; `mapOrder.ts` falls back only when the value is empty.

## Cognitive load and customer journey

The page groups information into cards, but the order summary, large map/photo, mission reports, checklist, payment, timeline, support and result review form a long scroll. The completed badge initially reassures the user; seeing a preview awaiting review and an unpaid balance afterward creates uncertainty. Keep the map as context, but bring the current state and next action forward.

## Persona red flags

- **Jordan, first-time customer:** a one-letter title and generic approval FAQ make it harder to identify the job and next step.
- **Riley, detail-focused customer:** may interpret “Hoàn thành” as acceptance of the results even while review/payment remains.
- **Sam, assistive-technology user:** map semantics, focus order, keyboard use and status announcements need a live accessibility pass; this review did not claim they pass or fail.

## Other dimensions

| Dimension | Result |
|---|---|
| Usability | Status ambiguity and stale FAQ are the main problems. |
| Accessibility | Exact contrast, keyboard/focus, screen-reader map semantics and touch-target behavior still need axe/live verification. |
| Visual design | Clean card system; large hero competes with the result-review task. |
| Content & language | The screenshot’s title “f” is weak; check any runtime-only English field labels against the Vietnamese UI. |
| State & data | Separate order, delivery and payment states; verify the sample’s event dates and checklist counts against source data. |
| Responsive | Horizontal overflow measured at 390×844; tablet/desktop widths did not show the same measured overflow. |
| Information architecture | “Kết quả” and “Xem media” need clearer destination labels. |
| Interaction design | Accept/revision actions are visible in the result flow; keyboard interaction was not tested. |
| User journey | The result-review action is not the first thing shown for a completed order. |
| Cognitive load & onboarding | Long scroll; existing card grouping helps. |
| Trust & credibility | Completion language conflicts with remaining customer actions. |
| Error prevention & recovery | No user action was taken; no destructive-flow defect was verified. |
| Performance perception | No performance profiling was performed; image/map loading metrics remain unknown. |

## Detector and coverage

- `impeccable detect --json`: no findings returned.
- User-visible overlays: not injected; no overlay is claimed.
- No source code, order data or customer actions were changed. No tests were run.
- Not covered: other order states, full revision/accept/payment flow, dark mode, English UI, exact WCAG contrast, keyboard/screen-reader behavior, and performance metrics.
- **Needs verification:** Assessment A saw a sample completed timestamp before the scheduled monitoring date and a checklist evidence-count mismatch. Confirm those against the API/demo data before treating them as UI defects. The runtime-only “Whole Order scope” phrase also needs a data/localization check.

## Questions to consider

1. Should “Hoàn thành” mean mission execution finished, or only after result acceptance and final payment?
2. Should “Xem media” open the raw media library while “Kết quả” remains the handover/review flow?
3. Should a missing or low-quality title fall back to service + area, or should the customer be required to rename the order?
