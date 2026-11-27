/**
 * V10 End-to-End Real Audio Pipeline Evaluator:
 *   Real 16kHz WAV file -> Production Qwen3-ASR-0.6B -> Production V9/V10 Action & Consultation Engine -> Exact FormState
 *
 * Reads `ai-training/reports/v10-real-asr-results.json` (generated from real WAV files)
 * and evaluates semantic intent, tool selection, and final draft state on the ACTUAL ASR transcripts.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  executeFormActions,
  parseUtterance,
  type SectionTarget,
} from '../../src/features/customer/lib/createOrder/orderActionAgent'
import {
  createTopicState,
  handleConversationalTurnV9,
} from '../../src/features/customer/lib/createOrder/conversationalIntelligenceV9'
import {
  makeInitialDraft,
  SIMULATED_PREFERRED_TIMES,
  SIMULATED_PURPOSE_LABELS,
  SIMULATED_SERVICES,
  SIMULATED_TODAY,
} from '../domain/drone-monitoring-domain'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASR_REPORT = path.resolve(__dirname, '../reports/v10-real-asr-results.json')
const OUT_REPORT = path.resolve(__dirname, '../reports/v10-voice-e2e-report.json')

type AsrItem = {
  id: string
  category: string
  condition: string
  speaker: string
  audioPath: string
  text: string
  recognizedTranscript: string
  wer: number
  cer: number
  asrLatencyMs: number
  expectedTools: string[]
  expectedServiceId?: string
  initialServiceId?: string
  activeSection?: SectionTarget
  isConsultation?: boolean
}

function main() {
  if (!fs.existsSync(ASR_REPORT)) {
    throw new Error(`Missing ${ASR_REPORT}. Run evaluate_real_stt.py first.`)
  }
  const asr = JSON.parse(fs.readFileSync(ASR_REPORT, 'utf8')) as {
    asrProvider: string
    cleanAvgWer: number
    noisyAvgWer: number
    avgAsrLatencyMs: number
    results: AsrItem[]
  }

  let cleanTotal = 0
  let cleanPassed = 0
  let noisyTotal = 0
  let noisyPassed = 0
  const evaluated = asr.results.map((item) => {
    const form = makeInitialDraft({
      serviceId: item.initialServiceId ?? '',
      flightPurpose: item.activeSection === 'location' ? 'CONSTRUCTION_MONITORING' : '',
      description: item.activeSection === 'location' ? 'Quay toàn cảnh công trình.' : '',
    })
    const activeSection: SectionTarget = item.activeSection ?? 'service'
    const selectedService = SIMULATED_SERVICES.find((s) => s.id === form.serviceId)

    const v9 = handleConversationalTurnV9(item.recognizedTranscript, {
      form,
      services: SIMULATED_SERVICES as never,
      selectedService: selectedService as never,
      activeSection,
      completedCount: form.serviceId ? 3 : 0,
      topicState: createTopicState(),
    })

    let actualTools: string[] = []
    let finalServiceId = form.serviceId
    let semanticPassed = false

    if (item.isConsultation) {
      actualTools = v9.actions.map((a) => a.type)
      semanticPassed = v9.handled && v9.actions.length === 0 && v9.relevance.passed
    } else {
      const plan = parseUtterance(item.recognizedTranscript, {
        services: SIMULATED_SERVICES,
        displayedServices: SIMULATED_SERVICES,
        preferredTimes: SIMULATED_PREFERRED_TIMES,
        today: SIMULATED_TODAY,
        memory: {
          activeStep: activeSection === 'contact' ? 4 : activeSection === 'schedule' ? 5 : 1,
          activeSection,
          currentServiceId: form.serviceId,
        },
      })
      actualTools = plan.actions.map((a) => a.type)
      const sync = plan.actions.filter((a) => a.type !== 'search_location')
      const exec = executeFormActions(form, sync, {
        services: SIMULATED_SERVICES,
        purposeLabels: SIMULATED_PURPOSE_LABELS,
        handlers: {
          preferredTimes: SIMULATED_PREFERRED_TIMES,
          checklistSelectMandatoryOnly: () => (form.serviceId ? 2 : null),
          reopenSection: () => {},
        },
      })
      finalServiceId = exec.form.serviceId
      const toolsOk = item.expectedTools.every((t) => actualTools.includes(t))
      const svcOk = !item.expectedServiceId || finalServiceId === item.expectedServiceId
      semanticPassed = toolsOk && svcOk
    }

    if (item.condition === 'noisy') {
      noisyTotal += 1
      if (semanticPassed) noisyPassed += 1
    } else {
      cleanTotal += 1
      if (semanticPassed) cleanPassed += 1
    }

    return {
      id: item.id,
      category: item.category,
      condition: item.condition,
      speaker: item.speaker,
      audioPath: item.audioPath,
      referenceTranscript: item.text,
      recognizedTranscript: item.recognizedTranscript,
      wer: item.wer,
      asrLatencyMs: item.asrLatencyMs,
      expectedTools: item.expectedTools,
      actualTools,
      semanticPassed,
    }
  })

  const totalPassed = cleanPassed + noisyPassed
  const report = {
    evaluatedAt: new Date().toISOString(),
    asrProvider: asr.asrProvider,
    totalRealAudioTests: evaluated.length,
    totalPassed,
    overallVoiceSemanticAccuracyPct: Number(((totalPassed / Math.max(1, evaluated.length)) * 100).toFixed(2)),
    cleanVoiceSemanticAccuracyPct: Number(((cleanPassed / Math.max(1, cleanTotal)) * 100).toFixed(2)),
    noisyVoiceSemanticAccuracyPct: Number(((noisyPassed / Math.max(1, noisyTotal)) * 100).toFixed(2)),
    cleanAvgWer: asr.cleanAvgWer,
    noisyAvgWer: asr.noisyAvgWer,
    avgAsrLatencyMs: asr.avgAsrLatencyMs,
    results: evaluated,
  }

  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2), 'utf8')
  console.log(
    `[v10-voice-e2e] Real WAV->Qwen3-ASR->Agent: ${totalPassed}/${evaluated.length} (${report.overallVoiceSemanticAccuracyPct}%) | clean=${report.cleanVoiceSemanticAccuracyPct}% | noisy=${report.noisyVoiceSemanticAccuracyPct}%`,
  )
}

main()
