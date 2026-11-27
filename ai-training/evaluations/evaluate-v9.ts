/**
 * V9 Conversational Intelligence Evaluation Engine (Section 21)
 * Measures:
 *  - Question understanding accuracy
 *  - Subject resolution accuracy
 *  - Follow-up question accuracy
 *  - Topic tracking & conversational repair success
 *  - Response relevance & repeated service recommendation rate
 *  - Unauthorized mutation rate
 *  - Latency & API cost
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createDefaultForm } from '../../src/features/customer/lib/createOrder/draftStorage'
import {
  handleConversationalTurnV9,
  type GroundedContext,
} from '../../src/features/customer/lib/createOrder/conversationalIntelligenceV9'
import { SIMULATED_SERVICES } from '../domain/drone-monitoring-domain'
import type { V9Scenario } from '../generators/v9-conversational-factory'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function evaluateSplit(split: string) {
  const file = path.resolve(__dirname, `../datasets/${split}.jsonl`)
  const rows: V9Scenario[] = fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l))

  let passed = 0
  let qCatOk = 0
  let subjOk = 0
  let relevanceOk = 0
  let repeatedRecCount = 0
  let unauthMutationCount = 0
  let totalMs = 0
  const failures: Array<Record<string, unknown>> = []

  for (const s of rows) {
    const t0 = performance.now()
    const svc = SIMULATED_SERVICES.find((x) => x.id === s.initialServiceId)
    const ctx: GroundedContext = {
      form: {
        ...createDefaultForm(),
        serviceId: s.initialServiceId,
        flightPurpose: 'CONSTRUCTION_MONITORING',
        description: 'Quay toàn cảnh công trình và kiểm tra mái.',
      },
      services: SIMULATED_SERVICES as never,
      selectedService: svc as never,
      activeSection: s.initialActiveSection,
      completedCount: 3,
      topicState: {
        activeTopic: s.priorTopic,
        lastQuestionCategory: 'HOW',
        lastReferencedOption: s.priorOption,
        lastAssistantReply: '',
        turnIndex: 2,
      },
    }

    const res = handleConversationalTurnV9(s.userMessage, ctx)
    totalMs += performance.now() - t0

    const isQOk = res.analysis.questionCategory === s.expectedQuestionCategory
    const isSubjOk = res.analysis.subject === s.expectedSubject
    const isRelOk = res.relevance.passed
    const isRepRec = /bạn có quan tâm đến dịch vụ này không|dịch vụ phù hợp với nhu cầu của bạn là/i.test(res.reply)
    const isUnauthMut = !s.expectMutation && res.actions.length > 0
    const actionMatch =
      s.expectedActionTypes.length === res.actions.length &&
      s.expectedActionTypes.every((t, i) => res.actions[i]?.type === t)

    if (isQOk) qCatOk += 1
    if (isSubjOk) subjOk += 1
    if (isRelOk) relevanceOk += 1
    if (isRepRec) repeatedRecCount += 1
    if (isUnauthMut) unauthMutationCount += 1

    const ok = res.handled === s.expectHandled && isQOk && isSubjOk && isRelOk && !isRepRec && !isUnauthMut && actionMatch
    if (ok) passed += 1
    else {
      failures.push({
        scenarioId: s.scenarioId,
        category: s.category,
        userMessage: s.userMessage,
        expected: { cat: s.expectedQuestionCategory, subj: s.expectedSubject, actions: s.expectedActionTypes },
        actual: {
          handled: res.handled,
          cat: res.analysis.questionCategory,
          subj: res.analysis.subject,
          actions: res.actions.map((a) => a.type),
          violations: res.relevance.violations,
        },
      })
    }
  }

  const n = Math.max(1, rows.length)
  const pct = (v: number) => Number(((v / n) * 100).toFixed(2))
  return {
    evaluatedAt: new Date().toISOString(),
    split,
    sampleSize: rows.length,
    metrics: {
      overallPassRatePct: pct(passed),
      questionUnderstandingPct: pct(qCatOk),
      subjectResolutionPct: pct(subjOk),
      responseRelevancePct: pct(relevanceOk),
      repeatedRecommendationCount: repeatedRecCount,
      unauthorizedMutationCount: unauthMutationCount,
      avgLatencyMs: Number((totalMs / n).toFixed(3)),
      apiCostUsd: 0,
    },
    failureCount: failures.length,
    sampleFailures: failures.slice(0, 20),
  }
}

function main() {
  const reportsDir = path.resolve(__dirname, '../reports')
  fs.mkdirSync(reportsDir, { recursive: true })
  for (const split of ['v9-dev', 'v9-held-out', 'v9-critical']) {
    const r = evaluateSplit(split)
    fs.writeFileSync(path.join(reportsDir, `${split}-report.json`), JSON.stringify(r, null, 2), 'utf8')
    console.log(
      `[evaluate-v9:${split}] n=${r.sampleSize} | pass=${r.metrics.overallPassRatePct}% | qCat=${r.metrics.questionUnderstandingPct}% | subj=${r.metrics.subjectResolutionPct}% | rel=${r.metrics.responseRelevancePct}% | repRec=${r.metrics.repeatedRecommendationCount} | unauth=${r.metrics.unauthorizedMutationCount}`,
    )
  }
}

main()
