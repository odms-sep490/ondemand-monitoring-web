/**
 * Phase 4 — Tau-Bench-inspired `drone-monitoring` Benchmark Domain
 * Completely isolated from production databases and real customers.
 * Uses synthetic catalog, profiles, and exact production FormState contracts.
 */
import type {
  AgentServiceOption,
  PreferredTimeCatalogItem,
} from '../../src/features/customer/lib/createOrder/orderActionAgent'
import { createDefaultForm } from '../../src/features/customer/lib/createOrder/draftStorage'
import type { FormState } from '../../src/features/customer/lib/createOrder/types'

export const SIMULATED_TODAY = '2026-11-27'

export const SIMULATED_SERVICES: AgentServiceOption[] = [
  { id: 'svc-build', name: 'Giám sát công trình', isActive: true },
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng', isActive: true },
  { id: 'svc-solar', name: 'Giám sát điện mặt trời', isActive: true },
  { id: 'svc-forest', name: 'Giám sát rừng', isActive: true },
]

export const SIMULATED_PREFERRED_TIMES: PreferredTimeCatalogItem[] = [
  { id: 'time-morning', name: 'Buổi sáng', startTime: '07:00', endTime: '11:30' },
  { id: 'time-afternoon', name: 'Buổi chiều', startTime: '13:00', endTime: '17:30' },
]

export const SIMULATED_PURPOSE_LABELS: Record<string, string> = {
  CONSTRUCTION_MONITORING: 'Theo dõi tiến độ thi công',
  INDUSTRIAL_INSPECTION: 'Kiểm tra công nghiệp / nhà xưởng',
  SURVEY_MONITORING: 'Khảo sát và đo đạc hiện trạng',
  AREA_MONITORING: 'Giám sát khu vực tổng thể',
  FOREST_MONITORING: 'Giám sát rừng & cây xanh',
  AGRICULTURE: 'Giám sát nông nghiệp',
  OTHER: 'Mục đích khác',
}

export type SyntheticCustomerProfile = {
  id: string
  fullName: string
  phone: string
  email: string
  company: string
  region: 'north' | 'central' | 'south'
}

export const SYNTHETIC_CUSTOMERS: SyntheticCustomerProfile[] = [
  {
    id: 'syn-cus-01',
    fullName: 'Nguyễn Minh Quân',
    phone: '0901234567',
    email: 'quan.nguyen@synthetic.test',
    company: 'Công ty Xây dựng Minh Quân',
    region: 'south',
  },
  {
    id: 'syn-cus-02',
    fullName: 'Trần Thị Thu Hà',
    phone: '0912345678',
    email: 'ha.tran@synthetic.test',
    company: 'Nhà máy Cơ khí Sông Hồng',
    region: 'north',
  },
  {
    id: 'syn-cus-03',
    fullName: 'Lê Hoàng Phúc',
    phone: '0987654321',
    email: 'phuc.le@synthetic.test',
    company: 'Năng lượng Xanh Miền Trung',
    region: 'central',
  },
  {
    id: 'syn-cus-04',
    fullName: 'Phạm Quốc Bảo',
    phone: '0934567890',
    email: 'bao.pham@synthetic.test',
    company: 'Ban Quản lý Dự án Khu Đông',
    region: 'south',
  },
]

export function makeInitialDraft(overrides: Partial<FormState> = {}): FormState {
  return {
    ...createDefaultForm(),
    serviceId: '',
    flightPurpose: '',
    description: '',
    address: '',
    normalizedAddress: '',
    latitude: '',
    longitude: '',
    locationStatus: 'unconfirmed',
    siteContactName: '',
    siteContactPhone: '',
    accessNotes: '',
    preferredDateFrom: '',
    preferredDateTo: '',
    preferredTimeId: '',
    termsAccepted: false,
    ...overrides,
  }
}

export type BenchmarkScenario = {
  scenarioId: string
  scenarioFamily: string
  category:
    | 'language_understanding'
    | 'form_automation'
    | 'multi_turn'
    | 'consultation'
    | 'correction_undo'
    | 'multi_action'
    | 'voice_recognition'
    | 'memory_context'
    | 'failure_recovery'
    | 'business_validation'
    | 'authorization_safety'
    | 'noisy_unexpected'
  subcategory: string
  difficulty: 'easy' | 'medium' | 'hard'
  provenance: string
  initialDraft: Partial<FormState>
  initialActiveSection:
    | 'service'
    | 'purpose'
    | 'description'
    | 'location'
    | 'checklist'
    | 'contact'
    | 'schedule'
    | 'review'
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  userGoal: string
  userMessage: string
  expectedIntent: string
  acceptableToolSequences: string[][]
  expectedToolArguments: Record<string, unknown>
  forbiddenToolCalls: string[]
  expectedFinalDraft: Partial<FormState>
  expectedVisibleSection: string | null
  expectedPreservedFields: string[]
  expectedValidationOutcome: 'valid' | 'clarification_required' | 'blocked_safety' | 'blocked_validation' | 'no_mutation'
  expectedResponseCharacteristics: string[]
  expectedConfirmationRequirements: string[]
}
