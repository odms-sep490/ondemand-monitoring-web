// Dedicated Fleet Devices view for System Operator
import { useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { systemOperatorDevicesScreenMessages } from './SystemOperatorDevicesScreen.messages'

type DeviceItem = {
  id: string
  code: string
  name: string
  model: string
  status: 'AVAILABLE' | 'MAINTENANCE' | 'IDLE_CHARGING' | 'IN_FLIGHT'
  batteryPercent: number
  signalPercent: number
  // Minutes since the last check; `0` renders as "just now".
  lastCheckMinutesAgo: number
}

const INITIAL_DEVICES: DeviceItem[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    code: 'DRONE-ALPHA-01',
    name: 'Matrice 300 RTK',
    model: 'DJI Enterprise M300',
    status: 'AVAILABLE',
    batteryPercent: 100,
    signalPercent: 98,
    lastCheckMinutesAgo: 0,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    code: 'DRONE-BETA-02',
    name: 'Mavic 3 Enterprise',
    model: 'DJI M3E Thermal',
    status: 'IDLE_CHARGING',
    batteryPercent: 78,
    signalPercent: 95,
    lastCheckMinutesAgo: 5,
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    code: 'DRONE-GAMMA-03',
    name: 'Skydio X2E',
    model: 'Skydio Autonomous',
    status: 'MAINTENANCE',
    batteryPercent: 45,
    signalPercent: 88,
    lastCheckMinutesAgo: 12,
  },
]

function Meter({
  label,
  percent,
  tone,
}: {
  label: string
  percent: number
  tone: 'battery' | 'signal'
}) {
  const modifier =
    tone === 'signal' ? 'is-signal' : percent < 50 ? 'is-low' : ''
  return (
    <div>
      <div className="sys-meter-row">
        <span>{label}</span>
        <b className={modifier}>{percent}%</b>
      </div>
      <div className="sys-meter">
        <span className={modifier} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export function SystemOperatorDevicesScreen() {
  const { t } = useI18n(systemOperatorDevicesScreenMessages)
  const [devices] = useState<DeviceItem[]>(INITIAL_DEVICES)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const filtered = devices.filter(
    (d) => filterStatus === 'ALL' || d.status === filterStatus,
  )

  return (
    <div>
      <div className="sys-devices-banner">
        <div>
          <h1>{t.bannerTitle}</h1>
          <p>{t.bannerSubtitle}</p>
        </div>
        <select
          className="sys-devices-filter"
          aria-label={t.bannerTitle}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">{t.filterAll(devices.length)}</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="IDLE_CHARGING">IDLE_CHARGING</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
      </div>

      <div className="sys-devices-grid">
        {filtered.map((device) => (
          <div key={device.id} className="sys-device">
            <div className="sys-device-top">
              <span className="odm-mono sys-device-code">{device.code}</span>
              <span
                className={`sys-badge is-${device.status.toLowerCase()}`}
              >
                {t.statusLabels[device.status]}
              </span>
            </div>

            <div>
              <div className="sys-device-name">{device.name}</div>
              <div className="sys-device-model">
                {t.model}: {device.model}
              </div>
            </div>

            <div className="sys-meters">
              <Meter
                label={t.batteryLevel}
                percent={device.batteryPercent}
                tone="battery"
              />
              <Meter
                label={t.telemetrySignal}
                percent={device.signalPercent}
                tone="signal"
              />
            </div>

            <div className="sys-device-foot">
              <span>
                {t.updated}:{' '}
                {device.lastCheckMinutesAgo === 0
                  ? t.justNow
                  : t.minutesAgo(device.lastCheckMinutesAgo)}
              </span>
              {device.status === 'MAINTENANCE' && (
                <a href="#portal/staff/technical/maintenance">
                  {t.viewMaintenanceTicket}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
