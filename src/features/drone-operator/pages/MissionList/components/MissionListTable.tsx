import type { ColumnsType } from 'antd/es/table'
import { InboxOutlined } from '@ant-design/icons'
import {
  CardComponent,
  EmptyState,
  StatusTag,
  TableComponent,
} from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { setActiveMissionId } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { formatDeadline } from '../../../lib/formatDeadline'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import { MissionActionButton } from './MissionActionButton'
import { missionListTableMessages } from './MissionListTable.messages'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import {
  actionFor,
  weekdayDdMm,
  STATUS_TONE,
  MANAGER_SUBMISSION_TONE,
} from '../missionTableHelpers'

export function MissionListTable({
  missions,
  now,
  showSubmission = true,
}: {
  missions: OperatorMission[]
  now: Date
  /** The "sent to manager" column only matters once a Mission is finished. */
  showSubmission?: boolean
}) {
  const { t, lang, locale } = useI18n(missionListTableMessages)
  const today = now.toISOString().slice(0, 10)

  if (missions.length === 0) {
    return (
      <CardComponent styles={{ body: { padding: 0 } }}>
        <EmptyState
          icon={<InboxOutlined />}
          title={t.emptyTitle}
          description={t.emptyBody}
        />
      </CardComponent>
    )
  }

  const statusText = (mission: OperatorMission) =>
    missionStopLabel(mission) ??
    (mission.backendStatus === 'PENDING_REVIEW'
      ? lang === 'vi'
        ? 'Chờ nghiệm thu'
        : 'Awaiting review'
      : ((t.statusLabel as Record<string, string>)[mission.status] ??
        mission.backendStatus ??
        mission.status))

  const columns: ColumnsType<OperatorMission> = [
    {
      key: 'code',
      title: t.columns.code,
      width: 130,
      render: (_, mission) => (
        <a
          className="odm-mono"
          href={operatorHref({ screen: 'missionDetail', missionId: mission.id })}
          onClick={() => setActiveMissionId(mission.id)}
          style={{ fontWeight: 600 }}
        >
          {mission.missionCode ?? mission.id}
        </a>
      ),
    },
    {
      key: 'job',
      title: t.columns.job,
      className: 'odm-opr-mission-job',
      render: (_, mission) => (
        <>
          <div className="odm-opr-mission-title">{mission.title}</div>
          <div className="odm-opr-mission-location">{mission.location}</div>
          {mission.serviceLabel ? (
            <span className="odm-opr-chip">{mission.serviceLabel}</span>
          ) : null}
        </>
      ),
    },
    {
      key: 'time',
      title: t.columns.time,
      width: 140,
      render: (_, mission) => (
        <>
          <div className="odm-tn">
            {weekdayDdMm(mission.date, today, t, locale)}
          </div>
          <div
            className="odm-tn"
            style={{ color: 'var(--mgr-muted)', fontSize: 11.5 }}
          >
            {mission.startTime && mission.endTime
              ? `${mission.startTime}–${mission.endTime}`
              : '—'}
          </div>
        </>
      ),
    },
    {
      key: 'drone',
      title: t.columns.drone,
      width: 160,
      render: (_, mission) => {
        const deviceLabel = formatDeviceLabel(mission)
        return deviceLabel ? (
          deviceLabel
        ) : (
          <span style={{ color: 'var(--mgr-muted)' }}>{t.unassigned}</span>
        )
      },
    },
    {
      key: 'status',
      title: t.columns.status,
      width: 170,
      render: (_, mission) => (
        <StatusTag tone={STATUS_TONE[mission.status]}>
          {statusText(mission)}
        </StatusTag>
      ),
    },
    ...(showSubmission
      ? [
          {
            key: 'manager',
            title: t.columns.managerSubmission,
            width: 150,
            render: (_: unknown, mission: OperatorMission) =>
              mission.status === 'COMPLETED' || mission.status === 'FAILED' ? (
                <StatusTag
                  tone={
                    MANAGER_SUBMISSION_TONE[
                      mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
                    ]
                  }
                >
                  {
                    t.managerSubmissionLabel[
                      mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
                    ]
                  }
                </StatusTag>
              ) : (
                <span style={{ color: 'var(--mgr-muted)' }}>—</span>
              ),
          },
        ]
      : []),
    {
      key: 'deadline',
      title: t.columns.deadline,
      width: 130,
      render: (_, mission) => (
        <span className="odm-tn" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
          {formatDeadline(mission, now, lang)}
        </span>
      ),
    },
    {
      key: 'action',
      align: 'right',
      width: 140,
      render: (_, mission) => {
        const baseAction = actionFor(mission, t)
        const action =
          mission.status === 'PENDING' && baseAction.label === t.action.details
            ? { ...baseAction, label: t.respondAndView, cls: 'odm-btn-p' }
            : baseAction
        return action ? (
          <MissionActionButton
            cls={action.cls}
            href={action.href}
            label={action.label}
            onClick={() => setActiveMissionId(mission.id)}
          />
        ) : null
      },
    },
  ]

  return (
    <CardComponent styles={{ body: { padding: 0 } }}>
      <TableComponent<OperatorMission>
        rowKey="id"
        columns={columns}
        dataSource={missions}
      />
    </CardComponent>
  )
}
