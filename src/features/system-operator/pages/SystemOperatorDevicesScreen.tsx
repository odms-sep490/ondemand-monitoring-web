// Fleet devices view for the system operator (embedded in the staff shell)
import '../sysop.scss'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  FilterBar,
  FilterSegments,
  PageHeader,
  StatusTag,
  type FilterOption,
} from '../../../shared/components/antd'
import { useI18n } from '../../../shared/i18n'
import { Progress } from 'antd'
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

export function SystemOperatorDevicesScreen() {
  const { t } = useI18n(systemOperatorDevicesScreenMessages)
  const [devices] = useState<DeviceItem[]>(INITIAL_DEVICES)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  const filtered = devices.filter(
    (d) => filterStatus === 'ALL' || d.status === filterStatus,
  )

  const statusTone = {
    AVAILABLE: 'success',
    IDLE_CHARGING: 'warning',
    MAINTENANCE: 'danger',
    IN_FLIGHT: 'info',
  } as const

  const filterKeys = ['AVAILABLE', 'IDLE_CHARGING', 'MAINTENANCE'] as const
  const options: FilterOption<string>[] = [
    { value: 'ALL', label: t.filterAll(devices.length) },
    ...filterKeys.map((key) => ({
      value: key,
      label: t.filterLabels[key],
      count: devices.filter((d) => d.status === key).length,
    })),
  ]

  return (
    <div className="mgr-view">
      <PageHeader title={t.bannerTitle} description={t.bannerSubtitle} />
      <FilterBar
        start={
          <FilterSegments
            options={options}
            value={filterStatus}
            onChange={setFilterStatus}
            ariaLabel={t.filterAria}
          />
        }
      />
      {filtered.length === 0 ? (
        <CardComponent>
          <EmptyState title={t.empty} />
        </CardComponent>
      ) : (
        <div className="sysop-device-grid">
          {filtered.map((device) => {
            const lowBattery = device.batteryPercent < 50
            return (
              <CardComponent
                key={device.id}
                className="sysop-device"
                title={device.code}
                extra={
                  <StatusTag tone={statusTone[device.status]}>
                    {t.statusLabels[device.status]}
                  </StatusTag>
                }
              >
                <div className="sysop-device-name">{device.name}</div>
                <div className="sysop-device-model">
                  {t.model}: {device.model}
                </div>
                <div className="sysop-device-meter">
                  <div className="sysop-device-meter-row">
                    <span>{t.batteryLevel}</span>
                    <strong className={lowBattery ? 'is-low' : undefined}>
                      {device.batteryPercent}%
                    </strong>
                  </div>
                  <Progress
                    percent={device.batteryPercent}
                    showInfo={false}
                    size="small"
                    status={lowBattery ? 'exception' : 'success'}
                    aria-label={t.batteryLevel}
                  />
                </div>
                <div className="sysop-device-meter">
                  <div className="sysop-device-meter-row">
                    <span>{t.telemetrySignal}</span>
                    <strong>{device.signalPercent}%</strong>
                  </div>
                  <Progress
                    percent={device.signalPercent}
                    showInfo={false}
                    size="small"
                    aria-label={t.telemetrySignal}
                  />
                </div>
                <div className="sysop-device-foot">
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
              </CardComponent>
            )
          })}
        </div>
      )}
    </div>
  )
}
