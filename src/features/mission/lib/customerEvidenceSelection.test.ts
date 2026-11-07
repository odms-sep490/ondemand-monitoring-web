import { describe, expect, it } from 'vitest'
import {
  checklistReadyForInspection,
  customerSelectionProgress,
} from './customerEvidenceSelection'
import type {
  MissionChecklistEvidence,
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'
const link = (id: string, mediaType: string, eligible = true) =>
  ({
    evidenceId: id,
    mediaType,
    eligibleForFinalApproval: eligible,
    selectedForCustomer: true,
  }) as MissionChecklistEvidence
const item = {
  executionStatus: 'COMPLETED',
  assessmentStatus: 'COMPLIANT',
  evidencePolicyVersion: 3,
  minimumImageCount: 1,
  minimumVideoCount: 1,
  evidence: [
    link('i', 'IMAGE'),
    link('v', 'VIDEO'),
    link('extra', 'IMAGE'),
    link('pending', 'VIDEO', false),
  ],
} as MissionChecklistExecution
const checklist = {
  readyForSubmission: true,
  executions: [item],
} as MissionChecklistResponse

describe('customer evidence selection policy', () => {
  it('requires each media type, counts only final eligible chosen media, and detects surplus', () => {
    expect(customerSelectionProgress(item, ['i', 'extra']).valid).toBe(false)
    expect(customerSelectionProgress(item, ['i', 'pending']).valid).toBe(false)
    expect(customerSelectionProgress(item, ['i', 'v'])).toEqual({
      valid: true,
      surplus: false,
    })
    expect(customerSelectionProgress(item, ['i', 'v', 'extra'])).toEqual({
      valid: true,
      surplus: true,
    })
  })
  it.each(['IMAGE', 'VIDEO', 'IMAGE_OR_VIDEO', 'IMAGE_AND_VIDEO'] as const)(
    'handles legacy %s minima',
    (type) => {
      const legacy = {
        ...item,
        evidencePolicyVersion: 2,
        minimumEvidenceCount: 2,
        requiredEvidenceType: type,
      }
      expect(customerSelectionProgress(legacy, ['i', 'v']).valid).toBe(
        ['IMAGE_OR_VIDEO', 'IMAGE_AND_VIDEO'].includes(type),
      )
      expect(customerSelectionProgress(legacy, ['i', 'extra']).valid).toBe(
        ['IMAGE', 'IMAGE_OR_VIDEO'].includes(type),
      )
    },
  )
  it('fails closed for an empty legacy checklist without authoritative readiness', () => {
    expect(checklistReadyForInspection({ ...checklist, executions: [] })).toBe(
      false,
    )
  })
  it('treats backend final readiness as authoritative', () => {
    expect(
      checklistReadyForInspection({
        ...checklist,
        readyForFinalApproval: false,
      }),
    ).toBe(false)
    expect(
      checklistReadyForInspection({
        ...checklist,
        readyForFinalApproval: true,
      }),
    ).toBe(true)
  })
  it('honors per-item readiness when root final readiness is absent', () => {
    expect(
      checklistReadyForInspection({
        ...checklist,
        executions: [{ ...item, readyForFinalApproval: false }],
      }),
    ).toBe(false)
    expect(
      checklistReadyForInspection({
        ...checklist,
        executions: [{ ...item, readyForFinalApproval: true }],
      }),
    ).toBe(true)
  })
  it('requires completed compliant work and persisted selected minima in older responses', () => {
    const ready = { ...item, evidence: item.evidence?.slice(0, 2) }
    expect(
      checklistReadyForInspection({ ...checklist, executions: [ready] }),
    ).toBe(true)
    for (const patch of [
      { assessmentStatus: 'NON_COMPLIANT' },
      { executionStatus: 'IN_PROGRESS' },
      { evidence: [link('i', 'IMAGE')] },
      {
        evidence: [
          link('i', 'IMAGE'),
          { ...link('v', 'VIDEO'), selectedForCustomer: false },
        ],
      },
    ]) {
      expect(
        checklistReadyForInspection({
          ...checklist,
          executions: [{ ...ready, ...patch } as MissionChecklistExecution],
        }),
      ).toBe(false)
    }
  })
})
