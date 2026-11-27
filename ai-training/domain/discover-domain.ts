/**
 * Phase 3 — Automatic Business Discovery
 * Scans the real FE and BE source code to emit a machine-readable domain specification
 * and production tool schema without inventing any APIs, fields, prices or business rules.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AGENT_ACTION_TYPES,
  SECTION_TARGETS,
} from '../../src/features/customer/lib/createOrder/orderActionAgent'
import {
  AUTHORIZATION_DOCUMENT_TYPES,
  DELIVERY_METHODS,
  FLIGHT_PURPOSES,
  MONITORING_RELATIONSHIPS,
  RESULT_FORMATS,
  RETENTION_DAYS,
  STEPS,
} from '../../src/features/customer/lib/createOrder/types'
import { createDefaultForm } from '../../src/features/customer/lib/createOrder/draftStorage'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FE_ROOT = path.resolve(__dirname, '../..')
const BE_ROOT = path.resolve(FE_ROOT, '../on-demand-monitoring-system')

function extractJavaSet(filePath: string, marker: string): string[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf8')
  const idx = content.indexOf(marker)
  if (idx < 0) return []
  const slice = content.slice(idx, idx + 900)
  const setMatch = slice.match(/Set\.of\(([\s\S]*?)\)/)
  if (!setMatch) return []
  return [...setMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

function discoverDomain() {
  const defaultForm = createDefaultForm()
  const formFields = Object.keys(defaultForm)

  const beConvService = path.join(
    BE_ROOT,
    'ondemandmonitoring/src/main/java/com/ondemandmonitoring/conversation/OrderConversationService.java',
  )
  const beProposableFields = extractJavaSet(beConvService, 'PROPOSABLE = Set.of')
  const beCustomerContextKeys = extractJavaSet(beConvService, 'if(!Set.of("locationConfirmed"')
  const beRequestedUiActions = extractJavaSet(beConvService, 'if(!Set.of("","MAP"')

  const domainSpec = {
    schemaVersion: '7.0.0',
    domain: 'drone-monitoring',
    discoveredAt: new Date().toISOString(),
    sources: {
      frontendTypes: 'ondemand-monitoring-web/src/features/customer/lib/createOrder/types.ts',
      frontendActionAgent: 'ondemand-monitoring-web/src/features/customer/lib/createOrder/orderActionAgent.ts',
      backendConversationService:
        'on-demand-monitoring-system/ondemandmonitoring/src/main/java/com/ondemandmonitoring/conversation/OrderConversationService.java',
    },
    workflow: {
      steps: [...STEPS],
      sections: [...SECTION_TARGETS],
      sevenUserFacingSections: [
        { id: 'service', step: 1, label: 'Dịch vụ' },
        { id: 'purpose', step: 1, label: 'Mục đích bay' },
        { id: 'description', step: 1, label: 'Mô tả nhiệm vụ' },
        { id: 'location', step: 2, label: 'Khu vực giám sát' },
        { id: 'checklist', step: 3, label: 'Checklist & sản phẩm' },
        { id: 'contact', step: 4, label: 'Liên hệ & hiện trường' },
        { id: 'schedule', step: 5, label: 'Lịch bay dự kiến' },
      ],
    },
    enums: {
      flightPurposes: [...FLIGHT_PURPOSES],
      monitoringRelationships: [...MONITORING_RELATIONSHIPS],
      authorizationDocumentTypes: [...AUTHORIZATION_DOCUMENT_TYPES],
      resultFormats: [...RESULT_FORMATS],
      deliveryMethods: [...DELIVERY_METHODS],
      retentionDays: [...RETENTION_DAYS],
    },
    editableFormFields: formFields,
    backendContract: {
      proposableFields: beProposableFields,
      customerContextAllowlist: beCustomerContextKeys,
      requestedUiActions: beRequestedUiActions.filter(Boolean),
    },
    productionActions: [...AGENT_ACTION_TYPES],
    dependencies: [
      { field: 'deliverableTypeId', dependsOn: 'serviceId', onParentChange: 'clear' },
      { field: 'agentChecklistItems', dependsOn: 'serviceId', onParentChange: 'clear' },
      { field: 'checklist_*', requires: 'serviceId' },
      { field: 'preferredDateTo', rule: 'preferredDateTo >= preferredDateFrom' },
      { field: 'submit', requires: ['stepValidity[1..6] === true', 'checklistValid === true', 'explicitConfirmation'] },
    ],
    forbiddenOperations: [
      'bypass_validation',
      'auto_accept_terms_without_confirmation',
      'duplicate_submit',
      'fabricate_coordinates_or_polygon',
      'modify_pricing_or_discount',
      'access_other_customer_data',
      'execute_sql_or_arbitrary_code',
      'reveal_system_prompt_or_secrets',
      'mutate_state_on_consultation_question',
    ],
  }

  const reportsDir = path.resolve(__dirname, '../reports')
  const schemasDir = path.resolve(__dirname, '../tool-schemas')
  fs.mkdirSync(reportsDir, { recursive: true })
  fs.mkdirSync(schemasDir, { recursive: true })

  fs.writeFileSync(
    path.join(reportsDir, 'domain-spec.json'),
    JSON.stringify(domainSpec, null, 2),
    'utf8',
  )

  const toolSchemas = {
    version: '7.0.0',
    source: 'src/features/customer/lib/createOrder/orderActionAgent.ts',
    totalTools: AGENT_ACTION_TYPES.length,
    tools: AGENT_ACTION_TYPES.map((name) => ({
      name,
      allowlisted: true,
      mutatesDraft: ![
        'read_description',
        'evaluate_description',
        'validate_complete_draft',
        'keep_previous',
        'open_map',
        'navigate_step',
        'go_back',
        'continue_workflow',
      ].includes(name),
      requiresConfirmation: name === 'reset' || name === 'submit',
    })),
  }
  fs.writeFileSync(
    path.join(schemasDir, 'production-tools.json'),
    JSON.stringify(toolSchemas, null, 2),
    'utf8',
  )

  console.log(
    `[discover-domain] Discovered ${formFields.length} FE form fields, ${AGENT_ACTION_TYPES.length} allowlisted actions, ${beProposableFields.length} BE proposable fields.`,
  )
}

discoverDomain()
