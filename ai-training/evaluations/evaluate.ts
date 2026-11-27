/**
 * Phase 13 & 15 — Deterministic Exact-State Evaluation Engine
 * Runs the ACTUAL production `parseUtterance` + `executeFormActions` engine on any dataset split
 * and computes exact-state, tool-selection, tool-argument, forbidden-tool, false-success,
 * unauthorized-mutation, and latency metrics without fabricating scores.
 *
 * Usage:
 *   npx tsx ai-training/evaluations/evaluate.ts --split dev --out ai-training/reports/baseline-dev.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  executeFormActions,
  parseUtterance,
  replyFromResults,
  type AgentAction,
} from '../../src/features/customer/lib/createOrder/orderActionAgent'
import {
  makeInitialDraft,
  SIMULATED_PREFERRED_TIMES,
  SIMULATED_PURPOSE_LABELS,
  SIMULATED_SERVICES,
  SIMULATED_TODAY,
  SYNTHETIC_CUSTOMERS,
  type BenchmarkScenario,
} from '../domain/drone-monitoring-domain'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type FailureRecord = {
  scenarioId: string
  scenarioFamily: string
  category: string
  subcategory: string
  userMessage: string
  failureTypes: string[]
  expectedToolSequences: string[][]
  actualToolSequence: string[]
  expectedFinalDraft: Record<string, unknown>
  actualFinalDraft: Record<string, unknown>
  reply: string
}

const ASYNC_ONLY_ACTIONS = new Set([
  'undo',
  'redo',
  'reset',
  'submit',
  'confirm_submit',
  'search_location',
  'evaluate_description',
  'clarify_description',
  'improve_description',
  'apply_description',
  'validate_complete_draft',
])

function evaluateScenario(s: BenchmarkScenario): {
  passed: boolean
  intentOk: boolean
  toolOk: boolean
  argOk: boolean
  stateOk: boolean
  falseSuccess: boolean
  unauthorizedMutation: boolean
  latencyMs: number
  failure?: FailureRecord
} {
  const t0 = performance.now()
  const initialForm = makeInitialDraft(s.initialDraft)
  const stepBySection: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
    service: 1,
    purpose: 1,
    description: 1,
    location: 2,
    checklist: 3,
    contact: 4,
    schedule: 5,
    review: 6,
  }
  const hasActiveDescQuestion =
    s.subcategory === 'description_4stage_clarify' ||
    s.conversationHistory.some((m) => m.role === 'assistant' && /\?/.test(m.content) && s.initialActiveSection === 'description')

  const plan = parseUtterance(s.userMessage, {
    services: SIMULATED_SERVICES,
    displayedServices: SIMULATED_SERVICES,
    preferredTimes: SIMULATED_PREFERRED_TIMES,
    today: SIMULATED_TODAY,
    memory: {
      activeStep: stepBySection[s.initialActiveSection] ?? 1,
      activeSection: s.initialActiveSection,
      currentServiceId: initialForm.serviceId,
      hasFlightPurpose: Boolean(initialForm.flightPurpose),
      hasDescription: Boolean(initialForm.description.trim()),
      hasActiveDescriptionQuestion: hasActiveDescQuestion,
      hasGeneratedDescription: s.subcategory === 'description_4stage_apply',
      canRedo: s.subcategory === 'redo_undone_action',
    },
  })

  const syncActions = plan.actions.filter((a) => !ASYNC_ONLY_ACTIONS.has(a.type))
  let openedSection: string | null = null
  const executed = executeFormActions(initialForm, syncActions, {
    services: SIMULATED_SERVICES,
    purposeLabels: SIMULATED_PURPOSE_LABELS,
    handlers: {
      preferredTimes: SIMULATED_PREFERRED_TIMES,
      getAccountContact: () => ({
        fullName: SYNTHETIC_CUSTOMERS[0].fullName,
        phone: SYNTHETIC_CUSTOMERS[0].phone,
        email: SYNTHETIC_CUSTOMERS[0].email,
      }),
      checklistSelectAll: () => (initialForm.serviceId ? 3 : null),
      checklistClearAll: () => (initialForm.serviceId ? 3 : null),
      checklistSelectMandatoryOnly: () => (initialForm.serviceId ? 2 : null),
      checklistToggleItem: () => (initialForm.serviceId ? true : null),
      checklistSetImages: () => (initialForm.serviceId ? 2 : null),
      checklistSetVideos: () => (initialForm.serviceId ? 2 : null),
      reopenSection: (target) => {
        openedSection = target
      },
      openStep: (step) => {
        const rev: Record<number, string> = { 1: 'service', 2: 'location', 3: 'checklist', 4: 'contact', 5: 'schedule', 6: 'review' }
        openedSection = rev[step] ?? null
      },
    },
  })

  const latencyMs = performance.now() - t0
  const actualSeq = plan.actions.map((a) => a.type)
  const reply = replyFromResults(executed.results, plan.clarification)
  const failureTypes: string[] = []

  // 1. Forbidden tool check
  const forbiddenHit = actualSeq.some((t) => s.forbiddenToolCalls.includes(t))
  if (forbiddenHit) failureTypes.push('forbidden_tool_called')

  // 2. Acceptable tool sequence check
  const toolOk =
    !forbiddenHit &&
    s.acceptableToolSequences.some((acceptable) => {
      if (acceptable.length !== actualSeq.length) return false
      return acceptable.every((t, idx) => actualSeq[idx] === t)
    })
  if (!toolOk) failureTypes.push('tool_sequence_mismatch')

  // 3. Tool arguments check (for every expected key, verify at least one action carries that exact value)
  let argOk = true
  for (const [k, expectedVal] of Object.entries(s.expectedToolArguments ?? {})) {
    const matched = plan.actions.some((a) => (a as Record<string, unknown>)[k] === expectedVal)
    if (!matched) {
      argOk = false
      failureTypes.push(`arg_mismatch:${k}`)
    }
  }

  // 4. Final draft state check
  let stateOk = true
  for (const [field, expectedVal] of Object.entries(s.expectedFinalDraft ?? {})) {
    const actualVal = (executed.form as Record<string, unknown>)[field]
    if (actualVal !== expectedVal) {
      stateOk = false
      failureTypes.push(`state_mismatch:${field}`)
    }
  }

  // 5. Preserved fields check
  for (const field of s.expectedPreservedFields ?? []) {
    const beforeVal = (initialForm as Record<string, unknown>)[field]
    const afterVal = (executed.form as Record<string, unknown>)[field]
    if (beforeVal !== afterVal) {
      stateOk = false
      failureTypes.push(`preserved_field_clobbered:${field}`)
    }
  }

  // 6. False success detection on blocked_validation scenarios
  const falseSuccess =
    s.expectedValidationOutcome === 'blocked_validation' &&
    (executed.results.some((r) => r.ok) || /^Đã\b/.test(reply))
  if (falseSuccess) failureTypes.push('false_success_message')

  // 7. Unauthorized mutation detection on safety / consultation / clarification / no_mutation
  const draftChanged = JSON.stringify(executed.form) !== JSON.stringify(initialForm)
  const unauthorizedMutation =
    (s.expectedValidationOutcome === 'blocked_safety' ||
      s.expectedValidationOutcome === 'no_mutation' ||
      s.expectedValidationOutcome === 'clarification_required') &&
    (draftChanged || actualSeq.length > 0)
  if (unauthorizedMutation) failureTypes.push('unauthorized_state_change')

  // 8. Intent check
  const intentOk =
    toolOk ||
    (s.expectedValidationOutcome === 'clarification_required' && Boolean(plan.clarification) && actualSeq.length === 0) ||
    (s.expectedValidationOutcome === 'blocked_safety' && actualSeq.length === 0)

  // Keep openedSection referenced for reopen_selection verification
  if (s.expectedIntent === 'reopen_selection' && s.expectedVisibleSection && openedSection !== s.expectedVisibleSection) {
    stateOk = false
    failureTypes.push(`visible_section_mismatch:${openedSection}`)
  }

  const passed = failureTypes.length === 0
  return {
    passed,
    intentOk,
    toolOk,
    argOk,
    stateOk,
    falseSuccess,
    unauthorizedMutation,
    latencyMs,
    failure: passed
      ? undefined
      : {
          scenarioId: s.scenarioId,
          scenarioFamily: s.scenarioFamily,
          category: s.category,
          subcategory: s.subcategory,
          userMessage: s.userMessage,
          failureTypes,
          expectedToolSequences: s.acceptableToolSequences,
          actualToolSequence: actualSeq,
          expectedFinalDraft: s.expectedFinalDraft as Record<string, unknown>,
          actualFinalDraft: Object.fromEntries(
            Object.keys(s.expectedFinalDraft ?? {}).map((k) => [k, (executed.form as Record<string, unknown>)[k]]),
          ),
          reply,
        },
  }
}

function main() {
  const args = process.argv.slice(2)
  const splitIdx = args.indexOf('--split')
  const outIdx = args.indexOf('--out')
  const split = splitIdx >= 0 ? args[splitIdx + 1] : 'dev'
  const outFile = outIdx >= 0 ? args[outIdx + 1] : `ai-training/reports/${split}-report.json`

  const datasetPath = path.resolve(__dirname, `../datasets/${split}.jsonl`)
  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset split not found: ${datasetPath}`)
  }
  const scenarios: BenchmarkScenario[] = fs
    .readFileSync(datasetPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l))

  let passedCount = 0
  let intentOkCount = 0
  let toolOkCount = 0
  let argOkCount = 0
  let stateOkCount = 0
  let falseSuccessCount = 0
  let unauthorizedMutationCount = 0
  let totalLatency = 0
  const failures: FailureRecord[] = []
  const byCategory: Record<string, { total: number; passed: number }> = {}

  for (const s of scenarios) {
    const r = evaluateScenario(s)
    totalLatency += r.latencyMs
    const bucket = byCategory[s.category] ?? { total: 0, passed: 0 }
    bucket.total += 1
    if (r.passed) {
      passedCount += 1
      bucket.passed += 1
    } else if (r.failure) {
      failures.push(r.failure)
    }
    byCategory[s.category] = bucket
    if (r.intentOk) intentOkCount += 1
    if (r.toolOk) toolOkCount += 1
    if (r.argOk) argOkCount += 1
    if (r.stateOk) stateOkCount += 1
    if (r.falseSuccess) falseSuccessCount += 1
    if (r.unauthorizedMutation) unauthorizedMutationCount += 1
  }

  const n = Math.max(1, scenarios.length)
  const pct = (v: number) => Number(((v / n) * 100).toFixed(2))

  const report = {
    evaluatedAt: new Date().toISOString(),
    split,
    sampleSize: scenarios.length,
    metrics: {
      overallPassRatePct: pct(passedCount),
      intentAccuracyPct: pct(intentOkCount),
      toolSelectionAccuracyPct: pct(toolOkCount),
      toolArgumentAccuracyPct: pct(argOkCount),
      finalStateCorrectnessPct: pct(stateOkCount),
      falseSuccessCount,
      unauthorizedStateChanges: unauthorizedMutationCount,
      avgLatencyMs: Number((totalLatency / n).toFixed(3)),
      apiCostUsd: 0,
    },
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [
        k,
        { ...v, passRatePct: Number(((v.passed / Math.max(1, v.total)) * 100).toFixed(2)) },
      ]),
    ),
    failureCount: failures.length,
    failuresByType: failures.reduce<Record<string, number>>((acc, f) => {
      for (const ft of f.failureTypes) acc[ft] = (acc[ft] ?? 0) + 1
      return acc
    }, {}),
    sampleFailures: failures.slice(0, 40),
  }

  const resolvedOut = path.resolve(process.cwd(), outFile)
  fs.mkdirSync(path.dirname(resolvedOut), { recursive: true })
  fs.writeFileSync(resolvedOut, JSON.stringify(report, null, 2), 'utf8')
  console.log(
    `[evaluate:${split}] n=${scenarios.length} | pass=${report.metrics.overallPassRatePct}% | tool=${report.metrics.toolSelectionAccuracyPct}% | state=${report.metrics.finalStateCorrectnessPct}% | falseSuccess=${falseSuccessCount} | unauth=${unauthorizedMutationCount} | failures=${failures.length}`,
  )
}

main()
