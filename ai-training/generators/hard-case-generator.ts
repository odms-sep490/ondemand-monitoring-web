/**
 * Phase 16 — Hard Case Generator
 * Reads a failure report (from `dev` or `critical-regression`, NEVER `held-out`!)
 * and generates diverse validated hard-case variants (wording, missing accents, ASR noise,
 * prefixes/suffixes) into `ai-training/regression/hard-cases.jsonl`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FailureRecord } from '../evaluations/evaluate'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const HARD_WRAPPERS = [
  (s: string) => `Alo em ơi, ${s.toLowerCase()} nhé`,
  (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd'),
  (s: string) => `Khoan đã, ${s}`,
  (s: string) => `${s} giùm anh luôn đi`,
]

function main() {
  const args = process.argv.slice(2)
  const reportIdx = args.indexOf('--report')
  const reportPath = reportIdx >= 0 ? args[reportIdx + 1] : 'ai-training/reports/baseline-dev.json'
  const resolved = path.resolve(process.cwd(), reportPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Report not found: ${resolved}`)
  }
  const report = JSON.parse(fs.readFileSync(resolved, 'utf8')) as {
    split: string
    sampleFailures: FailureRecord[]
  }
  if (report.split === 'held-out') {
    throw new Error('Refusing to generate training hard cases from frozen held-out split!')
  }

  const out: Array<Record<string, unknown>> = []
  let seq = 0
  for (const fail of report.sampleFailures ?? []) {
    for (const [idx, wrap] of HARD_WRAPPERS.entries()) {
      seq += 1
      out.push({
        hardCaseId: `v7-hard-${String(seq).padStart(4, '0')}`,
        sourceScenarioId: fail.scenarioId,
        sourceCategory: fail.category,
        sourceSubcategory: fail.subcategory,
        failureTypes: fail.failureTypes,
        variantIndex: idx,
        userMessage: wrap(fail.userMessage),
        expectedToolSequences: fail.expectedToolSequences,
      })
    }
  }

  const regDir = path.resolve(__dirname, '../regression')
  fs.mkdirSync(regDir, { recursive: true })
  const outPath = path.join(regDir, 'hard-cases.jsonl')
  fs.writeFileSync(outPath, out.map((r) => JSON.stringify(r)).join('\n') + (out.length ? '\n' : ''), 'utf8')
  console.log(`[hard-case-generator] Generated ${out.length} hard-case variants from ${report.sampleFailures?.length ?? 0} failures -> ${outPath}`)
}

main()
