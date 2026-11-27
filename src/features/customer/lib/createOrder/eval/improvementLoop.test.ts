import { describe, expect, it } from 'vitest'
import {
  anonymizeUtterance,
  evaluateAcceptanceGate,
} from './improvementLoop'
import type { BenchmarkMetrics } from './evalRunner'

function makeMetrics(devRate: number, heldoutRate: number, falseSuccessRate = 0): BenchmarkMetrics {
  const split = (rate: number) => ({
    total: 100,
    passed: rate,
    endToEndCompletionRate: rate,
    intentAccuracy: rate,
    toolCallingAccuracy: rate,
    argumentCorrectness: rate,
    navigationAccuracy: rate,
    finalStateCorrectness: rate,
    vietnameseUnderstanding: rate,
    contextRetention: rate,
    correctionHandling: rate,
    unnecessaryClarificationRate: 0,
    falseSuccessRate,
    avgLatencyMs: 0.5,
    p95LatencyMs: 1.0,
    avgEstimatedTokens: 130,
  })
  return {
    timestamp: '2026-11-27T00:00:00Z',
    label: 'test',
    totalScenarios: 200,
    devCount: 100,
    heldoutCount: 100,
    overall: split((devRate + heldoutRate) / 2),
    dev: split(devRate),
    heldout: split(heldoutRate),
    byCategory: {} as BenchmarkMetrics['byCategory'],
    sampleFailures: [],
  }
}

describe('Continuous AI Improvement Loop & Acceptance Gate', () => {
  it('anonymizes customer phone numbers and emails before storing failure traces', () => {
    const cleaned = anonymizeUtterance('Liên hệ anh Minh 0912 345 678 hoặc minh@company.vn')
    expect(cleaned).not.toContain('0912')
    expect(cleaned).not.toContain('minh@company.vn')
    expect(cleaned).toContain('<PHONE>')
    expect(cleaned).toContain('<EMAIL>')
  })

  it('accepts improvements only when both dev and held-out splits do not regress and falseSuccess is 0', () => {
    const base = makeMetrics(70, 67, 1)
    const good = makeMetrics(98, 97, 0)
    const regressedHeldout = makeMetrics(95, 65, 0)
    const falseSucc = makeMetrics(98, 98, 0.5)

    expect(evaluateAcceptanceGate(base, good).accepted).toBe(true)
    expect(evaluateAcceptanceGate(base, regressedHeldout).decision).toBe('REJECT_REGRESSION')
    expect(evaluateAcceptanceGate(base, falseSucc).decision).toBe('REJECT_FALSE_SUCCESS')
  })
})
