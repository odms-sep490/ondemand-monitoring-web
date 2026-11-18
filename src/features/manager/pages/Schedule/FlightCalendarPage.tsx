import { useMemo, useState } from 'react'
import { Button, DatePicker, Segmented, Spin, Alert } from 'antd'
import {
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/common/PageHeader'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { missionsApi } from '../../api/missionsApi'
import { managerHref } from '../../routes'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { schedulePageMessages } from './SchedulePage.messages'
import {
  MISSION_STATUS_GROUPS,
  addDays,
  formatDayLabel,
  formatWeekLabel,
  getMissionStatusGroup,
  type MissionStatusGroup,
} from './scheduleHelpers'
import './schedule.scss'
import './flightCalendar.scss'

export function FlightCalendarPage() {
  const { t, lang } = useI18n(schedulePageMessages)
  const [date, setDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')
  const query = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )
  const move = (direction: number) =>
    setDate((previous) => {
      const next = new Date(previous)
      next.setDate(next.getDate() + direction * (view === 'week' ? 7 : 1))
      return next
    })
  const missions = useMemo(() => query.data?.items ?? [], [query.data])
  const range = useMemo(() => {
    const day = new Date(date)
    day.setHours(0, 0, 0, 0)
    if (view === 'day') return { start: day, end: addDays(day, 1) }
    const start = addDays(day, -((day.getDay() + 6) % 7))
    return { start, end: addDays(start, 7) }
  }, [date, view])
  const counts = useMemo(() => {
    const result = Object.fromEntries(
      MISSION_STATUS_GROUPS.map((group) => [group, 0]),
    ) as Record<MissionStatusGroup, number>
    let total = 0
    for (const mission of missions) {
      if (!mission.scheduledStartAt) continue
      const startsAt = new Date(mission.scheduledStartAt)
      if (startsAt < range.start || startsAt >= range.end) continue
      result[getMissionStatusGroup(mission.status)] += 1
      total += 1
    }
    return { result, total }
  }, [missions, range])
  const rangeLabel =
    view === 'day'
      ? formatDayLabel(range.start)
      : formatWeekLabel(range.start, addDays(range.end, -1))
  return (
    <div className="mgr-view mgr-flight-calendar">
      <PageHeader
        title={lang === 'vi' ? 'Lịch bay nhiệm vụ' : 'Mission flight calendar'}
        description={
          lang === 'vi'
            ? 'Xem lịch thực hiện và mở chi tiết nhiệm vụ theo ngày hoặc tuần.'
            : 'View mission schedules by day or week.'
        }
        actions={
          <Button
            icon={<ReloadOutlined />}
            loading={query.loading}
            onClick={query.reload}
          >
            {lang === 'vi' ? 'Làm mới' : 'Refresh'}
          </Button>
        }
      >
        <div className="mgr-fc-summary">
          <span className="mgr-fc-chip mgr-fc-chip--total">
            {t.calendarSummaryTotal(counts.total)}
          </span>
          {MISSION_STATUS_GROUPS.filter((g) => counts.result[g] > 0).map(
            (group) => (
              <span key={group} className={`mgr-fc-chip mgr-fc-chip--${group}`}>
                <i className="mgr-fc-dot" />
                {t.calendarLegend[group]}
                <b>{counts.result[group]}</b>
              </span>
            ),
          )}
        </div>
      </PageHeader>
      <div className="mgr-fc-toolbar">
        <div className="mgr-fc-nav">
          <Button
            icon={<LeftOutlined />}
            onClick={() => move(-1)}
            aria-label={lang === 'vi' ? 'Trước' : 'Previous'}
          />
          <Button onClick={() => setDate(new Date())}>
            {lang === 'vi' ? 'Hôm nay' : 'Today'}
          </Button>
          <Button
            icon={<RightOutlined />}
            onClick={() => move(1)}
            aria-label={lang === 'vi' ? 'Tiếp' : 'Next'}
          />
        </div>
        <DatePicker
          value={dayjs(date)}
          allowClear={false}
          onChange={(value) => value && setDate(value.toDate())}
          format="DD/MM/YYYY"
        />
        <span className="mgr-fc-range">{rangeLabel}</span>
        <Segmented
          className="mgr-fc-view"
          value={view}
          onChange={(value) => setView(value as 'week' | 'day')}
          options={[
            { value: 'week', label: lang === 'vi' ? 'Tuần' : 'Week' },
            { value: 'day', label: lang === 'vi' ? 'Ngày' : 'Day' },
          ]}
        />
        <ul className="mgr-fc-legend" aria-label={t.legendTitle}>
          {MISSION_STATUS_GROUPS.map((group) => (
            <li key={group} className={`mgr-fc-legend-item mgr-fc-chip--${group}`}>
              <i className="mgr-fc-dot" />
              {t.calendarLegend[group]}
            </li>
          ))}
        </ul>
      </div>
      {query.error ? (
        <Alert
          type="error"
          message={
            lang === 'vi'
              ? 'Không tải được lịch bay. Vui lòng thử lại.'
              : 'Could not load the flight calendar.'
          }
        />
      ) : (
        <Spin spinning={query.loading}>
          <ScheduleCalendar
            missions={missions}
            date={date}
            view={view}
            selectedId={null}
            onSelect={(mission) => {
              window.location.hash = managerHref({
                screen: 'missionDetail',
                missionId: mission.id,
              })
            }}
            t={t}
            lang={lang}
            getMissionStatusLabel={(status) =>
              getMissionStatusLabel(status, lang)
            }
          />
        </Spin>
      )}
    </div>
  )
}
