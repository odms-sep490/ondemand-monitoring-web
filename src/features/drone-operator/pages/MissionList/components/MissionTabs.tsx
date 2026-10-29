import {
  FilterBar,
  FilterSegments,
} from '../../../../../shared/components/antd'
import type { OperatorMissionTab } from '../../../types/mission'
import { MissionListTable } from './MissionListTable'
import { UpcomingRail } from './UpcomingRail'
import { missionListPageMessages } from '../MissionListPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type {
  OperatorMission,
  OperatorMissionStatus,
  OperatorMissionPermissions,
  OperatorMissionPlanSummary,
} from '../../../types/mission'
import type { MissionStopMetadata } from '../../../../mission/lib/missionOperationalState'

export function MissionTabs({
  tab,
  setTab,
  counts,
  tabItems,
  now,
  allMissions,
}: {
  tab: OperatorMissionTab
  setTab: Dispatch<SetStateAction<OperatorMissionTab>>
  counts: { pending: number; upcoming: number; history: number }
  tabItems: OperatorMission[]
  now: Date
  allMissions: (MissionStopMetadata & {
    id: string
    missionCode?: string | undefined
    backendStatus?: string | undefined
    status: OperatorMissionStatus
    myResponseStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | undefined
    title: string
    description?: string | undefined
    location: string
    date: string
    startTime: string
    endTime: string
    serviceLabel: string
    deviceId?: string | null | undefined
    deviceCode?: string | null | undefined
    deviceSerialNumber?: string | null | undefined
    deviceStatus?: string | null | undefined
    deviceModelCode?: string | null | undefined
    deviceManufacturer?: string | null | undefined
    droneCode: string | null
    droneName: string | null
    flightStartedAt?: string | undefined
    completedAt?: string | undefined
    managerSubmissionStatus?:
      'NEEDS_SUBMIT' | 'PENDING_MANAGER' | 'SENT_TO_CUSTOMER' | undefined
    permissions?: OperatorMissionPermissions | undefined
    rejectReason?: string | undefined
    acceptedAt?: string | undefined
    managerNote?: string | undefined
    managerName?: string | undefined
    managerEmail?: string | undefined
    managerPhone?: string | undefined
    respondBy?: string | undefined
    radiusMeters?: number | undefined
    ceilingMeters?: number | undefined
    latitude?: number | null | undefined
    longitude?: number | null | undefined
    targetX?: number | null | undefined
    targetY?: number | null | undefined
    photoCount?: number | undefined
    photoNote?: string | undefined
    videoCount?: number | undefined
    videoSeconds?: number | undefined
    videoResolution?: string | undefined
    droneModel?: string | undefined
    dronePayload?: string | undefined
    droneStation?: string | undefined
    droneStationDistanceKm?: number | undefined
    droneReadinessPct?: number | undefined
    droneHoursSinceMaintenance?: number | undefined
    planSummary?: OperatorMissionPlanSummary | undefined
  })[]
}) {
  const { t } = useI18n(missionListPageMessages)
  const options = (Object.keys(t.tabLabel) as OperatorMissionTab[]).map(
    (tabKey) => ({
      value: tabKey,
      label: t.tabLabel[tabKey],
      count: counts[tabKey],
    }),
  )
  return (
    <div className="odm-opr-mission-layout">
      <div className="odm-opr-mission-main">
        <FilterBar
          start={
            <FilterSegments
              options={options}
              value={tab}
              onChange={setTab}
              ariaLabel={t.filterAria}
            />
          }
        />
        <MissionListTable
          missions={tabItems}
          now={now}
          showSubmission={tab === 'history'}
        />
      </div>
      <UpcomingRail missions={allMissions} now={now} />
    </div>
  )
}
