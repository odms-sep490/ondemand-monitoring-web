# Landing Page Content Strategy

## Positioning and audience

**Positioning:** OnDemand Monitor connects field-monitoring requests to mission planning, operational readiness, post-flight records, Manager review, and result delivery.

**Primary audience:** customers who need to request and follow a monitoring mission. **Secondary audiences:** Managers who plan/review work and staff/operators who prepare, execute, and document it.

**Value proposition:** keep the request, assignments, readiness checks, and evidence connected to one mission/order record.

**Primary CTA:** Tạo yêu cầu giám sát / Create monitoring request. **Secondary CTA:** Xem quy trình / See how it works. The existing route resolver preserves guest, customer, and other authenticated-role destinations.

**Voice:** calm, direct, operational. Use clear actions and explain state changes; do not promise autonomous flight, automatic safety decisions, geography, pricing, or performance outcomes.

## Section plan

| Section          | Purpose and eyebrow                                                                | Headline and support                                                                                                                                | CTA                           | Source evidence                                                                        | Visual / animation                                                                                                       | Mobile layout                                                                     |
| ---------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Hero             | State the request-to-result promise. Eyebrow: “Giám sát hiện trường theo yêu cầu.” | “Theo dõi nhiệm vụ drone, từ yêu cầu đến kết quả.” Support explains planning, preflight, and postflight review.                                     | Create request; see workflow  | Order creation, mission planning and results services; CTA resolver                    | User-provided Lottie drone inside a mission dossier with a four-stage workflow; no fake telemetry or performance metrics | Copy first, responsive animation card next; actions stack full width              |
| Mission journey  | Explain the real handoffs. Eyebrow: “Một nhiệm vụ, các mốc rõ ràng.”               | “Theo dõi việc cần làm ở từng giai đoạn.” Four chapters: request review, planning/assignment, preflight/weather/handover, postflight/Manager review | None; navigation anchors here | `OrderController`, `MissionService`, `WeatherPreflightService`, `MissionResultService` | Sticky illustrative site photograph and mission progress panel; scroll selects the related stage                         | Static photo followed by short readable chapter rows; no sticky scroll dependency |
| Capabilities     | Summarize what stays attached to the record. Eyebrow: “Công cụ gắn với quy trình.” | “Thông tin quan trọng nằm cùng hồ sơ nhiệm vụ.” Scope/conditions, checklist/weather, evidence/postflight review                                     | None                          | Mission checklist, weather, media, result-review services                              | Editorial numbered list with quiet link-like affordance; no invented dashboard metrics                                   | Single-column rows with larger touch-friendly spacing                             |
| FAQ              | Answer operational questions and prevent false expectations                        | “Thông tin cần biết.” Questions cover request inputs, start readiness, Manager result review, and manual GCS/device operation                       | Native expandable answers     | Order request, mission start and result-review gates                                   | Accessible disclosure rows; no scroll animation                                                                          | Native `<details>` disclosure, full-width text                                    |
| Final CTA/footer | Give a clear next action and disclose image sources                                | “Bắt đầu bằng khu vực bạn cần giám sát.” Copy asks for a request so the team can review scope and next steps                                        | Create request                | Order creation and existing route resolver                                             | Dark closing band, restrained radius motif, source credits disclosure                                                    | Stacked copy/action, credits open above footer edge                               |

## Messaging hierarchy

1. A user can follow a monitoring request through to its result.
2. Managers and field staff have separate review, planning, readiness, handover, and evidence steps.
3. The system records checklist, weather, media, and result-review information with the mission.
4. A request begins the workflow; it does not promise approval, an exact schedule, or a flight.

## Conversion and content guardrails

- Keep the primary request action visible in the header, hero, and final CTA.
- Explain why the system has distinct `PLANNING`, `READY`, and `IN_PROGRESS` stages without exposing raw status codes to customers.
- Label the Lottie animation and photography as illustrative. No sample mission ID, telemetry, savings figure, customer logo, quote, price, or coverage map is shown.
- Keep the FAQ statement about GCS/device operation aligned with the human-operated source workflow.
- Measure request CTA clicks and completed requests before proposing copy variants. No conversion baseline is currently verified.
