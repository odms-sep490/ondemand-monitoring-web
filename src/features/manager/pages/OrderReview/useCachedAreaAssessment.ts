import {
  type FlightAreaAssessment,
  customerApi,
} from '../../../customer/api/customerApi'
import { useState, useRef, useCallback, useEffect } from 'react'

export const assessmentCache = new Map<string, FlightAreaAssessment>()

function normalizeAreaAssessment(
  result: FlightAreaAssessment,
): FlightAreaAssessment {
  const ministry = result.ministryFlightBan?.available
    ? result.ministryFlightBan
    : undefined
  const hasMinistryConflict = Boolean(
    ministry &&
    (ministry.violatedZones.length > 0 ||
      (ministry.violatedAreaSquareMeters ?? 0) > 0),
  )

  return {
    location: result.location,
    elevation: result.elevation ?? { available: false },
    restrictedZones: result.restrictedZones ?? {
      dataAvailable: false,
      pointInsideRestrictedZone: false,
      monitoringAreaIntersectsRestrictedZone: false,
      affectedZones: [],
    },
    osmContext: result.osmContext ?? {
      available: false,
      buildingCount: 0,
      towerCount: 0,
      mastCount: 0,
      powerTowerCount: 0,
      aerodromeNearby: false,
      helipadNearby: false,
      importantFeatures: [],
    },
    ministryFlightBan: ministry,
    assessment: result.assessment ?? {
      level: hasMinistryConflict ? 'HIGH_RISK' : 'NEEDS_REVIEW',
      findings: [],
      disclaimer: '',
    },
  }
}

export function useCachedAreaAssessment({
  latitude,
  longitude,
  radiusM,
  altitudeM,
}: {
  latitude?: number
  longitude?: number
  radiusM: number
  altitudeM?: number
}) {
  const cacheKey =
    latitude == null || longitude == null || radiusM <= 0
      ? null
      : `${latitude}:${longitude}:${radiusM}:${altitudeM ?? ''}`
  const cached = cacheKey ? assessmentCache.get(cacheKey) : undefined
  const [data, setData] = useState<FlightAreaAssessment | null | undefined>(
    cached,
  )
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(Boolean(cacheKey && !cached))
  const [reloadToken, setReloadToken] = useState(0)
  const requestId = useRef(0)
  const reload = useCallback(() => setReloadToken((token) => token + 1), [])

  useEffect(() => {
    if (!cacheKey || latitude == null || longitude == null || radiusM <= 0) {
      setData(null)
      setError(undefined)
      setLoading(false)
      return
    }

    const saved = assessmentCache.get(cacheKey)
    if (saved && reloadToken === 0) {
      setData(saved)
      setError(undefined)
      setLoading(false)
      return
    }

    const id = ++requestId.current
    const controller = new AbortController()
    setLoading(true)
    setError(undefined)
    customerApi
      .getFlightAreaAssessment(
        {
          latitude,
          longitude,
          radiusMeters: radiusM,
          requestedAltitudeAgl: altitudeM,
          includeOsm: false,
        },
        controller.signal,
      )
      .then((result) => {
        if (requestId.current !== id) return
        const normalized = normalizeAreaAssessment(result)
        assessmentCache.set(cacheKey, normalized)
        setData(normalized)
      })
      .catch((reason: unknown) => {
        if (requestId.current !== id) return
        if (reason instanceof DOMException && reason.name === 'AbortError')
          return
        setError(reason)
      })
      .finally(() => {
        if (requestId.current === id) setLoading(false)
      })

    return () => controller.abort()
  }, [cacheKey, latitude, longitude, radiusM, altitudeM, reloadToken])

  return { data, error, loading, reload }
}
