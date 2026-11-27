import { describe, expect, it } from 'vitest'
import { VIETNAMESE_EVAL_DATASET } from './vietnameseEvalDataset'
import { runEvaluationBenchmark } from './evalRunner'

describe('AI Agent V4 — 500+ Vietnamese Evaluation Benchmark', () => {
  it('runs the full stratified dev + held-out benchmark and exports measured metrics', async () => {
    expect(VIETNAMESE_EVAL_DATASET.length).toBeGreaterThanOrEqual(500)

    const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined>; cwd?: () => string } }).process
    const label = proc?.env?.AI_EVAL_LABEL ?? 'current'
    const { metrics } = runEvaluationBenchmark(label)

    // Export JSON artifact when running under Node/Vitest
    if (proc?.cwd) {
      const fsSpec = 'node:fs'
      const pathSpec = 'node:path'
      const fsMod = (await import(/* @vite-ignore */ fsSpec)) as {
        mkdirSync: (p: string, o?: { recursive?: boolean }) => void
        writeFileSync: (p: string, d: string, e: string) => void
      }
      const pathMod = (await import(/* @vite-ignore */ pathSpec)) as {
        resolve: (...parts: string[]) => string
      }
      const outDir = pathMod.resolve(proc.cwd(), 'docs/ai-agent-v4')
      fsMod.mkdirSync(outDir, { recursive: true })
      fsMod.writeFileSync(
        pathMod.resolve(outDir, `${label}-metrics.json`),
        JSON.stringify(metrics, null, 2),
        'utf8',
      )
    }

    console.log(
      `[AI_EVAL:${label}] total=${metrics.totalScenarios} (dev=${metrics.devCount}, heldout=${metrics.heldoutCount}) ` +
        `E2E=${metrics.overall.endToEndCompletionRate}% ` +
        `devE2E=${metrics.dev.endToEndCompletionRate}% ` +
        `heldoutE2E=${metrics.heldout.endToEndCompletionRate}% ` +
        `intent=${metrics.overall.intentAccuracy}% ` +
        `tool=${metrics.overall.toolCallingAccuracy}% ` +
        `nav=${metrics.overall.navigationAccuracy}% ` +
        `state=${metrics.overall.finalStateCorrectness}% ` +
        `vn=${metrics.overall.vietnameseUnderstanding}% ` +
        `ctx=${metrics.overall.contextRetention}% ` +
        `corr=${metrics.overall.correctionHandling}% ` +
        `unnecClar=${metrics.overall.unnecessaryClarificationRate}% ` +
        `falseSucc=${metrics.overall.falseSuccessRate}% ` +
        `avgMs=${metrics.overall.avgLatencyMs}`,
    )

    if (proc?.env?.AI_EVAL_ENFORCE_GATE === '1') {
      expect(metrics.overall.endToEndCompletionRate).toBeGreaterThanOrEqual(90)
      expect(metrics.heldout.endToEndCompletionRate).toBeGreaterThanOrEqual(90)
      expect(metrics.overall.falseSuccessRate).toBe(0)
      expect(metrics.overall.unnecessaryClarificationRate).toBeLessThanOrEqual(2)
    }
  })
})
