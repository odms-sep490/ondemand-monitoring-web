import { useState } from 'react'
import { Button, DatePicker, Segmented, Spin, Alert } from 'antd'
import dayjs from 'dayjs'
import { PageHeader } from '../../components/common/PageHeader'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { getMissionStatusLabel } from '../../../../shared/lib/statusTone'
import { missionsApi } from '../../api/missionsApi'
import { managerHref } from '../../routes'
import { ScheduleCalendar } from './components/ScheduleCalendar'
import { schedulePageMessages } from './SchedulePage.messages'
import './schedule.scss'

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
          <Button loading={query.loading} onClick={query.reload}>
            {lang === 'vi' ? 'Làm mới' : 'Refresh'}
          </Button>
        }
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          margin: '16px 0',
        }}
      >
        <Button
          onClick={() => move(-1)}
          aria-label={lang === 'vi' ? 'Trước' : 'Previous'}
        >
          ←
        </Button>
        <Button onClick={() => setDate(new Date())}>
          {lang === 'vi' ? 'Hôm nay' : 'Today'}
        </Button>
        <Button
          onClick={() => move(1)}
          aria-label={lang === 'vi' ? 'Tiếp' : 'Next'}
        >
          →
        </Button>
        <DatePicker
          value={dayjs(date)}
          allowClear={false}
          onChange={(value) => value && setDate(value.toDate())}
          format="DD/MM/YYYY"
        />
        <Segmented
          value={view}
          onChange={(value) => setView(value as 'week' | 'day')}
          options={[
            { value: 'week', label: lang === 'vi' ? 'Tuần' : 'Week' },
            { value: 'day', label: lang === 'vi' ? 'Ngày' : 'Day' },
          ]}
        />
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
            missions={query.data?.items ?? []}
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
