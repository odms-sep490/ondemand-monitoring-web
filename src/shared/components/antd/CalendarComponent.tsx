import { useEffect, useRef, type ReactNode } from 'react'
import FullCalendar from '@fullcalendar/react'
import type {
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import viLocale from '@fullcalendar/core/locales/vi'
import './calendar.scss'

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'

type Props = {
  /** Current view; changing it switches the calendar view. */
  view?: CalendarView
  /** Date the calendar shows; changing it moves the calendar. */
  date?: Date
  /** `false` hides the built-in toolbar (use your own, like the reference page). */
  headerToolbar?: false | { start?: string; center?: string; end?: string }
  events?: EventInput[]
  height?: number | string
  slotMinTime?: string
  slotMaxTime?: string
  slotDuration?: string
  /** First day of the week, 0 = Sunday, 1 = Monday. */
  firstDay?: number
  locale?: string
  eventContentRenderer?: (eventInfo: EventContentArg) => ReactNode
  eventClick?: (arg: EventClickArg) => void
  className?: string
  ariaLabel?: string
}

/**
 * FullCalendar wrapper (mirrors the reference `CalendarComponent`): same
 * plugins, same card chrome, driven by `view` / `date` props so a page can
 * own its toolbar.
 */
export function CalendarComponent({
  view = 'timeGridWeek',
  date,
  headerToolbar = {
    start: 'today prev,next',
    center: 'title',
    end: 'dayGridMonth timeGridWeek timeGridDay',
  },
  events = [],
  height = 700,
  slotMinTime = '00:00:00',
  slotMaxTime = '24:00:00',
  slotDuration,
  firstDay = 1,
  locale = 'en',
  eventContentRenderer,
  eventClick,
  className = '',
  ariaLabel,
}: Props) {
  const calendarRef = useRef<FullCalendar>(null)

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api && api.view.type !== view) api.changeView(view)
  }, [view])

  const time = date?.getTime()
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api && time !== undefined) api.gotoDate(new Date(time))
  }, [time])

  return (
    <div className={`calendar ${className}`.trim()} aria-label={ariaLabel}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={view}
        initialDate={date}
        locales={[viLocale]}
        locale={locale}
        firstDay={firstDay}
        headerToolbar={headerToolbar}
        allDaySlot={false}
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration={slotDuration}
        height={height}
        expandRows
        nowIndicator
        events={events}
        eventOverlap={false}
        slotEventOverlap={false}
        eventMaxStack={view === 'dayGridMonth' ? 5 : 3}
        eventClick={eventClick}
        eventContent={(info) =>
          eventContentRenderer ? eventContentRenderer(info) : undefined
        }
      />
    </div>
  )
}
