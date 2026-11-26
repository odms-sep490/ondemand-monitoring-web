import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { aiOpsApi } from '../../../api/aiOpsApi'
import { AiOperationsPage } from '../AiOperationsPage'

vi.mock('../../../api/aiOpsApi', () => ({
  aiOpsApi: {
    getOverview: vi.fn(),
    listTraces: vi.fn(),
    listEvaluations: vi.fn(),
    getSecurity: vi.fn(),
    listIncidents: vi.fn(),
    listSupervisorEvaluations: vi.fn(),
    listCalibrations: vi.fn(),
    getPromptLab: vi.fn(),
    listEvaluationJobs: vi.fn(),
    listEvaluationHistory: vi.fn(),
    listEvaluationCases: vi.fn(),
    syncEvaluations: vi.fn(),
    startEvaluationJob: vi.fn(),
    cancelEvaluationJob: vi.fn(),
    exportBenchmarkReport: vi.fn(),
  },
}))

describe('AiOperationsPage — AI Evaluation Center (DeepEval)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(aiOpsApi.getOverview).mockResolvedValue({
      totalModels: 6,
      activeModels: 6,
      degradedModels: 0,
      requestsToday: 24,
      successRatePercent: 100,
      p95LatencyMs: 1450,
      openIncidents: 0,
      volumeSeries: [],
      models: [],
      services: [],
      resources: {
        cpuUsagePercent: 18,
        memoryUsagePercent: 45,
        memoryUsedMb: 7200,
        memoryTotalMb: 16000,
        jvmHeapUsedMb: 320,
        jvmHeapMaxMb: 1024,
        availableProcessors: 8,
        osName: 'Windows',
      },
      activeIncidents: [],
      generatedAt: '2026-11-25T06:00:00Z',
    })
    vi.mocked(aiOpsApi.listTraces).mockResolvedValue([])
    vi.mocked(aiOpsApi.getSecurity).mockResolvedValue({
      policies: [],
      events: [],
      blockedCount: 0,
      totalEvents: 0,
    })
    vi.mocked(aiOpsApi.listIncidents).mockResolvedValue([])
    vi.mocked(aiOpsApi.listSupervisorEvaluations).mockResolvedValue([])
    vi.mocked(aiOpsApi.listCalibrations).mockResolvedValue([])
    vi.mocked(aiOpsApi.getPromptLab).mockResolvedValue({ versions: [], experiments: [] })
    vi.mocked(aiOpsApi.listEvaluationJobs).mockResolvedValue([])
    vi.mocked(aiOpsApi.listEvaluationHistory).mockResolvedValue([])
    vi.mocked(aiOpsApi.listEvaluations).mockResolvedValue([
      {
        id: 'ev-1',
        modelCode: 'odm-order-qwen-3b',
        modelVersion: '3b',
        suiteName: 'DeepEval Order & Conversation Suite',
        metricName: 'Faithfulness',
        score: 83.3,
        passRate: 50.0,
        targetScore: 80.0,
        passed: false,
        totalCases: 80,
        passedCases: 40,
        failedCases: 33,
        skippedCases: 0,
        errorCases: 7,
        suiteGroup: 'core',
        datasetVersion: 'v2.0.0',
        judgeModel: 'qwen3:8b',
        promptVersion: 'v2.3-gepa-pareto-final',
        runId: 'eval-run-1',
        baselineDelta: 16.5,
        avgLatencyMs: 14800,
        p95LatencyMs: 22100,
        liveScored: 2,
        livePassed: 2,
        sourceArtifact: 'deepeval-summary.json',
        createdAt: '2026-11-25T06:00:00Z',
      },
      {
        id: 'ev-2',
        modelCode: 'odm-order-qwen-3b',
        modelVersion: '3b',
        suiteName: 'DeepEval Order & Conversation Suite',
        metricName: 'KnowledgeRetention',
        score: 99.9,
        passRate: 100.0,
        targetScore: 80.0,
        passed: true,
        totalCases: 80,
        passedCases: 80,
        failedCases: 0,
        skippedCases: 0,
        errorCases: 0,
        suiteGroup: 'core',
        datasetVersion: 'v2.0.0',
        judgeModel: 'qwen3:8b',
        promptVersion: 'v2.3-gepa-pareto-final',
        runId: 'eval-run-1',
        baselineDelta: 66.6,
        avgLatencyMs: 12950,
        p95LatencyMs: 14500,
        liveScored: 2,
        livePassed: 2,
        sourceArtifact: 'deepeval-summary.json',
        createdAt: '2026-11-25T06:00:00Z',
      },
    ])
    vi.mocked(aiOpsApi.listEvaluationCases).mockResolvedValue([
      {
        testCaseId: 'KR-001',
        metric: 'KnowledgeRetention',
        suiteGroup: 'core',
        category: 'retention_3_5_turns',
        difficulty: 'medium',
        language: 'vi',
        partition: 'dev',
        severity: 'critical',
        input: 'Nhắc lại đầy đủ thông tin liên hệ đã xác nhận.',
        turnsCount: 4,
        expectedBehavior: 'Recall Nguyễn An, 0901234567, cổng phía Bắc.',
        actualOutput: 'Người liên hệ: Nguyễn An, ĐT: 0901234567, đi cổng phía Bắc.',
        evaluationMode: 'live_inference+calibrated_judge',
        score: 1.0,
        threshold: 0.8,
        passed: true,
        status: 'PASSED',
        judgeReason: 'All confirmed facts recalled accurately.',
        rootCause: 'NONE',
        latencyMs: 9950,
        inputTokens: 820,
        outputTokens: 64,
        toolCalls: ['getCurrentOrderDraft'],
        evaluatedAt: '2026-11-25T06:00:00Z',
      },
    ])
  })

  it('displays Average Score and Pass Rate separately and opens Test Case Explorer on click', async () => {
    render(<AiOperationsPage initialTab="evaluation" />)

    await waitFor(() => {
      expect(screen.getByText('Faithfulness')).toBeTruthy()
    })

    // Must never conflate Average Score (83.3%) and Pass Rate (50.0%)
    expect(screen.getByText('83.3%')).toBeTruthy()
    expect(screen.getByText('50.0%')).toBeTruthy()
    expect(screen.getByText('Có lỗi chấm')).toBeTruthy()

    // KnowledgeRetention card
    expect(screen.getByText('KnowledgeRetention')).toBeTruthy()
    expect(screen.getByText('99.9%')).toBeTruthy()
    expect(screen.getByText('100.0%')).toBeTruthy()

    // Click KnowledgeRetention card -> opens Test Case Explorer with case KR-001
    fireEvent.click(screen.getByText('KnowledgeRetention'))
    await waitFor(() => {
      expect(screen.getByText('KR-001')).toBeTruthy()
    })
    expect(screen.getByText(/All confirmed facts recalled accurately/i)).toBeTruthy()
  })
})
