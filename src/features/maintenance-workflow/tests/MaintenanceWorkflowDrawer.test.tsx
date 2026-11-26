import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../shared/i18n'
import { maintenanceWorkflowApi } from '../api/maintenanceWorkflowApi'
import { MaintenanceWorkflowDrawer } from '../components/MaintenanceWorkflowDrawer'
import type { MaintenanceWorkflowDetail } from '../types'

const baseDetail: MaintenanceWorkflowDetail = {
  ticketId: 'tkt-1',
  ticketCode: 'MNT-EVO-001',
  legacyStatus: 'OPEN',
  stage: 'AWAITING_TECHNICAL_RECEIPT',
  version: 2,
  currentRound: 1,
  legacyRecord: false,
  issueType: 'POSTFLIGHT_DAMAGE',
  severity: 'HIGH',
  description: 'Gimbal vibration',
  resolutionNotes: null,
  waitingReason: null,
  waitingPartsNeeded: null,
  waitingExpectedAt: null,
  acceptedReportRevision: null,
  openedAt: '2026-11-25T10:00:00Z',
  resolvedAt: null,
  closedAt: null,
  workflowUpdatedAt: '2026-11-25T10:05:00Z',
  device: {
    id: 'dev-1',
    name: 'Autel EVO II 01',
    serialNumber: 'SN-EVO-001',
    deviceCode: 'DRN-01',
    modelName: 'Autel EVO II',
    status: 'MAINTENANCE',
  },
  handedOverBy: {
    id: 'pilot-1',
    fullName: 'Pilot A',
    email: 'pilot@example.com',
    role: 'STAFF',
  },
  assignedTechnical: {
    id: 'tech-1',
    fullName: 'Tech B',
    email: 'tech@example.com',
    role: 'STAFF',
  },
  receivingManager: null,
  availableActions: ['CONFIRM_RECEIPT', 'REJECT_RECEIPT'],
  validationBlockers: [],
  handovers: [
    {
      id: 'ho-1',
      direction: 'INBOUND',
      roundNumber: 1,
      revision: 1,
      status: 'SUBMITTED',
      fromUser: {
        id: 'pilot-1',
        fullName: 'Pilot A',
        email: 'pilot@example.com',
        role: 'STAFF',
      },
      toUser: {
        id: 'tech-1',
        fullName: 'Tech B',
        email: 'tech@example.com',
        role: 'STAFF',
      },
      maintenanceReason: 'Gimbal vibration',
      overallCondition: 'Frame OK',
      existingDamageNotes: null,
      unfinishedWorkNotes: null,
      actualHandoverAt: '2026-11-25T10:05:00Z',
      submittedAt: '2026-11-25T10:05:00Z',
      confirmedAt: null,
      confirmedBy: null,
      discrepancyNotes: null,
      rejectionReason: null,
      reportRevision: null,
      evidenceIds: [],
      receiptEvidenceIds: [],
      locked: true,
      items: [],
    },
  ],
  workItems: [],
  partReplacements: [],
  reportVersions: [],
  acceptanceDecisions: [],
  evidences: [],
  timeline: [],
}

describe('MaintenanceWorkflowDrawer', () => {
  it('renders stage-driven Technical receipt actions without arbitrary status dropdown', async () => {
    setLanguage('vi')
    vi.spyOn(maintenanceWorkflowApi, 'getWorkflow').mockResolvedValue(baseDetail)
    vi.spyOn(maintenanceWorkflowApi, 'listQualifiedTechnicals').mockResolvedValue([])
    vi.spyOn(maintenanceWorkflowApi, 'listReceivingManagers').mockResolvedValue([])
    const receiveSpy = vi
      .spyOn(maintenanceWorkflowApi, 'receiveHandover')
      .mockResolvedValue({
        ...baseDetail,
        stage: 'RECEIVED',
        version: 3,
        availableActions: ['START_WORK'],
      })

    render(
      <MaintenanceWorkflowDrawer
        ticketId="tkt-1"
        open
        onClose={vi.fn()}
      />,
    )

    expect(await screen.findByText(/MNT-EVO-001/)).toBeInTheDocument()
    expect(screen.getByText('Chờ Technical nhận')).toBeInTheDocument()
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận nhận đủ' })
    fireEvent.click(confirmBtn)

    await waitFor(() =>
      expect(receiveSpy).toHaveBeenCalledWith(
        'tkt-1',
        expect.objectContaining({
          expectedVersion: 2,
          accepted: true,
          hasDiscrepancy: false,
        }),
      ),
    )
  })
})
