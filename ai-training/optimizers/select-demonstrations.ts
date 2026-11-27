/**
 * Phase 12 — Compact Dynamic Few-Shot Demonstration Selector & Prompt Versioning (DSPy-inspired)
 * Selects a compact, high-diversity demonstration set strictly from `train.jsonl` (NEVER `held-out.jsonl`)
 * so production prompts stay small and grounded without injecting thousands of examples.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BenchmarkScenario } from '../domain/drone-monitoring-domain'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function main() {
  const trainPath = path.resolve(__dirname, '../datasets/train.jsonl')
  if (!fs.existsSync(trainPath)) {
    throw new Error(`Missing ${trainPath}. Run validate-and-split.ts first.`)
  }
  const train: BenchmarkScenario[] = fs
    .readFileSync(trainPath, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l))

  // Pick at most 2 compact representative demonstrations per category (max ~24 total)
  const picked: Array<{
    category: string
    subcategory: string
    activeSection: string
    userMessage: string
    expectedTools: string[]
  }> = []
  const byCat = new Map<string, number>()

  for (const s of train) {
    const c = byCat.get(s.category) ?? 0
    if (c >= 2) continue
    picked.push({
      category: s.category,
      subcategory: s.subcategory,
      activeSection: s.initialActiveSection,
      userMessage: s.userMessage,
      expectedTools: s.acceptableToolSequences[0] ?? [],
    })
    byCat.set(s.category, c + 1)
  }

  const outPath = path.resolve(__dirname, 'selected-demonstrations.json')
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        version: 'v7.0.0',
        generatedAt: new Date().toISOString(),
        sourceSplit: 'train.jsonl',
        heldOutLeakage: false,
        totalDemonstrations: picked.length,
        demonstrations: picked,
      },
      null,
      2,
    ),
    'utf8',
  )

  const versionsPath = path.resolve(__dirname, 'prompt-versions.json')
  fs.writeFileSync(
    versionsPath,
    JSON.stringify(
      {
        activeVersion: 'v7.0.0',
        modelWeightFineTuningPerformed: false,
        optimizationMethods: [
          'deterministic-parser-and-tool-schema-hardening',
          'stateful-ui-section-visibility-fix',
          'proactive-next-step-voice-guidance',
          'compact-train-only-demonstration-selection',
        ],
        versions: [
          {
            version: 'v5.0.0',
            description: 'Initial V5 Universal Voice-to-Field engine across 7 sections',
          },
          {
            version: 'v7.0.0',
            description:
              'V7 factory-validated parser fixes, reopen-service UI visibility fix, proactive next-step voice guidance, and compact train-only demonstration set',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  )

  console.log(`[select-demonstrations] Selected ${picked.length} compact demonstrations from train.jsonl -> ${outPath}`)
}

main()
