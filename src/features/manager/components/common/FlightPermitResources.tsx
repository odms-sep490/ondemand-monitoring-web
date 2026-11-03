import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { dronesApi } from '../../api/dronesApi'
import type { DeviceResponse } from '../../types/drones'
import type {
  MissionDeviceAssignmentResponse,
  MissionResponse,
} from '../../types/missions'
import { useI18n } from '../../../../shared/i18n'
import { flightPermitCardMessages } from './FlightPermitCard.messages'
import { OrderIcon } from './OrderIcon'
import { StaffLicenseSummary } from '../../../staff/components/StaffLicenseSummary'
import {
  assignmentTone,
  groupStaffAssignments,
  initialsOf,
  STAFF_RESPONSE_LABELS,
  STAFF_ROLE_LABELS,
} from './missionDetailHelpers'

type AssignedDevice = {
  id: string
  name: string | null
  code: string | null
  serialNumber: string | null
  status: string | null
  role: string
  checkupStatus: string | null
}

export function FlightPermitResources({
  mission,
}: {
  mission: MissionResponse
}) {
  const { t } = useI18n(flightPermitCardMessages)
  const assignedDevices = useMemo<AssignedDevice[]>(() => {
    const rows = mission.deviceAssignments ?? []
    if (rows.length > 0) {
      return rows.map((row: MissionDeviceAssignmentResponse) => ({
        id: row.deviceId,
        name: row.deviceName,
        code: row.deviceCode,
        serialNumber: row.deviceSerialNumber,
        status: row.deviceStatus,
        role: row.deviceRole,
        checkupStatus: row.checkupStatus,
      }))
    }
    const id = mission.deviceId || mission.droneId
    if (!id) return []
    return [
      {
        id,
        name: mission.deviceName ?? null,
        code: mission.deviceCode ?? mission.droneCode,
        serialNumber: mission.deviceSerialNumber ?? null,
        status: mission.deviceStatus ?? null,
        role: 'MAIN',
        checkupStatus: null,
      },
    ]
  }, [mission])

  const deviceIdsKey = assignedDevices.map((device) => device.id).join('|')
  const [deviceDetails, setDeviceDetails] = useState<
    Record<string, DeviceResponse>
  >({})
  const [loadingIds, setLoadingIds] = useState<string[]>([])

  useEffect(() => {
    const ids = [...new Set(deviceIdsKey.split('|').filter(Boolean))]
    if (ids.length === 0) {
      setDeviceDetails({})
      setLoadingIds([])
      return
    }
    const controller = new AbortController()
    setLoadingIds(ids)
    Promise.all(
      ids.map(async (id) => {
        try {
          return [id, await dronesApi.getDrone(id, controller.signal)] as const
        } catch {
          return null
        }
      }),
    ).then((results) => {
      if (controller.signal.aborted) return
      setDeviceDetails(
        Object.fromEntries(results.filter((item): item is NonNullable<typeof item> => item !== null)),
      )
      setLoadingIds([])
    })
    return () => controller.abort()
  }, [deviceIdsKey])

  const staff = useMemo(
    () =>
      groupStaffAssignments(
        (mission.staffAssignments ?? []).filter(
          (assignment) => assignment.isCurrent !== false,
        ),
      ),
    [mission.staffAssignments],
  )

  return (
    <section className="odm-flight-resources" aria-labelledby={`flight-resources-${mission.id}`}>
      <h3 id={`flight-resources-${mission.id}`} className="odm-flight-resources__title">
        {t.resourcesTitle}
      </h3>
      <div className="odm-flight-resources__grid">
        <section className="odm-flight-resources__panel" aria-labelledby={`flight-devices-${mission.id}`}>
          <header className="odm-flight-resources__panel-head">
            <span className="odm-flight-resources__icon" aria-hidden="true"><OrderIcon name="drone" size={18} /></span>
            <h4 id={`flight-devices-${mission.id}`}>{t.devicesTitle}</h4>
            <span className="odm-flight-resources__count">{assignedDevices.length}</span>
          </header>
          {assignedDevices.length === 0 ? (
            <p className="odm-flight-resources__empty">{t.noDeviceAssigned}</p>
          ) : (
            <div className="odm-flight-resources__items">
              {assignedDevices.map((device) => {
                const detail = deviceDetails[device.id]
                const model = detail?.deviceModel
                const metadata = model?.specsMetadata ?? {}
                const types = model?.deviceTypes?.map((item) => item.name).filter(Boolean) ?? []
                const payload = assignedDevices.length === 1 ? parsePayload(mission.devicePayload) : null
                const specs = Object.entries(metadata)
                const displayedSpecs = specs.length > 0 ? metadata : payload
                return (
                  <article className="odm-flight-resources__device" key={device.id}>
                    <div className="odm-flight-resources__resource-head">
                      <span className="odm-flight-resources__avatar odm-flight-resources__avatar--device" aria-hidden="true">
                        {detail?.imageUrl ? (
                          <img src={detail.imageUrl} alt="" />
                        ) : (
                          <OrderIcon name="drone" size={22} />
                        )}
                      </span>
                      <div className="odm-flight-resources__identity">
                        <strong>{detail?.name || device.name || t.deviceName}</strong>
                        <span>{detail?.deviceModel?.modelName || mission.deviceModelName || model?.code || mission.deviceModelCode || '—'}</span>
                      </div>
                      <span className="odm-flight-resources__pill">
                        {t.deviceRole[device.role as keyof typeof t.deviceRole] ?? humanize(device.role)}
                      </span>
                    </div>
                    <dl className="odm-flight-resources__facts">
                      <Fact label={t.deviceCode} value={device.code || mission.deviceCode || mission.droneCode} />
                      <Fact label={t.serialNumber} value={detail?.serialNumber || device.serialNumber || mission.deviceSerialNumber} />
                      <Fact
                        label={t.deviceStatus}
                        value={translateStatus(
                          detail?.status || device.status || mission.deviceStatus,
                          t.deviceStatuses,
                        )}
                      />
                      <Fact label={t.checkStatus} value={translateStatus(device.checkupStatus, t.checkStatuses)} />
                    </dl>
                    <details className="odm-flight-resources__disclosure">
                      <summary>
                        <strong>{t.specifications}</strong>
                        <span className="odm-flight-resources__toggle-label">
                          <span className="when-closed">{t.openSpecifications}</span>
                          <span className="when-open">{t.closeSpecifications}</span>
                        </span>
                        <span className="odm-disclosure-chevron" aria-hidden="true" />
                      </summary>
                      <div className="odm-flight-resources__disclosure-content">
                        {displayedSpecs ? (
                          <div className="odm-flight-resources__specs">
                            <dl className="odm-flight-resources__facts odm-flight-resources__facts--specs">
                              <Fact label={t.manufacturer} value={model?.manufacturer || mission.deviceManufacturer} />
                              {types.length > 0 ? <Fact label={t.deviceType} value={types.join(', ')} /> : null}
                              {Object.entries(displayedSpecs).map(([key, value]) => (
                                <Fact
                                  key={key}
                                  label={t.specLabels[key] ?? humanize(key)}
                                  value={formatSpec(value, key, t.yes, t.no)}
                                />
                              ))}
                            </dl>
                          </div>
                        ) : loadingIds.includes(device.id) ? (
                          <p className="odm-flight-resources__hint" role="status">{t.loadingSpecifications}</p>
                        ) : (
                          <p className="odm-flight-resources__hint">{t.specificationsUnavailable}</p>
                        )}
                      </div>
                    </details>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="odm-flight-resources__panel" aria-labelledby={`flight-staff-${mission.id}`}>
          <header className="odm-flight-resources__panel-head">
            <span className="odm-flight-resources__icon odm-flight-resources__icon--staff" aria-hidden="true"><OrderIcon name="users" size={18} /></span>
            <h4 id={`flight-staff-${mission.id}`}>{t.staffTitle}</h4>
            <span className="odm-flight-resources__count">{staff.length}</span>
          </header>
          {staff.length === 0 ? (
            <p className="odm-flight-resources__empty">{t.noStaffAssigned}</p>
          ) : (
            <div className="odm-flight-resources__items">
              {staff.map((person) => {
                const name = person.staffName || t.staffTitle
                const roles = [...new Set(person.assignments.map((item) => item.assignedRole))]
                const phone = person.assignments.find((item) => item.staffPhone)?.staffPhone
                return (
                  <article className="odm-flight-resources__staff" key={person.staffId}>
                    <div className="odm-flight-resources__resource-head">
                      <span className="odm-flight-resources__avatar" aria-hidden="true">{initialsOf(name)}</span>
                      <div className="odm-flight-resources__identity">
                        <strong>{name}</strong>
                        <span>{roles.map((role) => STAFF_ROLE_LABELS[role]).join(' · ')}</span>
                      </div>
                      <span className={`odm-or-pill odm-or-pill-${assignmentTone(person.responseStatus)}`}>
                        {STAFF_RESPONSE_LABELS[person.responseStatus]}
                      </span>
                    </div>
                    <dl className="odm-flight-resources__facts">
                      {phone ? <Fact label={t.phone} value={<a href={`tel:${phone}`}>{phone}</a>} /> : null}
                      {person.staffEmail ? <Fact label={t.email} value={<a href={`mailto:${person.staffEmail}`}>{person.staffEmail}</a>} /> : null}
                    </dl>
                    <details className="odm-flight-resources__disclosure odm-flight-resources__license-disclosure">
                      <summary>
                        <strong>{t.licensesTitle}</strong>
                        <span className="odm-flight-resources__toggle-label">
                          <span className="when-closed">{t.openLicenses}</span>
                          <span className="when-open">{t.closeLicenses}</span>
                        </span>
                        <span className="odm-disclosure-chevron" aria-hidden="true" />
                      </summary>
                      <div className="odm-flight-resources__disclosure-content">
                        <StaffLicenseSummary
                          userId={person.staffId}
                          assignedRole={roles.includes('PILOT') ? 'PILOT' : roles.includes('MAINTAINER') ? 'MAINTAINER' : undefined}
                          canVerify
                        />
                      </div>
                    </details>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function translateStatus(value: string | null | undefined, labels: Record<string, string>) {
  if (!value) return '—'
  return labels[value] ?? humanize(value)
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatSpec(value: unknown, key: string, yes: string, no: string): string {
  if (typeof value === 'boolean') return value ? yes : no
  let formatted: string
  if (Array.isArray(value)) formatted = value.map((item) => formatSpec(item, key, yes, no)).join(', ')
  else if (value && typeof value === 'object') formatted = JSON.stringify(value)
  else formatted = String(value ?? '')
  const suffixes: Record<string, string> = {
    maxFlightMinutes: ' min',
    cameraResolutionMp: ' MP',
    batteryCapacityMah: ' mAh',
    maxRangeKm: ' km',
    weightG: ' g',
    maxPayloadKg: ' kg',
  }
  const suffix = suffixes[key]
  return suffix && formatted && !formatted.endsWith(suffix) ? `${formatted}${suffix}` : formatted
}

function parsePayload(payload: string | null | undefined): Record<string, unknown> | null {
  if (!payload) return null
  try {
    const parsed: unknown = JSON.parse(payload)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
