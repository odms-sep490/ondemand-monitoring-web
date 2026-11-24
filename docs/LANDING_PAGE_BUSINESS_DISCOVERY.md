# OnDemand Monitor — Landing Page Business Discovery

## 1. Platform Overview
**OnDemand Monitor** is a Managed Drone-as-a-Service (DaaS) platform enabling enterprise and field customers to submit on-demand aerial monitoring requests, track mission execution and safety compliance, review checklist-backed visual evidence, and download original deliverables in one unified portal.

## 2. Traceable Business Inventory

| BUSINESS_CLAIM | SOURCE_FILE_OR_API | VERIFICATION_STATUS | LANDING_PAGE_RELEVANCE |
|---|---|---|---|
| 4 active monitoring service categories (Kiểm tra nhà xưởng, Giám sát khu vực, Giám sát rừng, Giám sát công trình) | `src/features/customer/api/customerApi.ts` (`ServiceOption`), `CreateOrderPage.tsx` | VERIFIED IMPLEMENTED | Core Service Explorer section |
| 6-step guided order intake (Service/Purpose, Map polygon, Checklist & media counts, Site access & permits, Schedule, Deliverables & terms) | `src/features/customer/lib/createOrder/types.ts`, `CreateOrderPage.tsx` | VERIFIED IMPLEMENTED | Hero value prop & Customer Workflow |
| Role-aware CTA routing (Guest → `#auth/login`, Customer → `#portal/customer/request`, Staff/Manager → role home) | `src/features/landing/resolveCreateRequestTarget.ts` | VERIFIED IMPLEMENTED | All primary CTAs |
| AI Consultation Assistant (service guidance, multi-turn requirement clarification, description drafting, Vietnamese voice) | `OrderConversation.tsx`, `MissionDescriptionAssistant.tsx`, `OrderConversationController.java`, `Python/voice-order/` | VERIFIED IMPLEMENTED | AI Consultant Spotlight section |
| Manager review, pricing/quotation, deposit/payment flow | `src/features/manager/pages/OrderReview/`, `DashboardFinancePanel.tsx` | VERIFIED IMPLEMENTED | Workflow transparency |
| Mission dispatch, operator acceptance, preflight & weather checks, postflight checks | `src/features/drone-operator/pages/MissionDetailScreen.tsx`, `PreflightScreen.tsx` | VERIFIED IMPLEMENTED | Operational pillars & safety trust |
| Checklist-linked media inspection & customer acceptance to unlock original files | `ImageQualityController.java`, `src/features/media/`, `LandingPage.messages.ts` | VERIFIED IMPLEMENTED | Deliverables & quality assurance |
| Help Center & support contact (`#help`, `support@odms.vn`) | `src/features/support/pages/HelpCenterHome/`, `LandingPage.tsx` | VERIFIED IMPLEMENTED | Footer |
| Public unauthenticated `/api/services` catalog pricing | `SecurityConfig.java` | NOT PUBLIC (requires auth) | Do not hardcode live prices on unauthenticated landing page |
| Customer testimonials, partner logo wall, or ROI percentages | Not present in repository | UNVERIFIED / OMITTED | Strictly omitted to avoid fabricated claims |

## 3. Verified Customer Journey
1. **Đặt yêu cầu & phạm vi**: Customer chooses a service, draws the target area on the map, picks checklist items/media counts, provides site access & permit status, and selects a schedule (optionally guided by the AI Consultant).
2. **Duyệt phép & bay thu thập**: Manager reviews scope and pricing; assigned drone operator confirms the mission, clears permits, weather, and preflight safety checks, and captures evidence.
3. **Kiểm định & bàn giao gốc**: Media is linked to each checklist item for quality verification; customer reviews results, approves delivery, and downloads original files with full audit history.
