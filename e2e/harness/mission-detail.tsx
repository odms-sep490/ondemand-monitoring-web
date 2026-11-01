import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import '../../src/styles/global.css'
import '../../src/styles/odm.css'
import { OperatorLayout } from '../../src/features/drone-operator/OperatorLayout'
import { MissionDashboard } from '../../src/features/drone-operator/pages/MissionDetail/components/MissionDashboard'
import { RejectDialog } from '../../src/features/drone-operator/pages/MissionDetail/components/RejectDialog'
import type { OperatorMission } from '../../src/features/drone-operator/types/mission'
import type { MissionPermissions } from '../../src/features/mission/types/permissions'

const pendingMission: OperatorMission = {
  id: 'mission-ui-audit',
  missionCode: 'MS-47101',
  backendStatus: 'WAITING_OPERATOR_ACCEPTANCE',
  status: 'PENDING',
  myResponseStatus: 'PENDING',
  title: 'Giám sát công trình',
  description: 'Kiểm tra tình trạng tổng thể công trình.',
  location: 'Cần Giuộc, Tây Ninh',
  date: '2026-11-05',
  startTime: '08:00',
  endTime: '09:00',
  serviceLabel: 'Giám sát công trình',
  droneCode: 'DRN-002',
  droneName: 'DJI Mavic 3 Enterprise',
  deviceId: 'device-ui-audit',
  deviceCode: 'DRN-002',
  deviceStatus: 'AVAILABLE',
  droneModel: 'Mavic 3 Enterprise',
  dronePayload: 'RGB',
  droneStation: 'Trạm Cần Giuộc',
  droneReadinessPct: 96,
  managerName: 'Seed Manager 1',
  managerNote: 'Vui lòng kiểm tra đầy đủ khu vực phía sau công trình.',
  respondBy: '2026-11-04T18:00:00+07:00',
  latitude: 10.639072,
  longitude: 106.697573,
  radiusMeters: 300,
}

const permissions: MissionPermissions = {
  canRespond: true,
  canControlFlight: false,
  canOperatePayload: true,
  canInspectDevice: false,
  canMaintainDevice: false,
  canUploadMedia: false,
  canExecuteMonitoringChecklist: false,
}

function MissionDetailHarness() {
  const [mission, setMission] = useState(pendingMission)
  const [rejectOpen, setRejectOpen] = useState(false)
  const pending = mission.status === 'PENDING'
  const monitoringSection = (
    <section className="odm-card" aria-labelledby="audit-checklist-heading">
      <div className="odm-card-header">
        <h2 id="audit-checklist-heading" className="mds-card-heading">
          Checklist nghiệm thu
        </h2>
      </div>
      <div className="odm-card-body">
        {pending
          ? 'Checklist đang khóa cho đến khi chấp nhận nhiệm vụ.'
          : 'Checklist đã mở sau khi chấp nhận nhiệm vụ.'}
      </div>
    </section>
  )

  return (
    <>
      <OperatorLayout
        route={{ screen: 'missionDetail', missionId: mission.id }}
        pendingCount={1}
        notificationCount={0}
        searchQuery=""
        onSearchChange={() => undefined}
      >
        <MissionDashboard
          mission={mission}
          submitting={false}
          actionError={null}
          access={permissions}
          resultActions={null}
          monitoringSection={monitoringSection}
          resultApprovalStatus={null}
          refreshWorkspace={() => undefined}
          mediaRevision={0}
          onAccept={() =>
            setMission((current) => ({
              ...current,
              status: 'ACCEPTED',
              backendStatus: 'SCHEDULED',
              myResponseStatus: 'ACCEPTED',
            }))
          }
          onStartWorkflow={() => undefined}
          onOpenReject={() => setRejectOpen(true)}
        />
      </OperatorLayout>
      {rejectOpen ? (
        <RejectDialog
          missionId={mission.missionCode ?? mission.id}
          submitting={false}
          onCancel={() => setRejectOpen(false)}
          onConfirm={() => setRejectOpen(false)}
        />
      ) : null}
    </>
  )
}

createRoot(document.getElementById('root')!).render(<MissionDetailHarness />)
