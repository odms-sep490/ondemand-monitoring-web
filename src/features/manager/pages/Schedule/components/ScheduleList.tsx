import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'

import { useTablePagination } from '../../../../../shared/components/antd'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { StatusTag } from '../../../components/common/StatusTag'
import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'

// ── ScheduleList ───────────────────────────────────────────────────────────

export type ScheduleListProps = {
  missions: MissionCalendarItem[]
  selectedId: string | null
  onSelect: (m: MissionCalendarItem) => void
  t: PageMessages
  locale: string
  getMissionStatusLabel: (status: MissionCalendarItem['status']) => string
}

/** Same week data as the calendar, as a sortable-by-time table. */
export function ScheduleList({
  missions,
  selectedId,
  onSelect,
  t,
  locale,
  getMissionStatusLabel,
}: ScheduleListProps) {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const rows = [...missions]
    .filter((m) => m.scheduledStartAt)
    .sort((a, b) => a.scheduledStartAt!.localeCompare(b.scheduledStartAt!))

  const pagination = useTablePagination(rows, 'id')

  const columns: ColumnsType<MissionCalendarItem> = [
    {
      title: t.colCode,
      dataIndex: 'missionCode',
      render: (code: string) => <span className="mgr-code">{code}</span>,
    },
    {
      title: t.colTime,
      render: (_, m) => fmt.format(new Date(m.scheduledStartAt!)),
    },
    {
      title: t.colStatus,
      render: (_, m) => (
        <StatusTag tone={missionStatusTone[m.status] ?? 'gray'}>
          {getMissionStatusLabel(m.status)}
        </StatusTag>
      ),
    },
    {
      title: t.colDrone,
      responsive: ['md'],
      render: (_, m) => m.droneCode ?? t.notAssigned,
    },
    {
      title: t.colPilot,
      responsive: ['md'],
      render: (_, m) => m.operatorName ?? t.notAssigned,
    },
  ]

  return (
    <Table<MissionCalendarItem>
      rowKey="id"
      size="middle"
      columns={columns}
      dataSource={rows}
      pagination={pagination}
      rowClassName={(m) =>
        `mgr-row-click${selectedId === m.id ? ' is-selected' : ''}`
      }
      onRow={(m) => ({ onClick: () => onSelect(m) })}
    />
  )
}
