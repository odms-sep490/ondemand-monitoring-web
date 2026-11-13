import { useState } from 'react'
import { Button } from 'antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { missionsApi } from '../../../api/missionsApi'
import { WeatherResultDetail } from '../../../components/common/WeatherResultDetail'
import type { MissionResponse, PersistedPreflightCheckResponse, PersistedPostDeviceCheckResponse, WeatherPreflightCheckResponse } from '../../../types/missions'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { ChecksTab } from './ChecksTab'
import './missionChecksPanel.css'

export function MissionChecksPanel({ mission, weather, preflight, postcheck }: {
  mission: MissionResponse
  weather: WeatherPreflightCheckResponse | null
  preflight: PersistedPreflightCheckResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
}) {
  const { t, locale } = useI18n(missionDetailPageMessages)
  const devices = [...new Map((mission.deviceAssignments ?? []).map((item) => [item.deviceId, item])).values()]
  const [selected, setSelected] = useState(devices[0]?.deviceId ?? '')
  const deviceId = devices.some((item) => item.deviceId === selected) ? selected : devices[0]?.deviceId ?? ''
  const query = useApiQuery(async (signal) => {
    if (!deviceId) return { deviceId, preflight, postcheck }
    const checks = await Promise.allSettled([
      missionsApi.getCurrentPreflight(mission.id, signal, deviceId),
      missionsApi.getCurrentPostDeviceCheck(mission.id, signal, deviceId),
    ])
    // A missing check is not a pass; preserve the other phase independently.
    for (const check of checks) {
      if (check.status === 'rejected' && check.reason?.status !== 404) throw check.reason
    }
    return {
      deviceId,
      preflight: checks[0].status === 'fulfilled' ? checks[0].value : null,
      postcheck: checks[1].status === 'fulfilled' ? checks[1].value : null,
    }
  }, [mission.id, deviceId, preflight, postcheck])
  return <div className="mgr-mission-checks">
    <section className="mgr-check-weather">
      <h2>{t.weatherResultCard}</h2>
      <WeatherResultDetail weather={weather} locale={locale} />
    </section>
    <section className="mgr-check-devices">
      <div className="mgr-check-device-heading">
        <h2>{t.checksByDevice}</h2>
        <span>{t.deviceCount(devices.length || (preflight || postcheck ? 1 : 0))}</span>
      </div>
      <div className={`mgr-check-workspace${devices.length === 0 ? ' is-no-devices' : ''}`}>
      {devices.length > 0 && <div className="mgr-check-device-picker" role="group" aria-label={t.selectDevice}>
        {devices.map((device) => <button type="button" key={device.deviceId} aria-pressed={deviceId === device.deviceId} onClick={() => setSelected(device.deviceId)}>
          <strong>{device.deviceCode || device.deviceSerialNumber}</strong>
          <span>{device.deviceName}</span>
        </button>)}
      </div>}
      <div className="mgr-check-device-results" aria-live="polite">
      {!query.error && (query.loading || query.data?.deviceId !== deviceId) ? <p role="status">{t.checksLoading}</p>
        : query.error ? <div role="alert"><p>{t.checksLoadError}</p><Button onClick={query.reload}>{t.checksRetry}</Button></div>
        : <ChecksTab preflight={query.data?.preflight ?? null} postcheck={query.data?.postcheck ?? null} missionStatus={mission.status} />}
      </div>
      </div>
    </section>
  </div>
}
