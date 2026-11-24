import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Alert, Button, Empty, Input, Skeleton } from 'antd'
import {
  AimOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
  SearchOutlined,
  SendOutlined,
  UnorderedListOutlined,
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

type InspectorTab = 'info' | 'assign' | 'list'
type StatusFilter = 'ALL' | 'AVAILABLE' | 'IN_MISSION' | 'MAINTENANCE' | 'OTHER'

function droneLabel(drone: DeviceResponse, fallbackName: string) {
  const name = drone.serialNumber || drone.name || fallbackName
  const model = drone.deviceModel?.code || drone.deviceModel?.modelName
  return model ? `${name} · ${model}` : name
}

function statusToneClass(status?: string | null): string {
  const normalized = status?.trim().toUpperCase() ?? ''
  if (normalized === 'AVAILABLE' || normalized === 'READY') return 'is-available'
  if (normalized === 'MAINTENANCE' || normalized === 'CHARGING' || normalized === 'PREFLIGHT')
    return 'is-maintenance'
  if (
    normalized === 'OUT_OF_SERVICE' ||
    normalized === 'RETIRED' ||
    normalized === 'OFFLINE' ||
    normalized === 'FAULT'
  )
    return 'is-offline'
  return 'is-mission'
}

function matchesStatusFilter(status: string | null | undefined, filter: StatusFilter): boolean {
  if (filter === 'ALL') return true
  const normalized = (status ?? '').trim().toUpperCase()
  if (filter === 'AVAILABLE') return normalized === 'AVAILABLE' || normalized === 'CHARGING'
  if (filter === 'IN_MISSION') {
    return (
      normalized === 'ASSIGNED' ||
      normalized === 'RESERVED' ||
      normalized === 'PREFLIGHT' ||
      normalized === 'IN_FLIGHT' ||
      normalized === 'IN_MISSION'
    )
  }
  if (filter === 'MAINTENANCE') return normalized === 'MAINTENANCE'
  return (
    normalized === 'OUT_OF_SERVICE' ||
    normalized === 'RETIRED' ||
    normalized === 'OFFLINE' ||
    normalized === 'FAULT'
  )
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
  const isEnglish = lang === 'en'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(
    initialDroneId ?? null,
  )
  const [activeTab, setActiveTab] = useState<InspectorTab>(
    assignmentMissionId ? 'assign' : 'info',
  )
  const [focusRequestId, setFocusRequestId] = useState(0)

  const filteredDrones = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale)
    return drones.filter((drone) => {
      if (!matchesStatusFilter(drone.status, statusFilter)) return false
      if (!query) return true
      const haystack = `${drone.name ?? ''} ${drone.serialNumber ?? ''} ${drone.deviceModel?.code ?? ''} ${drone.deviceModel?.modelName ?? ''}`
        .toLocaleLowerCase(locale)
      return haystack.includes(query)
    })
  }, [drones, locale, search, statusFilter])

  const selectedDrone =
    drones.find((drone) => drone.id === selectedDroneId) ??
    filteredDrones[0] ??
    null

  const sceneDrones: AvailableDrone[] = useMemo(
    () =>
      filteredDrones.map((drone) => ({
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
    if (selectedDroneId && drones.some((drone) => drone.id === selectedDroneId)) return
    setSelectedDroneId(filteredDrones[0]?.id ?? drones[0]?.id ?? null)
  }, [drones, filteredDrones, selectedDroneId])

  useEffect(() => {
    if (initialDroneId) setSelectedDroneId(initialDroneId)
  }, [initialDroneId])

  useEffect(() => {
    if (assignmentMissionId) setActiveTab('assign')
  }, [assignmentMissionId])

  function handleSelectFromList(droneId: string) {
    setSelectedDroneId(droneId)
    setFocusRequestId((prev) => prev + 1)
  }

  function handleFocusCurrent() {
    if (!selectedDrone) return
    setFocusRequestId((prev) => prev + 1)
  }

  const tabLabels = {
    info: isEnglish ? 'Details' : 'Thông tin',
    assign: isEnglish ? 'Assign' : 'Gán nhiệm vụ',
    list: isEnglish ? 'Fleet' : 'Danh sách',
    focusBtn: isEnglish ? 'Focus in 3D' : 'Tập trung 3D',
    quickAssign: isEnglish ? 'Assign mission' : 'Gán nhiệm vụ',
    systemMeta: isEnglish ? 'System & Model Info' : 'Thông tin hệ thống & model',
  }

  const filterOptions: Array<{ key: StatusFilter; label: string }> = [
    { key: 'ALL', label: t.filterAll },
    { key: 'AVAILABLE', label: t.stats.available },
    { key: 'IN_MISSION', label: t.stats.inMission },
    { key: 'MAINTENANCE', label: t.stats.maintenance },
    { key: 'OTHER', label: t.stats.outOfService },
  ]

  return (
    <section className="mgr-drone-room-layout" aria-label={copy.roomView}>
      <div className="mgr-drone-room-stage">
        <Suspense
          fallback={
            <div className="mgr-office-drone-scene-loading" role="status">
              {copy.roomLoading}
            </div>
          }
        >
          <DroneRoomScene
            drones={sceneDrones}
            selectedDroneId={selectedDrone?.id ?? null}
            onSelect={(id) => {
              setSelectedDroneId(id)
            }}
            label={copy.roomView}
            fallbackMessage={copy.roomFallback}
            loadingMessage={copy.roomLoading}
            lang={lang}
            focusRequestId={focusRequestId}
            fleetSummaryLabel={copy.roomCount(filteredDrones.length, drones.length)}
            bayCountLabel={copy.bays(Math.max(6, filteredDrones.length))}
          />
        </Suspense>
      </div>

      <aside className="mgr-drone-room-sidebar" aria-label={copy.deviceList}>
        {loading ? (
          <div className="mgr-drone-room-load-state" role="status" aria-busy="true">
            <Skeleton active title={false} paragraph={{ rows: 5 }} />
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
          <div className="mgr-drone-room-empty-panel">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <>
                  <strong>{copy.emptyRoom}</strong>
                  <br />
                  {copy.emptyRoomDescription}
                </>
              }
            />
          </div>
        ) : (
          <>
            {/* Compact Selected Drone Header (always visible across tabs) */}
            {selectedDrone && (
              <div className="mgr-drone-inspector-hero">
                {selectedDrone.imageUrl ? (
                  <ImagePreview
                    className="mgr-drone-room-selected-image"
                    src={selectedDrone.imageUrl}
                    fileName={copy.deviceImageAlt}
                  />
                ) : (
                  <span className="mgr-drone-room-selected-mark" aria-hidden="true">
                    <SendOutlined />
                  </span>
                )}
                <div className="mgr-drone-room-selected-copy">
                  <strong title={droneLabel(selectedDrone, copy.unnamedDrone)}>
                    {selectedDrone.name || selectedDrone.serialNumber || copy.unnamedDrone}
                  </strong>
                  <small>
                    {selectedDrone.serialNumber || copy.notAvailable}
                    {detailModel?.modelName ? ` · ${detailModel.modelName}` : ''}
                  </small>
                  <div className="mgr-drone-inspector-hero-meta">
                    <span
                      className={`mgr-drone-room-device-status ${statusToneClass(selectedDrone.status)}`}
                    >
                      {getDroneStatusLabel(selectedDrone.status, lang)}
                    </span>
                    <button
                      type="button"
                      className="mgr-drone-focus-chip"
                      onClick={handleFocusCurrent}
                    >
                      <AimOutlined aria-hidden="true" />
                      <span>{tabLabels.focusBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Compact 3-Tab Inspector Navigation */}
            <div
              className="mgr-drone-inspector-tabs"
              role="tablist"
              aria-label={copy.deviceList}
            >
              <button
                type="button"
                role="tab"
                id="drone-tab-info"
                aria-selected={activeTab === 'info'}
                aria-controls="drone-panel-info"
                className={`mgr-drone-inspector-tab${activeTab === 'info' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <InfoCircleOutlined aria-hidden="true" />
                <span>{tabLabels.info}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="drone-tab-assign"
                aria-selected={activeTab === 'assign'}
                aria-controls="drone-panel-assign"
                className={`mgr-drone-inspector-tab${activeTab === 'assign' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('assign')}
              >
                <ScheduleOutlined aria-hidden="true" />
                <span>{tabLabels.assign}</span>
              </button>
              <button
                type="button"
                role="tab"
                id="drone-tab-list"
                aria-selected={activeTab === 'list'}
                aria-controls="drone-panel-list"
                className={`mgr-drone-inspector-tab${activeTab === 'list' ? ' is-active' : ''}`}
                onClick={() => setActiveTab('list')}
              >
                <UnorderedListOutlined aria-hidden="true" />
                <span>{tabLabels.list}</span>
                <em className="mgr-drone-tab-count">{drones.length}</em>
              </button>
            </div>

            {/* Scrollable Inspector Body (contained inside fixed viewport height) */}
            <div className="mgr-drone-inspector-body">
              {/* TAB 1: THÔNG TIN */}
              <div
                id="drone-panel-info"
                role="tabpanel"
                aria-labelledby="drone-tab-info"
                hidden={activeTab !== 'info'}
                className="mgr-drone-tab-panel"
              >
                {selectedDrone && (
                  <div className="mgr-drone-info-stack">
                    <div className="mgr-drone-quick-grid">
                      <div>
                        <span>{copy.serialNumber}</span>
                        <strong>{selectedDrone.serialNumber || copy.notAvailable}</strong>
                      </div>
                      <div>
                        <span>{t.columns.model}</span>
                        <strong>{detailModel?.modelName || detailModel?.code || copy.modelUnknown}</strong>
                      </div>
                      <div>
                        <span>{copy.manufacturer}</span>
                        <strong>{detailModel?.manufacturer || copy.notAvailable}</strong>
                      </div>
                      <div>
                        <span>{copy.updated}</span>
                        <strong>{formatDate(selectedDrone.updatedAt, locale, copy.notAvailable)}</strong>
                      </div>
                    </div>

                    <div className="mgr-drone-primary-actions">
                      <Button
                        type="primary"
                        block
                        icon={<ScheduleOutlined />}
                        onClick={() => setActiveTab('assign')}
                      >
                        {tabLabels.quickAssign}
                      </Button>
                      <Button block onClick={() => onChangeStatus(selectedDrone)}>
                        {t.changeStatus}
                      </Button>
                    </div>

                    {/* Collapsible Technical Specifications */}
                    <details className="mgr-drone-room-full-details">
                      <summary>
                        <span>{copy.specifications}</span>
                        {specificationRows.length > 0 && (
                          <span className="mgr-drone-accordion-badge">{specificationRows.length}</span>
                        )}
                      </summary>
                      <div className="mgr-drone-room-full-details-content">
                        {specificationRows.length > 0 ? (
                          <dl className="mgr-drone-spec-dl">
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
                    </details>

                    {/* Collapsible System, Model & Device Types */}
                    <details className="mgr-drone-room-full-details">
                      <summary>
                        <span>{tabLabels.systemMeta}</span>
                      </summary>
                      <div className="mgr-drone-room-full-details-content">
                        <div className="mgr-drone-room-detail-group">
                          <h4>{copy.deviceInformation}</h4>
                          <dl className="mgr-drone-spec-dl">
                            {[
                              [copy.deviceName, selectedDrone.name || copy.notAvailable],
                              [copy.serialNumber, selectedDrone.serialNumber || copy.notAvailable],
                              [t.columns.status, getDroneStatusLabel(selectedDrone.status, lang)],
                              [copy.created, formatDate(selectedDrone.createdAt, locale, copy.notAvailable)],
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
                          <h4>{copy.typeInformation}</h4>
                          {(detailModel?.deviceTypes ?? []).length > 0 ? (
                            (detailModel?.deviceTypes ?? []).map((deviceType) => (
                              <div className="mgr-drone-room-detail-type" key={deviceType.id}>
                                <strong>{deviceType.name || deviceType.code}</strong>
                                <dl className="mgr-drone-spec-dl">
                                  {[
                                    [copy.deviceTypeCode, deviceType.code || copy.notAvailable],
                                    [copy.description, deviceType.description || copy.notAvailable],
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
                            <dl className="mgr-drone-spec-dl">
                              <div>
                                <dt>{copy.deviceCategory}</dt>
                                <dd>{formatMetadataValue(modelCategory, 'category', copy.yes, copy.no)}</dd>
                              </div>
                            </dl>
                          ) : (
                            <p className="mgr-drone-room-detail-empty">{copy.notAvailable}</p>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>

              {/* TAB 2: GÁN NHIỆM VỤ */}
              <div
                id="drone-panel-assign"
                role="tabpanel"
                aria-labelledby="drone-tab-assign"
                hidden={activeTab !== 'assign'}
                className="mgr-drone-tab-panel"
              >
                {selectedDrone && (
                  <DroneRoomAssignmentControl
                    drone={selectedDrone}
                    lang={lang}
                    assignmentMissionId={assignmentMissionId}
                    returnMissionId={returnMissionId}
                    onMissionChange={onMissionChange}
                    onAssignmentChanged={onAssignmentChanged}
                  />
                )}
              </div>

              {/* TAB 3: DANH SÁCH DRONE */}
              <div
                id="drone-panel-list"
                role="tabpanel"
                aria-labelledby="drone-tab-list"
                hidden={activeTab !== 'list'}
                className="mgr-drone-tab-panel"
              >
                <div className="mgr-drone-explorer">
                  <Input
                    allowClear
                    size="middle"
                    prefix={<SearchOutlined aria-hidden="true" />}
                    value={search}
                    placeholder={copy.deviceSearch}
                    aria-label={copy.deviceSearchAria}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  <div
                    className="mgr-drone-filter-chips"
                    role="group"
                    aria-label={t.filterAria}
                  >
                    {filterOptions.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        className={`mgr-drone-filter-chip${statusFilter === opt.key ? ' is-active' : ''}`}
                        aria-pressed={statusFilter === opt.key}
                        onClick={() => setStatusFilter(opt.key)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {filteredDrones.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={copy.noSearch} />
                  ) : (
                    <div
                      className="mgr-drone-room-device-list"
                      role="list"
                      aria-label={copy.deviceList}
                    >
                      {filteredDrones.map((drone) => {
                        const isSelected = selectedDrone?.id === drone.id
                        return (
                          <div role="listitem" key={drone.id}>
                            <button
                              type="button"
                              className={`mgr-drone-room-device${isSelected ? ' is-selected' : ''}`}
                              aria-pressed={isSelected}
                              onClick={() => handleSelectFromList(drone.id)}
                            >
                              <span
                                className={`mgr-drone-room-device-dot ${statusToneClass(drone.status)}`}
                                aria-hidden="true"
                              />
                              <span className="mgr-drone-room-device-copy">
                                <strong>{drone.name || drone.serialNumber || copy.unnamedDrone}</strong>
                                <small>
                                  {drone.serialNumber}
                                  {drone.deviceModel?.code ? ` · ${drone.deviceModel.code}` : ''}
                                </small>
                              </span>
                              <span
                                className={`mgr-drone-room-device-status ${statusToneClass(drone.status)}`}
                              >
                                {getDroneStatusLabel(drone.status, lang)}
                              </span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </section>
  )
}
