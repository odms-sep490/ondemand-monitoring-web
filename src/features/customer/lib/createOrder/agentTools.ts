/**
 * V4 Tool Design Registry & Controlled Business Knowledge Tools.
 *
 * Follows the `tool-design` and `gemini-api-dev` skills:
 * - Every tool declares clear purpose, typed parameter schema (Gemini Function Calling compatible),
 *   required permissions, expected output, possible errors, side effects, reversibility,
 *   state dependencies, and dependency execution priority.
 * - No arbitrary code execution, no invented service IDs, no fabricated prices or coordinates.
 */
import type { CatalogService, SectionTarget } from './orderActionAgent'
import type { FlightPurpose, FormState } from './types'

export type ToolPermission = 'CUSTOMER_DRAFT_WRITE' | 'CUSTOMER_UI_NAVIGATE' | 'CUSTOMER_READ_CATALOG' | 'CUSTOMER_CONFIRM_REQUIRED'

export type ToolReversibility = 'REVERSIBLE_UNDO' | 'REVERSIBLE_NAV' | 'READ_ONLY' | 'IRREVERSIBLE_REQUIRES_CONFIRM'

export type ToolDefinition = {
  name: string
  purpose: string
  parameters: {
    type: 'object'
    properties: Record<string, { type: string; description: string; enum?: readonly string[]; minimum?: number; maximum?: number }>
    required: string[]
  }
  requiredPermissions: ToolPermission[]
  expectedOutput: string
  possibleErrors: string[]
  sideEffects: string[]
  reversibility: ToolReversibility
  stateDependencies: string[]
  /** Lower priority executes first in multi-action plans (dependency ordering). */
  executionPriority: number
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  undo: {
    name: 'undo',
    purpose: 'Hoàn tác thao tác gần nhất của trợ lý AI trên bản nháp.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Khôi phục bản nháp về trạng thái ngay trước thao tác AI gần nhất.',
    possibleErrors: ['NO_UNDO_HISTORY', 'MANUAL_EDIT_CONFLICT'],
    sideEffects: ['Restores previous FormState snapshot', 'Pushes snapshot to redo stack'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['draftHistory.canUndo'],
    executionPriority: 5,
  },
  redo: {
    name: 'redo',
    purpose: 'Áp dụng lại thao tác vừa hoàn tác của trợ lý AI.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Khôi phục lại thay đổi vừa bị hoàn tác.',
    possibleErrors: ['NO_REDO_HISTORY', 'MANUAL_EDIT_CONFLICT'],
    sideEffects: ['Restores undone FormState snapshot'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['draftHistory.canRedo'],
    executionPriority: 5,
  },
  keep_previous: {
    name: 'keep_previous',
    purpose: 'Giữ nguyên các trường tương thích đã nhập và hủy ý định chọn lại đang mở.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Giữ nguyên bản nháp hiện tại.',
    possibleErrors: [],
    sideEffects: ['Cancels active reselection mode'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: [],
    executionPriority: 10,
  },
  clear_service: {
    name: 'clear_service',
    purpose: 'Bỏ chọn dịch vụ hiện tại và xóa dữ liệu phụ thuộc dịch vụ cũ nhưng giữ thông tin tương thích.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'serviceId, deliverableTypeId và checklist phụ thuộc dịch vụ được xóa.',
    possibleErrors: [],
    sideEffects: ['Clears serviceId, deliverableTypeId, agentChecklistItems'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 15,
  },
  select_service: {
    name: 'select_service',
    purpose: 'Chọn hoặc đổi dịch vụ giám sát theo đúng ID có thật trong catalog.',
    parameters: {
      type: 'object',
      properties: {
        serviceId: { type: 'string', description: 'ID dịch vụ hợp lệ trong catalog đang hoạt động.' },
      },
      required: ['serviceId'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật serviceId trên bản nháp; tự động reset checklist/deliverable phụ thuộc dịch vụ cũ và giữ lại thông tin tương thích.',
    possibleErrors: ['SERVICE_NOT_FOUND', 'SERVICE_INACTIVE'],
    sideEffects: ['Updates form.serviceId', 'Clears service-dependent checklist & deliverable if service changed'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['catalog.services'],
    executionPriority: 20,
  },
  set_flight_purpose: {
    name: 'set_flight_purpose',
    purpose: 'Đặt mục đích chuyến bay theo enum hợp lệ của hệ thống.',
    parameters: {
      type: 'object',
      properties: {
        purpose: {
          type: 'string',
          description: 'Mã mục đích bay hợp lệ.',
          enum: ['SURVEY_MONITORING', 'CONSTRUCTION_MONITORING', 'INDUSTRIAL_INSPECTION', 'AGRICULTURE', 'FOREST_MONITORING', 'AREA_MONITORING', 'OTHER'],
        },
      },
      required: ['purpose'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật form.flightPurpose.',
    possibleErrors: ['INVALID_FLIGHT_PURPOSE'],
    sideEffects: ['Updates form.flightPurpose'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 30,
  },
  set_description: {
    name: 'set_description',
    purpose: 'Cập nhật mô tả nhiệm vụ giám sát theo nội dung khách cung cấp.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Nội dung mô tả nhiệm vụ (tối đa 2000 ký tự).' },
      },
      required: ['text'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật form.description.',
    possibleErrors: ['DESCRIPTION_EMPTY_OR_TOO_LONG'],
    sideEffects: ['Updates form.description'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 32,
  },
  checklist_select_all: {
    name: 'checklist_select_all',
    purpose: 'Tích chọn tất cả hạng mục checklist của dịch vụ đang chọn thông qua handler thật của editor.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Số lượng hạng mục checklist đã thay đổi.',
    possibleErrors: ['SERVICE_NOT_SELECTED', 'CHECKLIST_NOT_READY'],
    sideEffects: ['Mutates checklist selection state'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['form.serviceId', 'handlers.checklistSelectAll'],
    executionPriority: 40,
  },
  checklist_clear_all: {
    name: 'checklist_clear_all',
    purpose: 'Bỏ chọn các hạng mục checklist tùy chọn thông qua handler thật của editor.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Số lượng hạng mục checklist đã bỏ chọn.',
    possibleErrors: ['SERVICE_NOT_SELECTED', 'CHECKLIST_NOT_READY'],
    sideEffects: ['Mutates checklist selection state'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['form.serviceId', 'handlers.checklistClearAll'],
    executionPriority: 40,
  },
  checklist_set_videos: {
    name: 'checklist_set_videos',
    purpose: 'Đặt số lượng video cho các hạng mục checklist hỗ trợ video (0 để bỏ quay video).',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'integer', description: 'Số video mỗi hạng mục (0..20).', minimum: 0, maximum: 20 },
      },
      required: ['count'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Số hạng mục đã cập nhật số lượng video.',
    possibleErrors: ['SERVICE_NOT_SELECTED', 'CHECKLIST_NOT_READY', 'INVALID_VIDEO_COUNT'],
    sideEffects: ['Updates requestedVideoCount on checklist items'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: ['form.serviceId', 'handlers.checklistSetVideos'],
    executionPriority: 45,
  },
  set_contact: {
    name: 'set_contact',
    purpose: 'Cập nhật tên người liên hệ và/hoặc số điện thoại tại hiện trường.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Họ tên người liên hệ (tối đa 120 ký tự).' },
        phone: { type: 'string', description: 'Số điện thoại Việt Nam hợp lệ (0/+84 + 9-10 chữ số).' },
      },
      required: [],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật siteContactName và/hoặc siteContactPhone.',
    possibleErrors: ['INVALID_PHONE_FORMAT', 'EMPTY_CONTACT'],
    sideEffects: ['Updates form.siteContactName / form.siteContactPhone'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 50,
  },
  set_altitude: {
    name: 'set_altitude',
    purpose: 'Cập nhật độ cao bay mong muốn (10m đến 120m theo quy định an toàn bay).',
    parameters: {
      type: 'object',
      properties: {
        altitudeM: { type: 'number', description: 'Độ cao bay tính bằng mét (10..120).', minimum: 10, maximum: 120 },
      },
      required: ['altitudeM'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật form.altitudeM.',
    possibleErrors: ['ALTITUDE_OUT_OF_RANGE'],
    sideEffects: ['Updates form.altitudeM'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 52,
  },
  set_monitoring_relationship: {
    name: 'set_monitoring_relationship',
    purpose: 'Cập nhật quan hệ của khách hàng với khu vực giám sát.',
    parameters: {
      type: 'object',
      properties: {
        relationship: {
          type: 'string',
          description: 'Vai trò giám sát hợp lệ.',
          enum: ['OWNER', 'AUTHORIZED_PERSON', 'CONTRACTOR', 'MANAGER_OR_SUPERVISOR', 'OTHER'],
        },
      },
      required: ['relationship'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật form.monitoringRelationship.',
    possibleErrors: ['INVALID_RELATIONSHIP'],
    sideEffects: ['Updates form.monitoringRelationship'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 54,
  },
  set_access_notes: {
    name: 'set_access_notes',
    purpose: 'Cập nhật ghi chú điều kiện ra vào hiện trường.',
    parameters: {
      type: 'object',
      properties: {
        notes: { type: 'string', description: 'Ghi chú ra vào hiện trường (tối đa 1000 ký tự).' },
      },
      required: ['notes'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật form.accessNotes.',
    possibleErrors: ['EMPTY_OR_TOO_LONG'],
    sideEffects: ['Updates form.accessNotes'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 55,
  },
  set_schedule: {
    name: 'set_schedule',
    purpose: 'Đặt khoảng ngày bay dự kiến (YYYY-MM-DD) và khung giờ nếu khách nêu rõ.',
    parameters: {
      type: 'object',
      properties: {
        dateFrom: { type: 'string', description: 'Ngày bắt đầu định dạng YYYY-MM-DD.' },
        dateTo: { type: 'string', description: 'Ngày kết thúc định dạng YYYY-MM-DD.' },
        preferredTimeId: { type: 'string', description: 'ID khung giờ hợp lệ trong catalog.' },
      },
      required: ['dateFrom', 'dateTo'],
    },
    requiredPermissions: ['CUSTOMER_DRAFT_WRITE'],
    expectedOutput: 'Cập nhật preferredDateFrom và preferredDateTo.',
    possibleErrors: ['INVALID_CALENDAR_DATE', 'DATE_RANGE_REVERSED'],
    sideEffects: ['Updates form.preferredDateFrom / preferredDateTo'],
    reversibility: 'REVERSIBLE_UNDO',
    stateDependencies: [],
    executionPriority: 60,
  },
  open_map: {
    name: 'open_map',
    purpose: 'Mở bước bản đồ (Bước 2) để khách hàng xác nhận chính xác vị trí và vùng bay.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Chuyển giao diện sang Bước 2 (Bản đồ).',
    possibleErrors: [],
    sideEffects: ['Navigates active step to 2'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: ['handlers.openStep'],
    executionPriority: 70,
  },
  reopen_selection: {
    name: 'reopen_selection',
    purpose: 'Mở lại chính xác khu vực/bước khách hàng muốn chỉnh sửa mà không xóa dữ liệu đã có.',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Khu vực cần mở lại.',
          enum: ['service', 'purpose', 'description', 'location', 'checklist', 'contact', 'schedule', 'review'],
        },
      },
      required: ['target'],
    },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Mở giao diện chỉnh sửa khu vực tương ứng.',
    possibleErrors: ['INVALID_SECTION_TARGET'],
    sideEffects: ['Updates activeSection & activeStep'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: ['handlers.reopenSection'],
    executionPriority: 75,
  },
  navigate_step: {
    name: 'navigate_step',
    purpose: 'Chuyển trực tiếp đến bước 1..6 trong quy trình tạo yêu cầu.',
    parameters: {
      type: 'object',
      properties: {
        step: { type: 'integer', description: 'Số bước (1..6).', minimum: 1, maximum: 6 },
      },
      required: ['step'],
    },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Mở bước đích.',
    possibleErrors: ['INVALID_STEP'],
    sideEffects: ['Updates activeStep'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: ['handlers.openStep'],
    executionPriority: 75,
  },
  go_back: {
    name: 'go_back',
    purpose: 'Quay lại bước trước đó và giữ nguyên toàn bộ dữ liệu đã nhập.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Chuyển về bước trước.',
    possibleErrors: [],
    sideEffects: ['Updates activeStep'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: ['handlers.goBack'],
    executionPriority: 75,
  },
  continue_workflow: {
    name: 'continue_workflow',
    purpose: 'Hủy chế độ chọn lại và chuyển tiếp đến bước tiếp theo còn thiếu.',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_UI_NAVIGATE'],
    expectedOutput: 'Chuyển sang bước còn thiếu kế tiếp.',
    possibleErrors: [],
    sideEffects: ['Cancels reselection', 'Updates activeStep'],
    reversibility: 'REVERSIBLE_NAV',
    stateDependencies: ['handlers.continueWorkflow'],
    executionPriority: 80,
  },
  reset: {
    name: 'reset',
    purpose: 'Mở hộp thoại xác nhận làm lại bản nháp từ đầu (không bao giờ tự xóa khi chưa xác nhận).',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_CONFIRM_REQUIRED'],
    expectedOutput: 'Hiển thị hộp thoại xác nhận reset.',
    possibleErrors: [],
    sideEffects: ['Opens confirmation modal'],
    reversibility: 'IRREVERSIBLE_REQUIRES_CONFIRM',
    stateDependencies: [],
    executionPriority: 90,
  },
  submit: {
    name: 'submit',
    purpose: 'Kiểm tra đủ điều kiện gửi đơn và mở hộp thoại xác nhận gửi yêu cầu (không bao giờ tự gửi ngầm).',
    parameters: { type: 'object', properties: {}, required: [] },
    requiredPermissions: ['CUSTOMER_CONFIRM_REQUIRED'],
    expectedOutput: 'Chặn nếu còn thiếu bước, hoặc mở hộp thoại xác nhận gửi yêu cầu.',
    possibleErrors: ['MISSING_REQUIRED_STEPS', 'SUBMIT_IN_FLIGHT'],
    sideEffects: ['Opens submission confirmation modal if valid'],
    reversibility: 'IRREVERSIBLE_REQUIRES_CONFIRM',
    stateDependencies: ['stepValidity', 'checklistValid'],
    executionPriority: 95,
  },
}

/** Export Gemini-compatible FunctionDeclaration list directly from TOOL_REGISTRY. */
export function getGeminiFunctionDeclarations() {
  return Object.values(TOOL_REGISTRY).map((tool) => ({
    name: tool.name,
    description: `${tool.purpose} [Reversibility: ${tool.reversibility}]`,
    parameters: tool.parameters,
  }))
}

export function getExecutionPriority(actionType: string): number {
  return TOOL_REGISTRY[actionType]?.executionPriority ?? 50
}

/** Controlled Business Knowledge lookup backed strictly by authoritative catalog & draft state. */
export function queryBusinessKnowledge(
  topic: 'services' | 'pricing' | 'schedule_rules' | 'permissions' | 'draft_summary',
  services: CatalogService[],
  form: FormState,
  purposeLabels: Record<FlightPurpose, string>,
): string {
  switch (topic) {
    case 'services': {
      const active = services.filter((s) => s.isActive !== false)
      if (!active.length) return 'Hiện chưa tải được danh sách dịch vụ hoạt động.'
      return `Các dịch vụ hiện có: ${active.map((s, i) => `${i + 1}. ${s.name}`).join('; ')}.`
    }
    case 'pricing':
      return 'Giá hiển thị trên bản nháp chỉ là tạm tính tham khảo theo diện tích và hạng mục; quản lý sẽ xác nhận báo giá chính thức trước khi triển khai.'
    case 'schedule_rules':
      return 'Lịch bay yêu cầu ngày kết thúc không trước ngày bắt đầu và tuân theo ngày đặt sớm nhất của hệ thống; khách chọn thêm khung giờ ưu tiên.'
    case 'permissions':
      return 'Trợ lý chỉ cập nhật bản nháp yêu cầu của chính tài khoản đang đăng nhập; không tự gửi đơn, không tự ký điều khoản, không cấp phép bay và không sửa giá.'
    case 'draft_summary': {
      const svc = services.find((s) => s.id === form.serviceId)?.name ?? 'Chưa chọn'
      const purpose = form.flightPurpose ? purposeLabels[form.flightPurpose] : 'Chưa chọn'
      const contact = [form.siteContactName, form.siteContactPhone].filter(Boolean).join(' - ') || 'Chưa nhập'
      const schedule = form.preferredDateFrom
        ? `${form.preferredDateFrom}${form.preferredDateTo && form.preferredDateTo !== form.preferredDateFrom ? ` đến ${form.preferredDateTo}` : ''}`
        : 'Chưa chọn'
      return `Bản nháp hiện tại: Dịch vụ ${svc}; Mục đích ${purpose}; Liên hệ ${contact}; Lịch bay ${schedule}.`
    }
  }
}

export const SECTION_STEP_MAP: Record<SectionTarget, 1 | 2 | 3 | 4 | 5 | 6> = {
  service: 1,
  purpose: 1,
  description: 1,
  location: 2,
  checklist: 3,
  contact: 4,
  schedule: 5,
  review: 6,
}
