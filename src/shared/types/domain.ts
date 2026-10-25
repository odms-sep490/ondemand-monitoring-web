// Domain enum types, copied verbatim from the backend so the UI never
// invents a status value. Sources:
// [BE] .../order/enums/OrderStatus.java
// [BE] .../mission/enums/MissionStatus.java
// [BE] .../drone/enums/DroneStatus.java
// [BRIEF] evd/design/FA26SE039_Design_Brief.md §A4 (ai_analysis_session,
//   feasibility_rule), §A5 (maintenance_ticket.severity), §A8 (media_asset.media_status)

/** One of the 6 status-colour tones from [BRIEF Phần B]. */
export type StatusTone = 'gray' | 'yellow' | 'blue' | 'green' | 'orange' | 'red'

/** `order.enums.RequiredEvidenceType` — evidence media type saved per requirement. */
/**
 * IMAGE / VIDEO: a single minimum of that media type. IMAGE_AND_VIDEO: its own minimum images AND its own minimum videos.
 * IMAGE_OR_VIDEO is legacy (older orders only); the UI no longer offers it.
 */
export type RequiredEvidenceType =
  | 'IMAGE'
  | 'VIDEO'
  | 'IMAGE_AND_VIDEO'
  | 'IMAGE_OR_VIDEO'

export type OrderStatus =
  | 'DRAFT'
  | 'AI_ANALYZED'
  | 'SUBMITTED'
  | 'PENDING'
  | 'NEEDS_INFO'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'

export type MissionStatus =
  | 'PLANNING'
  // Legacy values are retained while old mocks/history records are migrated.
  | 'CREATED'
  | 'WAITING_DEPOSIT'
  | 'READY'
  | 'RESOURCE_ASSIGNING'
  | 'WAITING_CREW_CONFIRMATION'
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'SCHEDULED'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'IN_PROGRESS'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'PENDING_REVIEW'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type DroneStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PREFLIGHT'
  | 'IN_MISSION'
  | 'ACTIVE_MISSION'
  | 'RETURNING'
  | 'CHARGING'
  | 'IDLE_CHARGING'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE'
  | 'OFFLINE'

/** `ai_analysis_session.overall_verdict` [BRIEF A4] */
export type AiVerdict = 'FEASIBLE' | 'RISKY' | 'INFEASIBLE'

/** `feasibility_rule.severity` / `ai_finding.severity` [BRIEF A4] */
export type FindingSeverity = 'INFO' | 'WARNING' | 'BLOCKER'

/** `maintenance_ticket.status` [TK] */
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

/** `maintenance_ticket.severity` [BRIEF A5] */
export type TicketSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/** `media_asset.media_status` [BRIEF A8] */
export type MediaStatus =
  | 'PENDING_UPLOAD'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'VALIDATION_FAILED'
  | 'AVAILABLE'
  | 'MANUAL_REQUIRED'
