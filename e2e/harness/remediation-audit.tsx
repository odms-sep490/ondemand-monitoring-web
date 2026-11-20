import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../src/styles/global.css'
import '../../src/styles/odm.css'
import '../../src/features/manager/manager.css'
import '../../src/shared/styles/app-shell/layout.scss'
import { Button, Space, Segmented } from 'antd'
import { setHttpTransport } from '../../src/shared/api/httpClient'
import { useLanguage } from '../../src/shared/i18n'
import { authSession } from '../../src/features/auth/api/authSession'
import { InspectionCorrectionPanel } from '../../src/features/mission/inspection/InspectionCorrectionPanel'
import { MonitoringChecklistSection } from '../../src/features/mission/components/MonitoringChecklistSection'
import { MissionCorrectionPage } from '../../src/features/mission/inspection/MissionCorrectionPage'
import { ManagerDeliveryPanel } from '../../src/features/delivery/ManagerDeliveryPanel'
import { MissionDetailHeader } from '../../src/features/manager/pages/MissionDetail/components/MissionDetailHeader'
import OmssMissionDetail from '../../src/features/drone-operator/omss/screens/MissionDetail'
import type { MissionChecklistExecution } from '../../src/features/mission/types/checklistExecution'
import type { MissionResponse } from '../../src/features/manager/types/missions'

const ONE_PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const originalFetch = window.fetch.bind(window)
let inspectorRoleMode: 'inspector' | 'crew' = 'crew'

function jsonData(urlString: string): { status: number; body: unknown } | null {
  const path = new URL(urlString, window.location.origin).pathname

  if (path.endsWith('/missions/mission-composing-audit/inspection-corrections')) {
    return { status: 200, body: { success: true, data: [] } }
  }

  if (path.endsWith('/missions/mission-panel-audit/inspection-corrections')) {
    return {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'corr-resolved-1',
            missionId: 'mission-panel-audit',
            version: 2,
            status: 'RESOLVED',
            mode: 'SUPPLEMENTAL_FLIGHT',
            reviewToken: 'rev-tok-1',
            requestedBy: 'Inspector A',
            requestedAt: '2026-11-18T08:00:00Z',
            resolvedAt: '2026-11-18T11:00:00Z',
            supplementalMissionId: 'mission-sup-02',
            supplementalMissionCode: 'MSN-SUP-02',
            supplementalMissionStatus: 'COMPLETED',
            items: [
              {
                executionId: 'exec-1',
                orderChecklistItemId: 'oci-1',
                content: 'Kiểm tra mái nhà xưởng A',
                requestedExecutionVersion: 1,
                reason: 'Ảnh góc tây bị mờ sương',
                mediaIds: [],
              },
            ],
            events: [
              {
                action: 'REQUESTED',
                actor: 'Inspector A',
                occurredAt: '2026-11-18T08:00:00Z',
                note: 'Yêu cầu bay bổ sung góc tây',
              },
              {
                action: 'RESOLVED',
                actor: 'Inspector B',
                occurredAt: '2026-11-18T11:00:00Z',
                note: 'Đã nghiệm thu đạt nhiệm vụ bổ sung MSN-SUP-02',
              },
            ],
          },
        ],
      },
    }
  }

  if (path.endsWith('/supplement-result')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          missionId: 'mission-sup-02',
          missionCode: 'MSN-SUP-02',
          completedAt: '2026-11-18T11:00:00Z',
          executions: [
            {
              id: 'sup-exec-1',
              orderChecklistItemId: 'oci-1',
              content: 'Kiểm tra mái nhà xưởng A',
              displayOrder: 1,
              sourceType: 'SERVICE_TEMPLATE',
              executionStatus: 'COMPLETED',
              assessmentStatus: 'COMPLIANT',
              assessmentNote: 'Ảnh góc tây rõ nét, đạt yêu cầu',
              observation: null,
              unableToVerifyReason: null,
              startedAt: '2026-11-18T09:00:00Z',
              completedAt: '2026-11-18T10:30:00Z',
              lastModifiedBy: 'pilot-1',
              createdAt: '2026-11-18T08:30:00Z',
              updatedAt: '2026-11-18T11:00:00Z',
              version: 2,
              minimumImageCount: 1,
              minimumVideoCount: 0,
              eligibleImageCount: 1,
              eligibleVideoCount: 0,
              evidenceRequirementSatisfied: true,
              evidenceReady: true,
              readyForFinalApproval: true,
              customerSelectionEditable: false,
              evidence: [
                {
                  evidenceId: 'sup-ev-1',
                  mediaId: 'sup-media-1',
                  fileName: 'west-roof-supplement.jpg',
                  type: 'IMAGE',
                  status: 'AVAILABLE',
                  eligibleForOperationalReadiness: true,
                  eligibleForFinalApproval: true,
                  ineligibilityReason: null,
                  selectedForCustomer: true,
                  previewUrl: ONE_PIXEL_PNG,
                  thumbnailUrl: ONE_PIXEL_PNG,
                },
              ],
            },
          ],
        },
      },
    }
  }

  if (
    path.endsWith('/missions/mission-workspace-audit/checklist-executions')
  ) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          missionId: 'mission-workspace-audit',
          legacySnapshot: false,
          readyForSubmission: true,
          checklistEvidenceReady: true,
          readyForMissionCompletion: true,
          readyForFinalApproval: false,
          executions: [
            {
              id: 'exec-ws-1',
              orderChecklistItemId: 'oci-1',
              content: 'Kiểm tra mặt đứng phía Đông',
              description: 'Chụp rõ vết nứt mặt ngoài tầng 3',
              displayOrder: 1,
              sourceType: 'SERVICE_TEMPLATE',
              executionStatus: 'COMPLETED',
              assessmentStatus: 'NON_COMPLIANT',
              assessmentNote: 'Thiếu ảnh cận cảnh khu vực vết nứt',
              observation: 'Đã bay chụp lại mặt đứng tầng 3',
              unableToVerifyReason: null,
              startedAt: '2026-11-19T07:30:00Z',
              completedAt: '2026-11-19T08:00:00Z',
              lastModifiedBy: 'pilot-1',
              createdAt: '2026-11-19T07:00:00Z',
              updatedAt: '2026-11-19T09:15:00Z',
              version: 1,
              minimumImageCount: 1,
              minimumVideoCount: 0,
              eligibleImageCount: 1,
              eligibleVideoCount: 0,
              evidenceRequirementSatisfied: true,
              evidenceReady: true,
              readyForFinalApproval: false,
              customerSelectionEditable: true,
              evidence: [
                {
                  evidenceId: 'link-1',
                  mediaId: 'media-1',
                  fileName: 'east-facade-01.jpg',
                  type: 'IMAGE',
                  status: 'AVAILABLE',
                  eligibleForOperationalReadiness: true,
                  eligibleForFinalApproval: true,
                  ineligibilityReason: null,
                  selectedForCustomer: true,
                  previewUrl: ONE_PIXEL_PNG,
                  thumbnailUrl: ONE_PIXEL_PNG,
                },
              ],
            },
          ],
        },
      },
    }
  }

  if (path.endsWith('/missions/mission-workspace-audit/result')) {
    return {
      status: 404,
      body: { success: false, code: 'NOT_FOUND', message: 'Not published yet' },
    }
  }

  if (path.endsWith('/missions/mission-workspace-audit/permissions')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          canRespond: false,
          canControlFlight: false,
          canOperatePayload: false,
          canInspectDevice: false,
          canMaintainDevice: false,
          canUploadMedia: inspectorRoleMode === 'crew',
          canExecuteMonitoringChecklist: inspectorRoleMode === 'crew',
          canAttachChecklistEvidence: inspectorRoleMode === 'crew',
          canAssessMonitoringChecklist: inspectorRoleMode === 'inspector',
          canRequestInspectionCorrection: inspectorRoleMode === 'inspector',
          canPublishMonitoringResult: inspectorRoleMode === 'inspector',
        },
      },
    }
  }

  if (
    path.endsWith('/missions/mission-workspace-audit/inspection-corrections')
  ) {
    return {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'corr-open-1',
            missionId: 'mission-workspace-audit',
            version: 1,
            status: 'OPEN',
            mode: 'DOSSIER_ADJUSTMENT',
            reviewToken: 'rev-tok-ws',
            requestedBy: 'Inspector A',
            requestedAt: '2026-11-19T08:30:00Z',
            resolvedAt: null,
            supplementalMissionId: null,
            supplementalMissionCode: null,
            supplementalMissionStatus: null,
            items: [
              {
                executionId: 'exec-ws-1',
                orderChecklistItemId: 'oci-1',
                content: 'Kiểm tra mặt đứng phía Đông',
                requestedExecutionVersion: 1,
                reason: 'Cần thay ảnh rõ nét hơn cho vết nứt tầng 3',
                mediaIds: ['media-1'],
              },
            ],
            events: [
              {
                action: 'REQUESTED',
                actor: 'Inspector A',
                occurredAt: '2026-11-19T08:30:00Z',
                note: 'Cần thay ảnh rõ nét hơn cho vết nứt tầng 3',
              },
              {
                action: 'RETURNED',
                actor: 'Inspector A',
                occurredAt: '2026-11-19T09:15:00Z',
                note: 'Ảnh tải lên lần trước chưa đúng góc yêu cầu',
              },
            ],
          },
        ],
      },
    }
  }

  if (path.endsWith('/missions/mission-workspace-audit/media')) {
    return {
      status: 200,
      body: {
        success: true,
        data: [
          {
            id: 'media-1',
            missionId: 'mission-workspace-audit',
            originalFilename: 'east-facade-01.jpg',
            mediaType: 'IMAGE',
            status: 'AVAILABLE',
            processingStatus: 'READY',
            validationStatus: 'VALID',
            eligibleForOperationalReadiness: true,
            viewUrl: ONE_PIXEL_PNG,
            previewUrl: ONE_PIXEL_PNG,
            thumbnailUrl: ONE_PIXEL_PNG,
          },
        ],
      },
    }
  }

  if (
    path.endsWith('/orders/order-audit-1/mission-deliveries') ||
    path.endsWith('/manager/orders/order-audit-1/delivery/missions')
  ) {
    return { status: 200, body: { success: true, data: [] } }
  }

  if (path.endsWith('/manager/orders/order-audit-1/delivery')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          orderId: 'order-audit-1',
          deliveryStatus: 'REVISION_REQUESTED',
          missionStatus: 'COMPLETED',
          orderStatus: 'COMPLETED',
          invoiceStatus: 'PAID',
          totalAmount: 5000000,
          paidAmount: 5000000,
          remainingAmount: 0,
          deliveryNotes: null,
          previewReleasedAt: '2026-11-18T12:00:00Z',
          customerAcceptedAt: null,
          revisionRequestedAt: '2026-11-19T07:00:00Z',
          revisionReason: 'Ảnh lóa nắng',
          revisionCount: 1,
          finalPaymentConfirmedAt: null,
          originalsReleasedAt: null,
          assets: [
            {
              mediaAssetId: 'asset-delivered-1',
              missionId: 'mission-root-01',
              orderChecklistItemId: 'oci-1',
              fileName: 'delivered-roof.jpg',
              type: 'IMAGE',
              size: 102400,
              capturedAt: '2026-11-18T08:00:00Z',
              selectedForCustomer: true,
              previewUrl: ONE_PIXEL_PNG,
              thumbnailUrl: ONE_PIXEL_PNG,
              url: ONE_PIXEL_PNG,
            },
            {
              mediaAssetId: 'asset-reserve-2',
              missionId: 'mission-root-01',
              orderChecklistItemId: 'oci-1',
              fileName: 'reserve-roof-hd.jpg',
              type: 'IMAGE',
              size: 204800,
              capturedAt: '2026-11-18T08:05:00Z',
              selectedForCustomer: false,
              previewUrl: ONE_PIXEL_PNG,
              thumbnailUrl: ONE_PIXEL_PNG,
              url: ONE_PIXEL_PNG,
            },
          ],
        },
      },
    }
  }

  if (path.endsWith('/manager/orders/order-audit-1/delivery/checklists')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          orderId: 'order-audit-1',
          deliveryStatus: 'REVISION_REQUESTED',
          deliveryVersion: 2,
          currentReviewRoundId: 'round-1',
          currentReviewRoundVersion: 1,
          checklists: [
            {
              orderChecklistItemId: 'oci-1',
              title: 'Kiểm tra mái nhà xưởng A',
              minimumImageCount: 1,
              minimumVideoCount: 0,
              minimumEvidenceCount: 1,
              requiredEvidenceType: 'IMAGE',
              currentBundle: [
                {
                  roundEvidenceId: 're-1',
                  mediaAssetId: 'asset-delivered-1',
                  missionId: 'mission-root-01',
                  orderChecklistItemId: 'oci-1',
                  fileName: 'delivered-roof.jpg',
                  type: 'IMAGE',
                  size: 102400,
                  capturedAt: '2026-11-18T08:00:00Z',
                  selectedForCustomer: true,
                  previewUrl: ONE_PIXEL_PNG,
                  thumbnailUrl: ONE_PIXEL_PNG,
                  url: ONE_PIXEL_PNG,
                  downloadable: true,
                },
              ],
              eligibleMedia: [
                {
                  mediaAssetId: 'asset-delivered-1',
                  missionId: 'mission-root-01',
                  orderChecklistItemId: 'oci-1',
                  fileName: 'delivered-roof.jpg',
                  type: 'IMAGE',
                  size: 102400,
                  capturedAt: '2026-11-18T08:00:00Z',
                  selectedForCustomer: true,
                  previewUrl: ONE_PIXEL_PNG,
                  thumbnailUrl: ONE_PIXEL_PNG,
                  url: ONE_PIXEL_PNG,
                  downloadable: true,
                },
                {
                  mediaAssetId: 'asset-reserve-2',
                  missionId: 'mission-root-01',
                  orderChecklistItemId: 'oci-1',
                  fileName: 'reserve-roof-hd.jpg',
                  type: 'IMAGE',
                  size: 204800,
                  capturedAt: '2026-11-18T08:05:00Z',
                  selectedForCustomer: false,
                  previewUrl: ONE_PIXEL_PNG,
                  thumbnailUrl: ONE_PIXEL_PNG,
                  url: ONE_PIXEL_PNG,
                  downloadable: true,
                },
              ],
            },
          ],
        },
      },
    }
  }

  if (path.endsWith('/manager/orders/order-audit-1/delivery/draft')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          orderId: 'order-audit-1',
          version: 1,
          caseId: 'case-audit-1',
          baseReviewRoundId: 'round-1',
          expectedDeliveryVersion: 2,
          notes: null,
          checklists: [],
          updatedAt: null,
          stale: false,
        },
      },
    }
  }

  if (path.endsWith('/manager/orders/order-audit-1/result-revision-case')) {
    return {
      status: 200,
      body: {
        success: true,
        data: {
          caseId: 'case-audit-1',
          orderId: 'order-audit-1',
          ticketId: 'ticket-1',
          ticketCode: 'SUP-2026-09',
          status: 'OPEN',
          active: true,
          version: 1,
          openedAt: '2026-11-19T07:00:00Z',
          items: [
            {
              caseItemId: 'case-item-1',
              orderChecklistItemId: 'oci-1',
              title: 'Kiểm tra mái nhà xưởng A',
              scopeDecision: 'IN_SCOPE',
              strategy: 'RESERVE_MEDIA',
              status: 'IN_PROGRESS',
              scopeReason: null,
              managerInstructions: 'Thay bằng ảnh dự phòng độ phân giải cao',
              assignedReworkMissionId: null,
              assignedReworkMissionStatus: null,
              version: 1,
              feedback: [
                {
                  requestId: 'req-1',
                  roundNumber: 1,
                  reasonCode: 'POOR_QUALITY',
                  customerNote: 'Ảnh bàn giao bị lóa nắng ở góc mái phía đông',
                  submittedAt: '2026-11-19T07:00:00Z',
                  evidence: [
                    {
                      roundEvidenceId: 're-1',
                      mediaAssetId: 'asset-delivered-1',
                      type: 'IMAGE',
                      fileName: 'delivered-roof.jpg',
                      size: 102400,
                      capturedAt: '2026-11-18T08:00:00Z',
                      url: ONE_PIXEL_PNG,
                      previewUrl: ONE_PIXEL_PNG,
                      thumbnailUrl: ONE_PIXEL_PNG,
                      previewStatus: 'READY',
                      urlExpiresAt: null,
                      downloadable: false,
                      accessReason: null,
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    }
  }

  if (path.includes('/simulation/map-meta')) {
    return {
      status: 200,
      body: {
        success: true,
        data: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
      },
    }
  }

  if (path.endsWith('/missions/mission-unscheduled-audit/media')) {
    return { status: 200, body: { success: true, data: [] } }
  }

  return null
}

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url
  const matched = jsonData(url)
  if (matched) {
    return new Response(JSON.stringify(matched.body), {
      status: matched.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return originalFetch(input, init)
}

setHttpTransport((input, init) => window.fetch(input, init))

// Mark auth session as logged out / ready so `authenticatedFetch` does not wait for bootstrap.
authSession.clear()

const panelRows: MissionChecklistExecution[] = [
  {
    id: 'exec-1',
    orderChecklistItemId: 'oci-1',
    content: 'Kiểm tra mái nhà xưởng A',
    displayOrder: 1,
    sourceType: 'SERVICE_TEMPLATE',
    executionStatus: 'COMPLETED',
    assessmentStatus: 'NON_COMPLIANT',
    assessmentNote: 'Đã bay bổ sung ở MSN-SUP-02',
    observation: null,
    unableToVerifyReason: null,
    startedAt: null,
    completedAt: null,
    lastModifiedBy: null,
    createdAt: '2026-11-18T07:00:00Z',
    updatedAt: null,
    version: 1,
    minimumImageCount: 1,
    minimumVideoCount: 0,
  },
  {
    id: 'exec-2',
    orderChecklistItemId: 'oci-2',
    content: 'Kiểm tra hành lang thoát hiểm phía Bắc',
    displayOrder: 2,
    sourceType: 'SERVICE_TEMPLATE',
    executionStatus: 'COMPLETED',
    assessmentStatus: 'NON_COMPLIANT',
    assessmentNote: 'Ảnh thiếu góc toàn cảnh',
    observation: null,
    unableToVerifyReason: null,
    startedAt: null,
    completedAt: null,
    lastModifiedBy: null,
    createdAt: '2026-11-18T07:00:00Z',
    updatedAt: null,
    version: 1,
    minimumImageCount: 1,
    minimumVideoCount: 0,
    evidence: [
      {
        evidenceId: 'link-panel-2',
        mediaId: 'media-panel-2',
        fileName: 'north-corridor.jpg',
        type: 'IMAGE',
        status: 'AVAILABLE',
        eligibleForOperationalReadiness: true,
        eligibleForFinalApproval: true,
        ineligibilityReason: null,
        selectedForCustomer: false,
        previewUrl: ONE_PIXEL_PNG,
        thumbnailUrl: ONE_PIXEL_PNG,
      },
    ],
  },
]

const supplementalMissionForManagerHeader: MissionResponse = {
  id: 'mission-sup-02',
  orderId: 'order-audit-1',
  missionCode: 'MSN-SUP-02',
  status: 'PLANNING',
  purpose: 'INSPECTION_SUPPLEMENT',
  inspectionSourceMissionId: 'mission-root-01',
  inspectionCorrectionId: 'corr-resolved-1',
}

const composingChecklistData = {
  missionId: 'mission-composing-audit',
  legacySnapshot: false,
  readyForSubmission: false,
  readyForFinalApproval: false,
  executions: [
    {
      id: 'comp-exec-1',
      orderChecklistItemId: 'comp-oci-1',
      content: 'Kiểm tra mái nhà xưởng A',
      displayOrder: 1,
      sourceType: 'SERVICE_TEMPLATE' as const,
      executionStatus: 'COMPLETED' as const,
      assessmentStatus: 'COMPLIANT' as const,
      observation: null,
      unableToVerifyReason: null,
      startedAt: null,
      completedAt: null,
      lastModifiedBy: null,
      createdAt: '2026-11-20T06:00:00Z',
      updatedAt: null,
      version: 1,
      minimumImageCount: 1,
      minimumVideoCount: 0,
      eligibleImageCount: 1,
      eligibleVideoCount: 0,
      evidence: [],
    },
    {
      id: 'comp-exec-2',
      orderChecklistItemId: 'comp-oci-2',
      content: 'Chụp ảnh tổng quan công trình',
      displayOrder: 2,
      sourceType: 'SERVICE_TEMPLATE' as const,
      executionStatus: 'COMPLETED' as const,
      assessmentStatus: 'NON_COMPLIANT' as const,
      assessmentNote: 'ko dat',
      observation: null,
      unableToVerifyReason: null,
      startedAt: null,
      completedAt: null,
      lastModifiedBy: null,
      createdAt: '2026-11-20T06:00:00Z',
      updatedAt: null,
      version: 1,
      minimumImageCount: 1,
      minimumVideoCount: 0,
      eligibleImageCount: 1,
      eligibleVideoCount: 0,
      evidence: [
        {
          evidenceId: 'comp-ev-1',
          mediaId: '7601f9d9-47d2-4a8e-9b1c-1234567890ab',
          fileName: '7601f9d9-47d2-4a8e-9b1c-1234567890ab',
          mediaType: 'IMAGE' as const,
          mediaStatus: 'AVAILABLE' as const,
          eligibleForOperationalReadiness: true,
          eligibleForFinalApproval: true,
          ineligibilityReason: null,
          selectedForCustomer: false,
          previewUrl: ONE_PIXEL_PNG,
          thumbnailUrl: ONE_PIXEL_PNG,
        },
      ],
    },
  ],
}

function AuditHarnessInner() {
  const { lang, setLang } = useLanguage()
  const [screen, setScreen] = useState<
    'panel' | 'composing' | 'workspace' | 'delivery' | 'omss'
  >('panel')
  const [roleKey, setRoleKey] = useState<'crew' | 'inspector'>('crew')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <Segmented
            value={screen}
            onChange={(val) =>
              setScreen(
                val as
                  | 'panel'
                  | 'composing'
                  | 'workspace'
                  | 'delivery'
                  | 'omss',
              )
            }
            options={[
              { label: '1. Inspector Panel', value: 'panel' },
              { label: '1b. Checklist & Composer', value: 'composing' },
              { label: '2. Correction Workspace', value: 'workspace' },
              { label: '3. Manager Rework & Header', value: 'delivery' },
              { label: '4. Unscheduled Mission', value: 'omss' },
            ]}
          />
        </div>
        <Space wrap>
          {screen === 'workspace' ? (
            <Button
              size="small"
              onClick={() => {
                const next = roleKey === 'crew' ? 'inspector' : 'crew'
                inspectorRoleMode = next
                setRoleKey(next)
              }}
            >
              Role: {roleKey === 'crew' ? 'Flight Crew' : 'Inspector'}
            </Button>
          ) : null}
          <Button
            data-testid="lang-toggle-vi"
            type={lang === 'vi' ? 'primary' : 'default'}
            size="small"
            onClick={() => setLang('vi')}
          >
            VI
          </Button>
          <Button
            data-testid="lang-toggle-en"
            type={lang === 'en' ? 'primary' : 'default'}
            size="small"
            onClick={() => setLang('en')}
          >
            EN
          </Button>
        </Space>
      </header>

      <main style={{ padding: '16px', maxWidth: 1360, margin: '0 auto' }}>
        {screen === 'panel' ? (
          <InspectionCorrectionPanel
            missionId="mission-panel-audit"
            rows={panelRows}
            canRequest={true}
            canRespond={false}
            orderId="order-audit-1"
          />
        ) : null}

        {screen === 'composing' ? (
          <MonitoringChecklistSection
            missionId="mission-composing-audit"
            data={composingChecklistData}
            loading={false}
            canAssess={true}
            canSelectForCustomer={true}
            showInspectionCorrections={true}
            canReviewCorrections={true}
            compact={true}
            compactTitle="Danh mục công trình"
            assessmentOnly={true}
            hideImplementationHints={true}
            refresh={() => undefined}
          />
        ) : null}

        {screen === 'workspace' ? (
          <MissionCorrectionPage
            key={`ws-${roleKey}`}
            missionId="mission-workspace-audit"
          />
        ) : null}

        {screen === 'delivery' ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <MissionDetailHeader
              mission={supplementalMissionForManagerHeader}
              headline="Supplemental flight mission detail"
              canSetup={true}
              order={null}
            />
            <ManagerDeliveryPanel
              orderId="order-audit-1"
              missionStatus="COMPLETED"
            />
          </Space>
        ) : null}

        {screen === 'omss' ? (
          <OmssMissionDetail
            mission={{
              id: 'mission-unscheduled-audit',
              orderRef: 'ORD-2026-09',
              purpose: 'REWORK',
              title: 'Bay bổ sung kiểm tra mái nhà xưởng A',
              serviceLabel: 'Giám sát công trình',
              state: 'PLANNING',
              priority: 'NORMAL',
              droneId: 'drone-1',
              operatorId: 'op-1',
              customer: 'Cảng Cát Lái',
              location: 'KCN Tân Bình',
              lat: 10.8,
              lng: 106.6,
              scheduledAt: '',
              estimatedMinutes: 25,
              distanceKm: 3.4,
              flightPlanId: 'fp-1',
              maxAltitudeM: 60,
              notes: 'Nhiệm vụ nháp chưa đặt lịch bay',
              routePoints: [],
            }}
            drone={{
              id: 'drone-1',
              name: 'DJI Mavic 3E',
              model: 'Mavic 3 Enterprise',
              serialNumber: 'SN-001',
              state: 'AVAILABLE',
              battery: 98,
              gpsCount: 18,
              gpsHdop: 0.8,
              altitude: 0,
              groundSpeed: 0,
              verticalSpeed: 0,
              heading: 0,
              lat: 10.8,
              lng: 106.6,
              storageMB: 65536,
              telemetryAge: 1,
              cameraOk: true,
              gimbalOk: true,
              rssi: 99,
              voltage: 15.4,
              currentAmps: 0.5,
              tempC: 31,
            }}
            onScreen={() => undefined}
            onBack={() => undefined}
            onStartFlight={() => undefined}
          />
        ) : null}
      </main>
    </div>
  )
}

async function boot() {
  const { registerMockRoutes } = await import('../../src/mocks/mockServer')
  registerMockRoutes([
    {
      method: 'GET',
      path: '/api/missions/mission-workspace-audit/permissions',
      handler: () => {
        const matched = jsonData('/api/missions/mission-workspace-audit/permissions')!
        const payload = matched.body as { data: unknown }
        return {
          status: 200,
          envelope: {
            success: true,
            data: payload.data,
            timestamp: new Date().toISOString(),
          },
        }
      },
    },
  ])

  createRoot(document.getElementById('root')!).render(<AuditHarnessInner />)
}

void boot()
