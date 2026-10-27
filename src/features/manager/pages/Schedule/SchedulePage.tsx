import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Button, Segmented, Skeleton, Tabs } from 'antd'
import {
  CalendarOutlined,
  LeftOutlined,
  RightOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { CardComponent } from '../../../../shared/components/antd'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { PageHeader } from '../../components/common/PageHeader'
import { missionsApi } from '../../api/missionsApi'
import {
  formatCalendarWeek,
  nextWeek,
  prevWeek,
  toISODate,
} from '../../lib/calendarWeek'
import { schedulePageMessages } from './SchedulePage.messages'
import type { MissionCalendarItem } from '../../types/missions'
import {
  addDays,
  dedupeById,
  formatDayLabel,
  formatWeekLabel,
} from './scheduleHelpers'
import { ReschedulePanel } from './components/ReschedulePanel'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { ScheduleList } from './components/ScheduleList'
import '../../manager.css'
import '../../components/layout/mgrLayout.css'
import './schedule.scss'

const MOBILE_MAX_WIDTH = 640
const TONES = ['success', 'info', 'warning', 'danger', 'neutral'] as const

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_MAX_WIDTH,
  )
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth <= MOBILE_MAX_WIDTH)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

// ── SchedulePage ───────────────────────────────────────────────────────────

export function SchedulePage() {
  const { t, lang, locale } = useI18n(schedulePageMessages)
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [chosenView, setChosenView] = useState<'week' | 'day'>('week')
  const isMobile = useIsMobile()
  // Seven columns do not fit a phone, so mobile always shows one day.
  const view = isMobile ? 'day' : chosenView
  const { weekStart, weekEnd } = useMemo(
    () => formatCalendarWeek(anchorDate),
    [anchorDate],
  )

  const [selectedMission, setSelectedMission] =
    useState<MissionCalendarItem | null>(null)

  // Invalidate when we navigate weeks so the query re-runs.
  const from = toISODate(weekStart)
  const to = toISODate(weekEnd)

  const query = useApiQuery(
    (signal) => missionsApi.listMissions({ from, to, signal }),
    [from, to],
  )

  const handleRescheduled = useCallback(
    (updated: MissionCalendarItem) => {
      // Update the selected mission in-place; a reload would also work but
      // optimistic update is faster.
      setSelectedMission(updated)
      query.reload()
    },
    [query],
  )

  const items = useMemo(
    () => dedupeById(query.data?.items ?? []),
    [query.data?.items],
  )
  const ready = !query.loading && !query.error && !!query.data
  const statusLabel = useCallback(
    (status: MissionCalendarItem['status']) =>
      getMissionStatusLabel(status, lang),
    [lang],
  )

  const step = view === 'week' ? 7 : 1
  const title =
    view === 'week'
      ? formatWeekLabel(weekStart, weekEnd)
      : formatDayLabel(anchorDate)

  // "Today" is a primary action only when the view has moved away from today.
  const atToday =
    view === 'week'
      ? toISODate(formatCalendarWeek(new Date()).weekStart) === toISODate(weekStart)
      : toISODate(new Date()) === toISODate(anchorDate)

  const toolbar = (
    <div className="mgr-sched-toolbar">
      <div className="mgr-sched-toolbar-nav">
        <Button
          icon={<LeftOutlined />}
          onClick={() =>
            setAnchorDate(
              view === 'week' ? prevWeek(anchorDate) : addDays(anchorDate, -step),
            )
          }
          aria-label={view === 'week' ? t.prevWeek : t.prevDay}
        />
        <Button
          type={atToday ? 'default' : 'primary'}
          onClick={() => setAnchorDate(new Date())}
        >
          {t.today}
        </Button>
        <Button
          icon={<RightOutlined />}
          onClick={() =>
            setAnchorDate(
              view === 'week' ? nextWeek(anchorDate) : addDays(anchorDate, step),
            )
          }
          aria-label={view === 'week' ? t.nextWeek : t.nextDay}
        />
      </div>
      <strong className="mgr-sched-toolbar-title">{title}</strong>
      <Segmented<'week' | 'day'>
        className="mgr-sched-views"
        value={view}
        onChange={setChosenView}
        options={[
          { value: 'week', label: t.viewWeek },
          { value: 'day', label: t.viewDay },
        ]}
      />
    </div>
  )

  const legend = (
    <div className="mgr-legend" aria-label={t.legendTitle}>
      {TONES.map((tone) => (
        <span key={tone} className="mgr-legend-item">
          <span className={`mgr-legend-dot is-${tone}`} aria-hidden="true" />
          {t.legend[tone]}
        </span>
      ))}
    </div>
  )

  const body = (content: ReactNode) => (
    <>
      {query.loading && (
        <div aria-busy="true">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      )}
      {!query.loading && !!query.error && (
        <ErrorState
          title={t.loadError}
          error={query.error}
          onRetry={query.reload}
        />
      )}
      {ready && items.length === 0 && (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <Button href="#portal/manager/orders">{t.backToQueue}</Button>
          }
        />
      )}
      {ready && items.length > 0 && content}
    </>
  )

  const calendarTab = (
    <div className="mgr-sched-tab">
      {toolbar}
      {legend}
      {body(
        <ScheduleCalendar
          missions={items}
          date={anchorDate}
          view={view}
          selectedId={selectedMission?.id ?? null}
          onSelect={setSelectedMission}
          t={t}
          lang={lang}
          getMissionStatusLabel={statusLabel}
        />,
      )}
    </div>
  )

  const listTab = (
    <div className="mgr-sched-tab">
      {toolbar}
      {body(
        <ScheduleList
          missions={items}
          selectedId={selectedMission?.id ?? null}
          onSelect={setSelectedMission}
          t={t}
          locale={locale}
          getMissionStatusLabel={statusLabel}
        />,
      )}
    </div>
  )

  return (
    <div className="mgr-view mgr-schedule" aria-label={t.pageAriaLabel}>
      <PageHeader
        title={t.title}
        description={
          <>
            {formatWeekLabel(weekStart, weekEnd)}
            {ready ? ` · ${t.weekCount(items.length)}` : ''}
          </>
        }
      />

      <div className={`mgr-sched-layout${selectedMission ? ' has-panel' : ''}`}>
        <div className="mgr-detail-main">
          <CardComponent className="mgr-sched-card">
            <Tabs
              defaultActiveKey="calendar"
              destroyOnHidden
              items={[
                {
                  key: 'calendar',
                  label: t.tabCalendar,
                  icon: <CalendarOutlined />,
                  children: calendarTab,
                },
                {
                  key: 'list',
                  label: t.tabList,
                  icon: <UnorderedListOutlined />,
                  children: listTab,
                },
              ]}
            />
          </CardComponent>
        </div>

        {selectedMission && (
          <ReschedulePanel
            key={selectedMission.id}
            mission={selectedMission}
            onClose={() => setSelectedMission(null)}
            onRescheduled={handleRescheduled}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  )
}
