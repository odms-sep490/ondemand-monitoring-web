import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Select, Skeleton } from 'antd'

import { missionsApi } from '../../../api/missionsApi'
import type { MissionCalendarItem } from '../../../types/missions'
import { canAssignMissionDrone } from '../../../lib/missionDroneAssignments'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { DroneAssignmentPanel } from '../../Schedule/components/DroneAssignmentPanel'

const COPY = {
  vi: {
    title: 'Chọn nhiệm vụ cần gán drone',
    missionLabel: 'Nhiệm vụ',
    eligibleMissions: (count: number) => `${count} nhiệm vụ có thể gán`,
    missionPlaceholder: 'Tìm theo mã nhiệm vụ hoặc đơn hàng',
    missionAria: 'Nhiệm vụ cần gán drone',
    planning: 'Đang lập kế hoạch',
    ready: 'Sẵn sàng bay',
    loading: 'Đang tải nhiệm vụ có thể phân công…',
    loadError: 'Không tải được danh sách nhiệm vụ',
    retry: 'Tải lại',
    noMissionTitle: 'Chưa có nhiệm vụ có thể gán drone',
    noMissionDescription: 'Chỉ nhiệm vụ đang lập kế hoạch hoặc sẵn sàng bay, đã có giờ bắt đầu và kết thúc, mới nhận phân công drone.',
    selectMission: 'Chọn một nhiệm vụ ở trên để xem drone khả dụng.',
    schedule: 'Lịch bay',
  },
  en: {
    title: 'Choose a mission for drone assignment',
    missionLabel: 'Mission',
    eligibleMissions: (count: number) =>
      `${count} eligible mission${count === 1 ? '' : 's'}`,
    missionPlaceholder: 'Search by mission or order code',
    missionAria: 'Mission to assign a drone to',
    planning: 'Planning',
    ready: 'Ready for flight',
    loading: 'Loading missions that can receive a drone…',
    loadError: 'Could not load missions',
    retry: 'Retry',
    noMissionTitle: 'No missions can receive a drone yet',
    noMissionDescription: 'A mission must be in planning or ready status and have start and end times before a drone can be assigned.',
    selectMission: 'Choose a mission above to see available drones.',
    schedule: 'Flight schedule',
  },
} as const

export function DroneMissionAssignmentTab({
  lang,
  assignmentMissionId,
  onMissionChange,
}: {
  lang: string
  assignmentMissionId?: string
  onMissionChange?: (missionId: string) => void
}) {
  const isEnglish = lang === 'en'
  const copy = isEnglish ? COPY.en : COPY.vi
  const missionQuery = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )
  const [selectedMissionId, setSelectedMissionId] = useState<string | undefined>(
    assignmentMissionId,
  )
  const [missionSnapshot, setMissionSnapshot] = useState<MissionCalendarItem | null>(null)

  const missions = useMemo(
    () =>
      (missionQuery.data?.items ?? []).filter(canAssignMissionDrone),
    [missionQuery.data?.items],
  )
  useEffect(() => {
    if (
      assignmentMissionId &&
      !missionQuery.loading &&
      !missions.some((mission) => mission.id === assignmentMissionId)
    ) {
      setSelectedMissionId((current) =>
        current === assignmentMissionId ? undefined : current,
      )
    }
  }, [assignmentMissionId, missionQuery.loading, missions])

  useEffect(() => {
    if (!assignmentMissionId && !selectedMissionId && missions.length === 1) {
      setSelectedMissionId(missions[0].id)
      onMissionChange?.(missions[0].id)
    }
  }, [assignmentMissionId, missions, onMissionChange, selectedMissionId])

  const selectedMission =
    missionSnapshot?.id === selectedMissionId
      ? missionSnapshot
      : missions.find((mission) => mission.id === selectedMissionId) ?? null
  const options = useMemo(
    () =>
      missions.map((mission) => {
        const date = mission.scheduledStartAt
          ? new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'vi-VN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(new Date(mission.scheduledStartAt))
          : ''
        const stage = mission.status === 'PLANNING' ? copy.planning : copy.ready
        return {
          value: mission.id,
          label: [mission.missionCode, mission.orderCode, stage, date]
            .filter(Boolean)
            .join(' · '),
        }
      }),
    [copy.planning, copy.ready, isEnglish, missions],
  )

  return (
    <section
      className="mgr-drone-assignment-workspace"
      aria-label={copy.title}
    >
      <div className="mgr-drone-mission-picker">
        <div className="mgr-drone-mission-picker-heading">
          <label htmlFor="mgr-drone-mission-select">{copy.missionLabel}</label>
          <span className="mgr-drone-assignment-count">
            {copy.eligibleMissions(missions.length)}
          </span>
        </div>
        <Select
          id="mgr-drone-mission-select"
          showSearch
          optionFilterProp="label"
          options={options}
          value={selectedMissionId}
          placeholder={copy.missionPlaceholder}
          aria-label={copy.missionAria}
          loading={missionQuery.loading}
          disabled={missionQuery.loading || Boolean(missionQuery.error) || missions.length === 0}
          onChange={(missionId: string) => {
            setSelectedMissionId(missionId)
            setMissionSnapshot(null)
            onMissionChange?.(missionId)
          }}
        />
      </div>

      {missionQuery.loading ? (
        <div className="mgr-drone-assignment-state" aria-busy="true" role="status">
          <Skeleton active paragraph={{ rows: 4 }} />
          <span>{copy.loading}</span>
        </div>
      ) : missionQuery.error ? (
        <Alert
          type="error"
          showIcon
          message={copy.loadError}
          description={missionQuery.error instanceof Error ? missionQuery.error.message : undefined}
          action={<Button onClick={missionQuery.reload}>{copy.retry}</Button>}
        />
      ) : missions.length === 0 ? (
        <div className="mgr-drone-assignment-state">
          <Empty description={<><strong>{copy.noMissionTitle}</strong><br />{copy.noMissionDescription}</>} />
        </div>
      ) : selectedMission ? (
        <div className="mgr-drone-assignment-target">
          <div className="mgr-drone-assignment-target-heading">
            <div>
              <span>{copy.schedule}</span>
              <strong>{selectedMission.missionCode}</strong>
              <small>
                {selectedMission.orderCode ? `${selectedMission.orderCode} · ` : ''}
                {selectedMission.status === 'PLANNING' ? copy.planning : copy.ready}
              </small>
            </div>
            <span className="mgr-drone-assignment-target-state">
              {selectedMission.status === 'PLANNING' ? copy.planning : copy.ready}
            </span>
          </div>
          <DroneAssignmentPanel
            key={selectedMission.id}
            mission={selectedMission}
            canEdit
            lang={lang}
            onAssignmentChanged={(updatedMission) => {
              if (!updatedMission) return
              setMissionSnapshot(updatedMission)
              missionQuery.reload()
            }}
          />
        </div>
      ) : (
        <div className="mgr-drone-assignment-state">
          <Empty description={copy.selectMission} />
        </div>
      )}
    </section>
  )
}
