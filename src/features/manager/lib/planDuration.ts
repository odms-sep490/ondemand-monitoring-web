// Reuses the terms from the flight-time formula
// [BRIEF C1 "Công thức thời gian bay yêu cầu"] that are computable from a
// *preview* waypoint path (path length / speed) before a drone model is
// chosen — i.e. before `estimateFlightTime` (shared/lib/flightTime.ts) can
// run its base→center travel-time term, which needs a specific base
// station and drone cruise speed. `estimatePlanDuration` only covers:
//   T_path   = Σ segment length / speed_ms            (path-only, no base)
//   T_video  = Σ duration_sec (media_type = VIDEO)
//   T_photo  = Σ quantity × policy.PHOTO_INTERVAL_SEC
//   T_stream = Σ duration_sec (media_type = LIVESTREAM)
//   T_capture = max(T_path portion covering ORBIT, T_video + T_photo + T_stream)
// It intentionally leaves out T_travel (base → center, 2×distance/speed)
// because CreateMissionPage (MNG-04) shows a duration estimate before a
// station/drone has been picked — `shared/lib/flightTime.ts` is the
// authoritative estimate once a drone (and its base) is selected in MNG-05.
import { managerLibMessages } from './lib.messages'
import type { Waypoint } from './waypoints'

export type MediaRequirement =
  | { mediaType: 'VIDEO'; durationSec: number }
  | { mediaType: 'PHOTO'; quantity: number }
  | { mediaType: 'LIVESTREAM'; durationSec: number }

export type PlanDurationPolicy = {
  /** policy.PHOTO_INTERVAL_SEC [BRIEF seed: 3]. */
  photoIntervalSec: number
}

export type PlanDurationResult = {
  pathLengthM: number
  tPathSec: number
  tVideoSec: number
  tPhotoSec: number
  tStreamSec: number
  tCaptureSec: number
  /** T_path and T_capture combined — the FE preview's total estimate. */
  estimatedDurationSec: number
}

const EARTH_RADIUS_M = 6_371_000

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = toRadians(b.lat - a.lat)
  const dLon = toRadians(b.lon - a.lon)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Estimates a preview mission duration from a waypoint path and media
 * requirements, before a drone/base has been chosen. Pure function.
 */
export function estimatePlanDuration(
  waypoints: Waypoint[],
  speedMs: number,
  mediaReqs: MediaRequirement[],
  policy: PlanDurationPolicy,
): PlanDurationResult {
  let pathLengthM = 0
  for (let i = 1; i < waypoints.length; i++) {
    pathLengthM += haversineM(waypoints[i - 1], waypoints[i])
  }
  const tPathSec = speedMs > 0 ? pathLengthM / speedMs : 0

  const tVideoSec = mediaReqs
    .filter(
      (m): m is Extract<MediaRequirement, { mediaType: 'VIDEO' }> =>
        m.mediaType === 'VIDEO',
    )
    .reduce((sum, m) => sum + m.durationSec, 0)
  const tPhotoSec = mediaReqs
    .filter(
      (m): m is Extract<MediaRequirement, { mediaType: 'PHOTO' }> =>
        m.mediaType === 'PHOTO',
    )
    .reduce((sum, m) => sum + m.quantity * policy.photoIntervalSec, 0)
  const tStreamSec = mediaReqs
    .filter(
      (m): m is Extract<MediaRequirement, { mediaType: 'LIVESTREAM' }> =>
        m.mediaType === 'LIVESTREAM',
    )
    .reduce((sum, m) => sum + m.durationSec, 0)

  const tCaptureSec = tVideoSec + tPhotoSec + tStreamSec
  const estimatedDurationSec = Math.max(tPathSec, tCaptureSec) + tPathSec

  return {
    pathLengthM,
    tPathSec,
    tVideoSec,
    tPhotoSec,
    tStreamSec,
    tCaptureSec,
    estimatedDurationSec,
  }
}

export type CeilingWarning = {
  code: 'ABOVE_SERVICE_CEILING' | 'ABOVE_NO_FLY_CEILING'
  message: string
}

/**
 * [BRIEF MNG-04 warning rule]: warn (not block) above the service's normal
 * altitude ceiling; warn as a hard no-fly risk above the absolute
 * no-fly-zone ceiling. Pure function.
 */
export function ceilingWarnings(
  altitudeM: number,
  serviceMaxAltitudeM: number,
  noFlyCeilingM: number,
): CeilingWarning[] {
  return getCeilingWarnings(altitudeM, serviceMaxAltitudeM, noFlyCeilingM, 'vi')
}

/**
 * Lang-aware variant of `ceilingWarnings` (kept as its own export — not a
 * default `lang` parameter — so `ceilingWarnings`'s existing call sites,
 * e.g. `CreateMissionPage`, keep compiling and behaving exactly as before
 * without having to pass a `lang` argument through).
 */
export function getCeilingWarnings(
  altitudeM: number,
  serviceMaxAltitudeM: number,
  noFlyCeilingM: number,
  lang: import('../../../shared/i18n').Language,
): CeilingWarning[] {
  const warnings: CeilingWarning[] = []
  if (altitudeM > noFlyCeilingM) {
    warnings.push({
      code: 'ABOVE_NO_FLY_CEILING',
      message:
        managerLibMessages[lang].ceiling.noFly(altitudeM, noFlyCeilingM),
    })
  } else if (altitudeM > serviceMaxAltitudeM) {
    warnings.push({
      code: 'ABOVE_SERVICE_CEILING',
      message:
        managerLibMessages[lang].ceiling.service(
          altitudeM,
          serviceMaxAltitudeM,
        ),
    })
  }
  return warnings
}
