import { createDefaultForm } from '../draftStorage'
import {
  DraftHistory,
  executeFormActions,
  parseUtterance,
  replyFromResults,
  submitBlockers,
  type ActionResult,
  type AgentAction,
  type SectionTarget,
} from '../orderActionAgent'
import type { FormState, Step } from '../types'
import {
  EVAL_CATALOG_SERVICES,
  EVAL_PURPOSE_LABELS,
  VIETNAMESE_EVAL_DATASET,
  type EvalCategory,
  type EvalScenario,
  type EvalSplit,
} from './vietnameseEvalDataset'

export type ScenarioOutcome = {
  id: string
  split: EvalSplit
  category: EvalCategory
  section: SectionTarget
  input: string
  passed: boolean
  intentOk: boolean
  toolOk: boolean
  argsOk: boolean
  navOk: boolean
  stateOk: boolean
  noForbiddenOk: boolean
  clarificationOk: boolean
  unnecessaryClarification: boolean
  falseSuccess: boolean
  latencyMs: number
  estimatedTokens: number
  actualActionTypes: string[]
  expectedActionTypes: string[]
  reply: string
  failureReasons: string[]
}

export type BenchmarkMetrics = {
  timestamp: string
  label: string
  totalScenarios: number
  devCount: number
  heldoutCount: number
  overall: SplitMetrics
  dev: SplitMetrics
  heldout: SplitMetrics
  byCategory: Record<EvalCategory, { total: number; passed: number; passRate: number }>
  sampleFailures: Array<{ id: string; split: EvalSplit; category: EvalCategory; input: string; reasons: string[] }>
}

export type SplitMetrics = {
  total: number
  passed: number
  endToEndCompletionRate: number
  intentAccuracy: number
  toolCallingAccuracy: number
  argumentCorrectness: number
  navigationAccuracy: number
  finalStateCorrectness: number
  vietnameseUnderstanding: number
  contextRetention: number
  correctionHandling: number
  unnecessaryClarificationRate: number
  falseSuccessRate: number
  avgLatencyMs: number
  p95LatencyMs: number
  avgEstimatedTokens: number
}

const pct = (num: number, den: number) => (den === 0 ? 100 : Math.round((num / den) * 1000) / 10)

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3.8))
}

export function evaluateScenario(scenario: EvalScenario): ScenarioOutcome {
  const start = performance.now()
  const baseForm: FormState = {
    ...createDefaultForm(),
    flightPurpose: '',
    serviceId: '',
    ...(scenario.initialForm ?? {}),
  }
  const history = new DraftHistory()
  history.observe(baseForm)

  // If testing undo/redo with prior AI action
  if (scenario.category === 'undo_redo' && !scenario.expectFalseSuccessForbidden) {
    const prevForm: FormState = { ...baseForm, serviceId: 'svc-factory' }
    const afterForm: FormState = { ...baseForm, serviceId: 'svc-build' }
    history.observe(prevForm)
    history.record(prevForm, afterForm)
    if (scenario.memory?.canRedo && typeof (history as unknown as { undo: () => unknown }).undo === 'function') {
      history.undo()
    }
  }

  const expectedVersion = history.current
  const plan = parseUtterance(scenario.input, {
    services: EVAL_CATALOG_SERVICES,
    displayedServices: EVAL_CATALOG_SERVICES,
    today: scenario.today ?? '2026-11-27',
    memory: {
      currentServiceId: baseForm.serviceId,
      hasFlightPurpose: Boolean(baseForm.flightPurpose),
      ...(scenario.memory ?? {}),
    },
  })

  // Simulate manual UI edit arriving concurrently before AI applies
  let currentForm = baseForm
  if (scenario.simulateManualEdit) {
    currentForm = { ...baseForm, accessNotes: 'Edited manually' }
    history.observe(currentForm)
  }

  let activeSection: SectionTarget | undefined = scenario.memory?.activeSection
  let activeStep: Step | undefined = scenario.memory?.activeStep
  let videosCount: number | undefined
  let checklistSelectedAll = false
  let checklistClearedAll = false
  let submitBlocked: boolean | undefined

  const results: ActionResult[] = []
  let finalForm = currentForm

  const specialTypes = new Set(['undo', 'redo', 'reset', 'submit'])
  const formActions = plan.actions.filter((a) => !specialTypes.has(a.type))

  if (scenario.simulateManualEdit) {
    if (!history.canApply(expectedVersion)) {
      results.push({
        action: formActions[0] ?? ({ type: 'keep_previous' } as AgentAction),
        ok: false,
        message: 'Bản nháp vừa thay đổi nên em chưa áp dụng.',
      })
    }
  } else {
    if (plan.actions.some((a) => a.type === 'undo')) {
      const undone = history.undo()
      if (undone.ok) finalForm = undone.form
      results.push({
        action: { type: 'undo' },
        ok: undone.ok,
        message: undone.ok ? 'Đã hoàn tác thao tác gần nhất.' : undone.reason,
      })
    }

    if (plan.actions.some((a) => (a.type as string) === 'redo')) {
      const histAny = history as unknown as {
        redo?: () => { ok: true; form: FormState } | { ok: false; reason: string }
      }
      if (typeof histAny.redo === 'function') {
        const redone = histAny.redo()
        if (redone.ok) finalForm = redone.form
        results.push({
          action: { type: 'redo' } as unknown as AgentAction,
          ok: redone.ok,
          message: redone.ok ? 'Đã làm lại thao tác vừa hoàn tác.' : redone.reason,
        })
      } else {
        results.push({
          action: { type: 'redo' } as unknown as AgentAction,
          ok: false,
          message: 'Chưa hỗ trợ làm lại.',
        })
      }
    }

    if (plan.actions.some((a) => a.type === 'reset')) {
      results.push({
        action: { type: 'reset' },
        ok: true,
        message: 'Anh/chị xác nhận trong hộp thoại để xóa bản nháp.',
      })
    }

    if (formActions.length > 0) {
      const executed = executeFormActions(finalForm, formActions, {
        services: EVAL_CATALOG_SERVICES,
        purposeLabels: EVAL_PURPOSE_LABELS,
        handlers: {
          checklistSelectAll: () => {
            if (!scenario.checklistReady) return null
            checklistSelectedAll = true
            return 3
          },
          checklistClearAll: () => {
            if (!scenario.checklistReady) return null
            checklistClearedAll = true
            return 3
          },
          checklistSetVideos: (count) => {
            if (!scenario.checklistReady) return null
            videosCount = count
            return 2
          },
          openStep: (step) => {
            activeStep = step
          },
          reopenSection: (target) => {
            activeSection = target
            const map: Partial<Record<SectionTarget, Step>> = {
              service: 1,
              purpose: 1,
              description: 1,
              location: 2,
              checklist: 3,
              contact: 4,
              schedule: 5,
              review: 6,
            }
            activeStep = map[target]
          },
          goBack: () => {
            const prev = Math.max(1, (activeStep ?? 2) - 1) as Step
            activeStep = prev
            return prev
          },
          continueWorkflow: () => {
            activeStep = 2
            return 2
          },
        },
      })
      if (executed.results.some((r) => r.action.type === 'search_location')) {
        activeStep = 2
      }
      finalForm = executed.form
      results.push(...executed.results)
    }

    if (plan.actions.some((a) => a.type === 'submit')) {
      const blockers = submitBlockers(scenario.stepValidity, scenario.checklistValid)
      submitBlocked = blockers.length > 0
      results.push({
        action: { type: 'submit' },
        ok: !submitBlocked,
        message: submitBlocked
          ? `Chưa gửi được, còn thiếu bước ${blockers.join(', ')}.`
          : 'Anh/chị xác nhận gửi yêu cầu?',
      })
    }
  }

  const reply = replyFromResults(results, plan.clarification)
  const latencyMs = Math.max(0.01, performance.now() - start)
  const actualActionTypes = plan.actions.map((a) => a.type as string)
  const failureReasons: string[] = []

  // 1. Forbidden actions check
  const forbiddenHit = (scenario.forbiddenActionTypes ?? []).filter((f) => actualActionTypes.includes(f))
  const noForbiddenOk = forbiddenHit.length === 0
  if (!noForbiddenOk) failureReasons.push(`forbidden_action:${forbiddenHit.join(',')}`)

  // 2. Intent & Tool calling accuracy (accept V5 unified set_contact & search_location equivalents)
  const matchesExpectedAction = (expectedType: string) => {
    if (actualActionTypes.includes(expectedType)) return true
    if (
      (expectedType === 'set_altitude' ||
        expectedType === 'set_monitoring_relationship' ||
        expectedType === 'set_access_notes') &&
      actualActionTypes.includes('set_contact')
    ) {
      return true
    }
    if (expectedType === 'open_map' && actualActionTypes.includes('search_location')) {
      return true
    }
    return false
  }
  let toolOk = true
  if (scenario.simulateManualEdit) {
    toolOk = results.some((r) => !r.ok) && finalForm.siteContactName === scenario.expectedFinalState?.siteContactName
  } else if (scenario.expectedActionTypes.length === 0) {
    toolOk = actualActionTypes.length === 0
  } else {
    toolOk = scenario.expectedActionTypes.every(matchesExpectedAction)
  }
  if (!toolOk) {
    failureReasons.push(`expected_actions:[${scenario.expectedActionTypes.join(',')}] got:[${actualActionTypes.join(',')}]`)
  }

  // 3. Clarification accuracy
  const hasClarification = Boolean(plan.clarification)
  const clarificationOk = scenario.expectClarification ? hasClarification : !hasClarification
  const unnecessaryClarification = !scenario.expectClarification && hasClarification
  if (!clarificationOk) {
    failureReasons.push(scenario.expectClarification ? 'missing_clarification' : `unnecessary_clarification:${plan.clarification}`)
  }

  // 4. Argument correctness
  let argsOk = true
  if (scenario.expectedArgs) {
    for (const [key, val] of Object.entries(scenario.expectedArgs)) {
      const matched = plan.actions.some((a) => (a as Record<string, unknown>)[key] === val)
      if (!matched) {
        argsOk = false
        failureReasons.push(`arg_mismatch:${key}=${String(val)}`)
      }
    }
  }

  // 5. Navigation & Final state correctness
  let navOk = true
  let stateOk = true
  if (scenario.expectedFinalState) {
    const exp = scenario.expectedFinalState
    if (exp.activeSection !== undefined && activeSection !== exp.activeSection) {
      navOk = false
      failureReasons.push(`nav_section:expected=${exp.activeSection},got=${String(activeSection)}`)
    }
    if (exp.activeStep !== undefined && activeStep !== exp.activeStep) {
      navOk = false
      failureReasons.push(`nav_step:expected=${exp.activeStep},got=${String(activeStep)}`)
    }
    if (exp.serviceId !== undefined && finalForm.serviceId !== exp.serviceId) {
      stateOk = false
      failureReasons.push(`serviceId:expected=${exp.serviceId},got=${finalForm.serviceId}`)
    }
    if (exp.flightPurpose !== undefined && finalForm.flightPurpose !== exp.flightPurpose) {
      stateOk = false
      failureReasons.push(`flightPurpose:expected=${exp.flightPurpose},got=${finalForm.flightPurpose}`)
    }
    if (exp.description !== undefined && finalForm.description !== exp.description) {
      stateOk = false
      failureReasons.push(`description_mismatch`)
    }
    if (exp.siteContactName !== undefined && finalForm.siteContactName !== exp.siteContactName) {
      stateOk = false
      failureReasons.push(`contactName:expected=${exp.siteContactName},got=${finalForm.siteContactName}`)
    }
    if (exp.siteContactPhone !== undefined && finalForm.siteContactPhone !== exp.siteContactPhone) {
      stateOk = false
      failureReasons.push(`contactPhone:expected=${exp.siteContactPhone},got=${finalForm.siteContactPhone}`)
    }
    if (exp.preferredDateFrom !== undefined && finalForm.preferredDateFrom !== exp.preferredDateFrom) {
      stateOk = false
      failureReasons.push(`dateFrom:expected=${exp.preferredDateFrom},got=${finalForm.preferredDateFrom}`)
    }
    if (exp.preferredDateTo !== undefined && finalForm.preferredDateTo !== exp.preferredDateTo) {
      stateOk = false
      failureReasons.push(`dateTo:expected=${exp.preferredDateTo},got=${finalForm.preferredDateTo}`)
    }
    if (exp.altitudeM !== undefined && finalForm.altitudeM !== exp.altitudeM) {
      stateOk = false
      failureReasons.push(`altitudeM:expected=${exp.altitudeM},got=${String(finalForm.altitudeM)}`)
    }
    if (exp.monitoringRelationship !== undefined && finalForm.monitoringRelationship !== exp.monitoringRelationship) {
      stateOk = false
      failureReasons.push(`relationship:expected=${exp.monitoringRelationship},got=${String(finalForm.monitoringRelationship)}`)
    }
    if (exp.accessNotes !== undefined && finalForm.accessNotes !== exp.accessNotes) {
      stateOk = false
      failureReasons.push(`accessNotes_mismatch`)
    }
    if (exp.deliverableTypeId !== undefined && finalForm.deliverableTypeId !== exp.deliverableTypeId) {
      stateOk = false
      failureReasons.push(`deliverableTypeId:expected=${exp.deliverableTypeId},got=${finalForm.deliverableTypeId}`)
    }
    if (exp.videosCount !== undefined && videosCount !== exp.videosCount) {
      stateOk = false
      failureReasons.push(`videosCount:expected=${exp.videosCount},got=${String(videosCount)}`)
    }
    if (exp.checklistSelectedAll !== undefined && checklistSelectedAll !== exp.checklistSelectedAll) {
      stateOk = false
      failureReasons.push(`checklistSelectedAll_mismatch`)
    }
    if (exp.checklistClearedAll !== undefined && checklistClearedAll !== exp.checklistClearedAll) {
      stateOk = false
      failureReasons.push(`checklistClearedAll_mismatch`)
    }
    if (exp.submitBlocked !== undefined && submitBlocked !== exp.submitBlocked) {
      stateOk = false
      failureReasons.push(`submitBlocked:expected=${String(exp.submitBlocked)},got=${String(submitBlocked)}`)
    }
  }

  // 6. False success check
  const claimsSuccess = /\bĐã\b/.test(reply)
  const falseSuccess = Boolean(
    scenario.expectFalseSuccessForbidden &&
      (claimsSuccess || results.some((r) => r.ok && r.action.type !== 'keep_previous')),
  )
  if (falseSuccess) {
    failureReasons.push(`false_success:${reply}`)
  }

  const intentOk = toolOk && noForbiddenOk && clarificationOk
  const passed = intentOk && argsOk && navOk && stateOk && !falseSuccess

  return {
    id: scenario.id,
    split: scenario.split,
    category: scenario.category,
    section: scenario.section,
    input: scenario.input,
    passed,
    intentOk,
    toolOk,
    argsOk,
    navOk,
    stateOk,
    noForbiddenOk,
    clarificationOk,
    unnecessaryClarification,
    falseSuccess,
    latencyMs,
    estimatedTokens: estimateTokens(scenario.input) + estimateTokens(reply) + 120,
    actualActionTypes,
    expectedActionTypes: scenario.expectedActionTypes,
    reply,
    failureReasons,
  }
}

function summarizeSplit(outcomes: ScenarioOutcome[]): SplitMetrics {
  const total = outcomes.length
  const passed = outcomes.filter((o) => o.passed).length
  const vnCategories = new Set<EvalCategory>([
    'natural_vietnamese',
    'regional_expressions',
    'missing_accents',
    'typos',
    'asr_errors',
  ])
  const vnItems = outcomes.filter((o) => vnCategories.has(o.category))
  const ctxItems = outcomes.filter((o) => o.category === 'context_retention' || o.category === 'relative_references')
  const corrItems = outcomes.filter(
    (o) =>
      o.category === 'user_corrections' ||
      o.category === 'negative_commands' ||
      o.category === 'interruptions' ||
      o.category === 'undo_redo',
  )
  const navItems = outcomes.filter(
    (o) =>
      o.category === 'reselection' ||
      o.category === 'interruptions' ||
      o.expectedActionTypes.some((t) => ['reopen_selection', 'navigate_step', 'go_back', 'open_map'].includes(t)),
  )
  const latencies = outcomes.map((o) => o.latencyMs).sort((a, b) => a - b)
  const avgLatencyMs = Math.round((latencies.reduce((s, v) => s + v, 0) / Math.max(1, total)) * 1000) / 1000
  const p95LatencyMs = Math.round((latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0) * 1000) / 1000
  const avgEstimatedTokens = Math.round(outcomes.reduce((s, o) => s + o.estimatedTokens, 0) / Math.max(1, total))

  return {
    total,
    passed,
    endToEndCompletionRate: pct(passed, total),
    intentAccuracy: pct(outcomes.filter((o) => o.intentOk).length, total),
    toolCallingAccuracy: pct(outcomes.filter((o) => o.toolOk).length, total),
    argumentCorrectness: pct(outcomes.filter((o) => o.argsOk).length, total),
    navigationAccuracy: pct(navItems.filter((o) => o.navOk && o.toolOk).length, navItems.length),
    finalStateCorrectness: pct(outcomes.filter((o) => o.stateOk).length, total),
    vietnameseUnderstanding: pct(vnItems.filter((o) => o.passed).length, vnItems.length),
    contextRetention: pct(ctxItems.filter((o) => o.passed).length, ctxItems.length),
    correctionHandling: pct(corrItems.filter((o) => o.passed).length, corrItems.length),
    unnecessaryClarificationRate: pct(outcomes.filter((o) => o.unnecessaryClarification).length, total),
    falseSuccessRate: pct(outcomes.filter((o) => o.falseSuccess).length, total),
    avgLatencyMs,
    p95LatencyMs,
    avgEstimatedTokens,
  }
}

export function runEvaluationBenchmark(
  label: string,
  dataset: readonly EvalScenario[] = VIETNAMESE_EVAL_DATASET,
): { metrics: BenchmarkMetrics; outcomes: ScenarioOutcome[] } {
  const outcomes = dataset.map(evaluateScenario)
  const devOutcomes = outcomes.filter((o) => o.split === 'dev')
  const heldoutOutcomes = outcomes.filter((o) => o.split === 'heldout')

  const byCategory = {} as Record<EvalCategory, { total: number; passed: number; passRate: number }>
  for (const outcome of outcomes) {
    const bucket = byCategory[outcome.category] ?? { total: 0, passed: 0, passRate: 0 }
    bucket.total += 1
    if (outcome.passed) bucket.passed += 1
    bucket.passRate = pct(bucket.passed, bucket.total)
    byCategory[outcome.category] = bucket
  }

  const metrics: BenchmarkMetrics = {
    timestamp: new Date().toISOString(),
    label,
    totalScenarios: outcomes.length,
    devCount: devOutcomes.length,
    heldoutCount: heldoutOutcomes.length,
    overall: summarizeSplit(outcomes),
    dev: summarizeSplit(devOutcomes),
    heldout: summarizeSplit(heldoutOutcomes),
    byCategory,
    sampleFailures: outcomes
      .filter((o) => !o.passed)
      .slice(0, 30)
      .map((o) => ({
        id: o.id,
        split: o.split,
        category: o.category,
        input: o.input,
        reasons: o.failureReasons,
      })),
  }

  return { metrics, outcomes }
}
