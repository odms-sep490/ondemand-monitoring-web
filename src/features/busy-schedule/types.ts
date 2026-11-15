// Mirrors the BE `userschedule` DTOs (BusyScheduleController, /api/busy-schedules).
// The BE stores BUSY sessions only: "free" is simply the absence of a busy session.

export type BusySession = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type BusySchedule = {
  id: string
  staffId: string
  staffName: string | null
  /** Business-timezone (Asia/Ho_Chi_Minh) calendar date, `YYYY-MM-DD`. */
  date: string
  dayOfWeek: string
  session: BusySession
  /** ISO instants. */
  startTime: string
  endTime: string
  notes: string | null
}

export type WeeklyBusySchedule = {
  /** Monday, `YYYY-MM-DD`. */
  weekStart: string
  /** Sunday, `YYYY-MM-DD`. */
  weekEnd: string
  maxSessionsPerWeek: number
  usedSessions: number
  remainingSessions: number
  items: BusySchedule[]
}

export type BusyScheduleInput = {
  date: string
  session: BusySession
  notes?: string | null
}
