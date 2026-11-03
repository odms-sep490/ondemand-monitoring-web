# Landing Page Business Audit

## Scope and method

Reviewed the React customer, Manager, and Staff/Operator flows alongside the Spring order, finance, mission, weather, result-review, and delivery services. CodeGraph was queried against both independent repositories and relevant routes/services were checked against source. This page is marketing communication; it does not change backend behavior.

## Capability matrix

| Feature                               | User value                                                                           | Role                        | Source evidence                                                                                                                                                         | Status                                                    | Landing relevance                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- |
| Create monitoring order               | Submit service, location, preferred time, and scope for review                       | Customer                    | BE `order/controller/OrderController.createOrder`; FE `src/features/customer/pages/CreateOrder/`                                                                        | Implemented                                               | Primary entry point and CTA                                       |
| Review order and flight area          | Record Manager review and legal/flight-area disposition                              | Manager/Admin               | BE `order/controller/OrderController.startReview`, `approveOrder`; `order/service/impl/OrderService`                                                                    | Implemented with review gates                             | Explain why planning follows review                               |
| Quote, invoice, deposit               | Accept a quote and pay the required deposit before mission planning                  | Customer                    | BE `finance/controller/CustomerFinanceController`; `mission/service/impl/MissionService.createMissionInternal`                                                          | Implemented                                               | Avoid implying an order immediately launches                      |
| Plan mission and checklist            | Create a mission, schedule it, and attach required checklist items                   | Manager/Admin               | BE `mission/controller/MissionController.createMission`; `mission/service/impl/MissionService.createMissionInternal`; FE `src/features/manager/`                        | Implemented; planning and payment are gated               | Show planning as a distinct stage                                 |
| Assign and accept resources           | Assign staff/device and capture staff response                                       | Manager and assigned Staff  | BE `mission/service/impl/MissionService.acceptMission`; assignment domain/status enums; FE `src/features/drone-operator/pages/MissionDetail/`                           | Implemented; readiness is enforced by the backend         | Show ownership and acceptance without inventing exact role timing |
| Connect, preflight, weather, handover | Record device readiness, assess current weather, and hand over control before launch | Operator/Staff              | BE `mission/service/impl/MissionService`; `weather/service/WeatherPreflightService`; FE `src/features/drone-operator/pages/MissionDetail/`                              | Implemented with mission/device gates                     | Core operational differentiator                                   |
| Start and execute mission             | Start only after readiness, permit, handover, and fresh safe-weather gates           | Staff with start permission | BE `MissionService.startMission`; `MissionStatus`; `MissionDeviceAssignmentStatus`; `DeviceStatus`                                                                      | Implemented; mission and device statuses advance together | Explain that “ready” and “in progress” are separate               |
| Postflight and result review          | Record inspection/checklist and media, then submit for Manager review                | Staff/Inspector and Manager | BE `MissionService.recordPostFlightInspection`; `mission/service/impl/MissionResultService`; `ManagerMissionResultApprovalController`; FE mission detail/result screens | Implemented with evidence/review rules                    | Show a traceable close-out                                        |
| Result delivery                       | Release order results after mission results and payment conditions are satisfied     | Customer, Manager           | BE `delivery/service/impl/DeliveryWorkflowServiceImpl`; FE `src/features/delivery/` and customer order views                                                            | Implemented with delivery gates                           | Support the request-to-result promise                             |

## Business findings

- The product coordinates a human-operated mission lifecycle. The code requires staff to connect the GCS/device, complete preflight, assess weather, and hand over control; public copy must not imply autonomous launch or automated safety approval.
- Mission creation starts in `PLANNING`; handover makes it `READY`; `startMission` requires permit approval, confirmed handover, a ready device assignment, and fresh safe weather before moving to `IN_PROGRESS` and activating the device.
- The quote/invoice and deposit gate precedes mission planning. The landing page therefore presents request/review/planning as steps, not as an instant booking guarantee.
- Postflight includes device inspection and submitted mission records. Manager review precedes result delivery.
- The source supports workflow visibility and evidence collection. It does not establish coverage areas, operational capacity, accuracy, cost savings, customer testimonials, or service-level commitments.

## Landing-page conversion goal

Primary CTA: **Tạo yêu cầu giám sát / Create monitoring request**. `resolveCreateRequestTarget` routes guests to registration, customers to request creation, and other authenticated roles to their role home. Secondary CTA: jump to the workflow explanation.

## Claims and assets

- No metrics, prices, client logos, testimonials, coverage claims, or safety guarantees are used.
- Photos illustrate contexts only; they do not imply that the service operates at those sites.
- The hero drone is the user-supplied `Drone.json`. Its LottieFiles source link is retained in the page credits. The animation page’s license terms were not available to verify in this implementation session; confirm them before commercial public release.
- The construction photo is credited as CC BY 4.0; the other chosen photos are recorded as CC0 in `public/images/landing/credits.json`.
