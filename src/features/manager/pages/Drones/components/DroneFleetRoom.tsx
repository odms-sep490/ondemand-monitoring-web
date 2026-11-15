import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Input, Skeleton } from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  SendOutlined,
} from '@ant-design/icons'

import type { AvailableDrone } from '../../../../staff/api/droneApi'
import { useI18n } from '../../../../../shared/i18n'
import { getDroneStatusLabel } from '../../../../../shared/lib/statusTone'
import type { DeviceResponse } from '../../../types/drones'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneRoomAssignmentControl } from './DroneRoomAssignmentControl'
import './droneFleetRoom.scss'

const DroneRoomScene = lazy(() =>
  import('./DroneRoomScene').then((module) => ({
    default: module.DroneRoomScene,
  })),
)

function droneLabel(drone: DeviceResponse, fallbackName: string) {
  const name = drone.serialNumber || drone.name || fallbackName
  const model = drone.deviceModel?.code || drone.deviceModel?.modelName
  return model ? `${name} · ${model}` : name
}

type DroneDetailRow = {
  label: string
  value: string
}

function formatDate(
  value: string | null | undefined,
  locale: string,
  fallback: string,
) {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function humanizeMetadataKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const SPEC_UNITS: Record<string, string> = {
  maxFlightMinutes: ' min',
  maxFlightTimeMinutes: ' min',
  maxTakeoffWeightKg: ' kg',
  maxFlightAltitudeMeters: ' m',
  maxWindResistanceMetersPerSecond: ' m/s',
  cameraResolutionMp: ' MP',
  batteryCapacityMah: ' mAh',
  maxRangeKm: ' km',
  weightG: ' g',
  weightKg: ' kg',
  maxPayloadKg: ' kg',
}

function humanizeMetadataValue(value: string) {
  if (!value.includes('_')) return value
  return value
    .split(/_+/)
    .filter(Boolean)
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : `${part[0].toUpperCase()}${part.slice(1).toLowerCase()}`,
    )
    .join(' ')
}

function formatMetadataValue(
  value: unknown,
  key: string,
  yes: string,
  no: string,
): string {
  if (typeof value === 'boolean') return value ? yes : no
  if (Array.isArray(value)) {
    return value
      .map((item) => formatMetadataValue(item, key, yes, no))
      .filter(Boolean)
      .join(', ')
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(
        ([nestedKey, nestedValue]) =>
          `${humanizeMetadataKey(nestedKey)}: ${formatMetadataValue(nestedValue, nestedKey, yes, no)}`,
      )
      .filter((item) => !item.endsWith(': '))
      .join('; ')
  }
  if (value === null || value === undefined || value === '') return ''

  const formatted =
    typeof value === 'string' ? humanizeMetadataValue(value) : String(value)
  const suffix = SPEC_UNITS[key]
  return typeof value === 'number' && suffix
    ? `${formatted}${suffix}`
    : formatted
}

function flattenSpecifications(
  metadata: Record<string, unknown> | null | undefined,
  labels: Record<string, string>,
  yes: string,
  no: string,
  prefix = '',
): DroneDetailRow[] {
  if (!metadata) return []

  return Object.entries(metadata).flatMap(([key, value]) => {
    const labelPart = labels[key] ?? humanizeMetadataKey(key)
    const label = prefix ? `${prefix} · ${labelPart}` : labelPart
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenSpecifications(
        value as Record<string, unknown>,
        labels,
        yes,
        no,
        label,
      )
    }
    const formattedValue = formatMetadataValue(value, key, yes, no)
    return formattedValue ? [{ label, value: formattedValue }] : []
  })
}

export function DroneFleetRoom({
  drones,
  loading,
  error,
  onRetry,
  onChangeStatus,
  initialDroneId,
  assignmentMissionId,
  returnMissionId,
  onMissionChange,
  onAssignmentChanged,
}: {
  drones: DeviceResponse[]
  loading: boolean
  error: unknown
  onRetry: () => void
  onChangeStatus: (drone: DeviceResponse) => void
  initialDroneId?: string
  assignmentMissionId?: string
  returnMissionId?: string
  onMissionChange?: (missionId?: string) => void
  onAssignmentChanged?: () => void
}) {
  const { t, lang } = useI18n(dronesPageMessages)
  const copy = t.workspace
  const locale = lang === 'en' ? 'en-US' : 'vi-VN'
  const [search, setSearch] = useState('')
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(
    initialDroneId ?? null,
  )

  const filteredDrones = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale)
    if (!query) return drones
    return drones.filter((drone) =>
      droneLabel(drone, copy.unnamedDrone).toLocaleLowerCase(locale).includes(query),
    )
  }, [copy.unnamedDrone, drones, locale, search])
  const selectedDrone = filteredDrones.find((drone) => drone.id === selectedDroneId) ?? null
  const sceneDrones: AvailableDrone[] = useMemo(
    () => filteredDrones.map((drone) => ({
      id: drone.id,
      label: droneLabel(drone, copy.unnamedDrone),
      status: drone.status,
    })),
    [copy.unnamedDrone, filteredDrones],
  )
  const detailModel = selectedDrone?.deviceModel
  const modelCategory = detailModel?.specsMetadata?.category
  const specificationMetadata = detailModel?.specsMetadata
    ? Object.fromEntries(
        Object.entries(detailModel.specsMetadata).filter(([key]) => key !== 'category'),
      )
    : undefined
  const specificationRows = flattenSpecifications(
    specificationMetadata,
    copy.specLabels,
    copy.yes,
    copy.no,
  )

  useEffect(() => {
    if (selectedDroneId && filteredDrones.some((drone) => drone.id === selectedDroneId)) return
    setSelectedDroneId(filteredDrones[0]?.id ?? null)
  }, [filteredDrones, selectedDroneId])

  useEffect(() => {
    if (initialDroneId) setSelectedDroneId(initialDroneId)
  }, [initialDroneId])

  return (
    <section className="mgr-drone-room-layout" aria-label={copy.roomView}>
      <div className="mgr-drone-room-stage">
        <div className="mgr-drone-room-stage-heading">
          <div>
            <h2>{copy.roomView}</h2>
            <p>{copy.roomCount(filteredDrones.length, drones.length)}</p>
          </div>
          <span className="mgr-drone-room-bay-count">{copy.bays(Math.max(6, filteredDrones.length))}</span>
        </div>
        <Suspense
          fallback={
            <div className="mgr-office-drone-scene-loading" role="status">
              {copy.roomLoading}
            </div>
          }
        >
          <DroneRoomScene
            drones={sceneDrones}
            selectedDroneId={selectedDroneId}
            onSelect={setSelectedDroneId}
            label={copy.roomView}
            fallbackMessage={copy.roomFallback}
            loadingMessage={copy.roomLoading}
          />
        </Suspense>
        <p className="mgr-drone-room-footnote">{copy.roomDescription}</p>
      </div>

      <aside className="mgr-drone-room-sidebar" aria-label={copy.deviceList}>
        <div className="mgr-drone-room-sidebar-heading">
          <h2>{copy.deviceList}</h2>
          <span>{drones.length}</span>
        </div>
        {loading ? (
          <div className="mgr-drone-room-load-state" role="status" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 4 }} />
          </div>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message={copy.loadError}
            description={error instanceof Error ? error.message : undefined}
            action={
              <Button icon={<ReloadOutlined aria-hidden="true" />} onClick={onRetry}>
                {copy.retry}
              </Button>
            }
          />
        ) : drones.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<><strong>{copy.emptyRoom}</strong><br />{copy.emptyRoomDescription}</>}
          />
        ) : (
          <details className="mgr-drone-room-device-picker">
            <summary>
              {copy.chooseDroneFromList}
              <span>{drones.length}</span>
            </summary>
            <div className="mgr-drone-room-device-picker-content">
              <Input
                allowClear
                prefix={<SearchOutlined aria-hidden="true" />}
                value={search}
                placeholder={copy.deviceSearch}
                aria-label={copy.deviceSearchAria}
                onChange={(event) => {
                  setSearch(event.target.value)
                }}
              />

              {filteredDrones.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noSearch} />
              ) : (
                <div className="mgr-drone-room-device-list" role="list" aria-label={copy.deviceList}>
                  {filteredDrones.map((drone) => (
                    <div role="listitem" key={drone.id}>
                      <button
                        type="button"
                        className={`mgr-drone-room-device${selectedDroneId === drone.id ? ' is-selected' : ''}`}
                        aria-pressed={selectedDroneId === drone.id}
                        onClick={() => setSelectedDroneId(drone.id)}
                      >
                        <span className="mgr-drone-room-device-mark"><SendOutlined aria-hidden="true" /></span>
                        <span className="mgr-drone-room-device-copy">
                          <strong>{drone.name || drone.serialNumber || copy.unnamedDrone}</strong>
                          <small>{drone.deviceModel?.code || drone.deviceModel?.modelName || drone.serialNumber}</small>
                        </span>
                        <span className="mgr-drone-room-device-status">{getDroneStatusLabel(drone.status, lang)}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
        )}

        {selectedDrone && (
          <section
            className="mgr-drone-room-details"
            aria-labelledby="mgr-drone-room-details-title"
          >
            <h3 id="mgr-drone-room-details-title">{copy.details}</h3>
            <div className="mgr-drone-room-selected-device">
              {selectedDrone.imageUrl ? (
                <ImagePreview className="mgr-drone-room-selected-image"
                  src={selectedDrone.imageUrl} fileName={copy.deviceImageAlt} />
              ) : (
                <span className="mgr-drone-room-selected-mark" aria-hidden="true">
                  <SendOutlined />
                </span>
              )}
              <span className="mgr-drone-room-selected-copy">
                <strong>{droneLabel(selectedDrone, copy.unnamedDrone)}</strong>
                <small>
                  {detailModel?.modelName || detailModel?.code || copy.modelUnknown}
                </small>
              </span>
              <span className="mgr-drone-room-device-status">
                {getDroneStatusLabel(selectedDrone.status, lang)}
              </span>
            </div>

            <DroneRoomAssignmentControl
              drone={selectedDrone}
              lang={lang}
              assignmentMissionId={assignmentMissionId}
              returnMissionId={returnMissionId}
              onMissionChange={onMissionChange}
              onAssignmentChanged={onAssignmentChanged}
            />

            <details className="mgr-drone-room-full-details">
              <summary>{copy.fullDetails}</summary>
              <div className="mgr-drone-room-full-details-content">
                <div className="mgr-drone-room-detail-group">
              <h4>{copy.deviceInformation}</h4>
              <dl>
                {[
                  [copy.deviceName, selectedDrone.name || copy.notAvailable],
                  [copy.serialNumber, selectedDrone.serialNumber || copy.notAvailable],
                  [t.columns.status, getDroneStatusLabel(selectedDrone.status, lang)],
                  [copy.created, formatDate(selectedDrone.createdAt, locale, copy.notAvailable)],
                  [copy.updated, formatDate(selectedDrone.updatedAt, locale, copy.notAvailable)],
                  [copy.version, String(selectedDrone.version)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
                </div>

                <div className="mgr-drone-room-detail-group">
              <h4>{copy.modelInformation}</h4>
              <dl>
                {[
                  [t.columns.model, detailModel?.modelName || copy.modelUnknown],
                  [copy.modelCode, detailModel?.code || copy.notAvailable],
                  [copy.manufacturer, detailModel?.manufacturer || copy.notAvailable],
                  [copy.created, formatDate(detailModel?.createdAt, locale, copy.notAvailable)],
                  [copy.updated, formatDate(detailModel?.updatedAt, locale, copy.notAvailable)],
                  [
                    copy.version,
                    detailModel?.version == null
                      ? copy.notAvailable
                      : String(detailModel.version),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
                </div>

                <div className="mgr-drone-room-detail-group">
              <h4>{copy.typeInformation}</h4>
              {(detailModel?.deviceTypes ?? []).length > 0 ? (
                (detailModel?.deviceTypes ?? []).map((deviceType) => (
                  <div className="mgr-drone-room-detail-type" key={deviceType.id}>
                    <strong>{deviceType.name || deviceType.code}</strong>
                    <dl>
                      {[
                        [copy.deviceTypeCode, deviceType.code || copy.notAvailable],
                        [copy.description, deviceType.description || copy.notAvailable],
                        [copy.created, formatDate(deviceType.createdAt, locale, copy.notAvailable)],
                        [copy.updated, formatDate(deviceType.updatedAt, locale, copy.notAvailable)],
                        [
                          copy.version,
                          deviceType.version == null
                            ? copy.notAvailable
                            : String(deviceType.version),
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))
              ) : modelCategory ? (
                <dl>
                  <div>
                    <dt>{copy.deviceCategory}</dt>
                    <dd>{formatMetadataValue(modelCategory, 'category', copy.yes, copy.no)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mgr-drone-room-detail-empty">{copy.notAvailable}</p>
              )}
                </div>

                <div className="mgr-drone-room-detail-group">
              <h4>{copy.specifications}</h4>
              {specificationRows.length > 0 ? (
                <dl>
                  {specificationRows.map(({ label, value }) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mgr-drone-room-detail-empty">{copy.noSpecifications}</p>
              )}
                </div>
              </div>
              <Button block onClick={() => onChangeStatus(selectedDrone)}>
                {t.changeStatus}
              </Button>
            </details>
          </section>
        )}
      </aside>
    </section>
  )
}
