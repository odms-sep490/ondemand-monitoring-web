// Pure overlap check reused by the mission resource-assignment mocks
// handlers (MNG-05) to reproduce the backend's EXCLUDE constraint on
// `mission_drone_assignment.scheduled_range` / `mission_operator_assignment`
// [BRIEF §A6, §C2 "ràng buộc EXCLUDE trên scheduled_range"], and documented
// as reusable by MNG-06 (schedule view) in the P5 task brief.

export type TimeRange = {
  /** ISO datetime, inclusive start. */
  start: string
  /** ISO datetime, exclusive end. */
  end: string
}

export type Booking = TimeRange & {
  /** Identifies the conflicting booking for the caller's error message. */
  missionCode: string
}

/** Two half-open ranges [start, end) overlap iff a.start < b.end && b.start < a.end. */
function rangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return (
    new Date(a.start).getTime() < new Date(b.end).getTime() &&
    new Date(b.start).getTime() < new Date(a.end).getTime()
  )
}

/**
 * Returns the first existing booking that overlaps `range`, or `undefined`
 * when the resource is free for that window. Pure function.
 */
export function hasScheduleConflict(
  range: TimeRange,
  bookings: Booking[],
): Booking | undefined {
  return bookings.find((booking) => rangesOverlap(range, booking))
}
