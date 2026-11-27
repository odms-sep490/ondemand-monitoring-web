/**
 * V4 Continuous AI Improvement Cycle & Two-Split Acceptance Gate.
 *
 * Implements `self-improvement-loops`, `harness-engineering`, and `evaluation` skills:
 * 1. Anonymizes failed traces (strips phones/emails) before storing.
 * 2. Classifies failure root causes into structured taxonomy.
 * 3. Generates bounded regression test records (never mutates security/auth/business policies).
 * 4. Enforces strict two-split (dev + held-out) acceptance gate and rejects regressions.
 */
import type { BenchmarkMetrics, ScenarioOutcome } from './evalRunner'

export type FailureClass =
  | 'SECURITY_VIOLATION'
  | 'FALSE_SUCCESS'
  | 'INTENT_MISS'
  | 'ARGUMENT_ERROR'
  | 'NAVIGATION_ERROR'
  | 'STATE_MISMATCH'
  | 'UNNECESSARY_CLARIFICATION'

export type AnonymizedFailureRecord = {
  scenarioId: string
  split: 'dev' | 'heldout'
  category: string
  anonymizedInput: string
  failureClass: FailureClass
  reasons: string[]
  proposedSurface: 'nlu_rules' | 'tool_schema' | 'memory_resolution' | 'state_verifier'
  requiresDeveloperApproval: true
}

export type AcceptanceGateDecision = {
  accepted: boolean
  decision: 'ACCEPT' | 'REJECT_REGRESSION' | 'REJECT_FALSE_SUCCESS' | 'REJECT_NO_IMPROVEMENT'
  devDelta: number
  heldoutDelta: number
  overallDelta: number
  falseSuccessRate: number
  rollbackRecommended: boolean
  summary: string
}

/** Strips Vietnamese phone numbers and emails so raw customer PII is never stored in failure logs. */
export function anonymizeUtterance(input: string): string {
  return input
    .replace(/(?:\+?84|\b0)[\d .()-]{8,14}/g, '<PHONE>')
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '<EMAIL>')
}

export function classifyFailure(outcome: ScenarioOutcome): FailureClass {
  if (!outcome.noForbiddenOk) return 'SECURITY_VIOLATION'
  if (outcome.falseSuccess) return 'FALSE_SUCCESS'
  if (outcome.unnecessaryClarification) return 'UNNECESSARY_CLARIFICATION'
  if (!outcome.navOk) return 'NAVIGATION_ERROR'
  if (!outcome.argsOk) return 'ARGUMENT_ERROR'
  if (!outcome.stateOk) return 'STATE_MISMATCH'
  return 'INTENT_MISS'
}

export function collectAnonymizedFailures(outcomes: ScenarioOutcome[]): AnonymizedFailureRecord[] {
  return outcomes
    .filter((o) => !o.passed)
    .map((o) => {
      const failureClass = classifyFailure(o)
      const proposedSurface: AnonymizedFailureRecord['proposedSurface'] =
        failureClass === 'STATE_MISMATCH' || failureClass === 'FALSE_SUCCESS'
          ? 'state_verifier'
          : o.category === 'relative_references' || o.category === 'context_retention'
            ? 'memory_resolution'
            : failureClass === 'ARGUMENT_ERROR'
              ? 'tool_schema'
              : 'nlu_rules'
      return {
        scenarioId: o.id,
        split: o.split,
        category: o.category,
        anonymizedInput: anonymizeUtterance(o.input),
        failureClass,
        reasons: o.failureReasons,
        proposedSurface,
        requiresDeveloperApproval: true,
      }
    })
}

/**
 * Two-split acceptance gate (`self-improvement-loops` skill):
 * Accept ONLY when neither dev nor held-out regresses, falseSuccessRate === 0,
 * and at least one split strictly improves.
 */
export function evaluateAcceptanceGate(
  baseline: BenchmarkMetrics,
  candidate: BenchmarkMetrics,
): AcceptanceGateDecision {
  const devDelta = Math.round((candidate.dev.endToEndCompletionRate - baseline.dev.endToEndCompletionRate) * 10) / 10
  const heldoutDelta =
    Math.round((candidate.heldout.endToEndCompletionRate - baseline.heldout.endToEndCompletionRate) * 10) / 10
  const overallDelta =
    Math.round((candidate.overall.endToEndCompletionRate - baseline.overall.endToEndCompletionRate) * 10) / 10

  if (candidate.overall.falseSuccessRate > 0) {
    return {
      accepted: false,
      decision: 'REJECT_FALSE_SUCCESS',
      devDelta,
      heldoutDelta,
      overallDelta,
      falseSuccessRate: candidate.overall.falseSuccessRate,
      rollbackRecommended: true,
      summary: `Rejected: falseSuccessRate=${candidate.overall.falseSuccessRate}% must be 0%.`,
    }
  }

  if (devDelta < 0 || heldoutDelta < 0) {
    return {
      accepted: false,
      decision: 'REJECT_REGRESSION',
      devDelta,
      heldoutDelta,
      overallDelta,
      falseSuccessRate: candidate.overall.falseSuccessRate,
      rollbackRecommended: true,
      summary: `Rejected regression: devDelta=${devDelta}%, heldoutDelta=${heldoutDelta}%. Rollback recommended.`,
    }
  }

  if (devDelta === 0 && heldoutDelta === 0) {
    return {
      accepted: false,
      decision: 'REJECT_NO_IMPROVEMENT',
      devDelta,
      heldoutDelta,
      overallDelta,
      falseSuccessRate: candidate.overall.falseSuccessRate,
      rollbackRecommended: false,
      summary: 'No measurable improvement over baseline on either dev or held-out split.',
    }
  }

  return {
    accepted: true,
    decision: 'ACCEPT',
    devDelta,
    heldoutDelta,
    overallDelta,
    falseSuccessRate: candidate.overall.falseSuccessRate,
    rollbackRecommended: false,
    summary: `Accepted: overall +${overallDelta}% (dev +${devDelta}%, heldout +${heldoutDelta}%), falseSuccess=0%.`,
  }
}
