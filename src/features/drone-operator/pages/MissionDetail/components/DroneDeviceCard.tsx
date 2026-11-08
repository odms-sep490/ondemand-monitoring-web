import type { SyntheticEvent } from 'react'
import type { OperatorMission } from '../../../types/mission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { dronesApi } from '../../../../manager/api/dronesApi'
import type { DeviceResponse } from '../../../../manager/types/drones'
import { InfoRow } from './InfoRow'

const FALLBACK_DRONE_IMAGE = '/images/auth-hero-drone.png'

const MODEL_SPEC_LABELS: Record<string, { label: string; unit?: string }> = {
  category: { label: 'Phân loại' },
  aircraftType: { label: 'Loại drone' },
  maxFlightMinutes: { label: 'Thời gian bay tối đa', unit: 'phút' },
  maxFlightTimeMinutes: { label: 'Thời gian bay tối đa', unit: 'phút' },
  maxTakeoffWeightKg: {
    label: 'Khối lượng cất cánh tối đa',
    unit: 'kg',
  },
  maxFlightAltitudeMeters: { label: 'Độ cao bay tối đa', unit: 'm' },
  maxWindResistanceMetersPerSecond: {
    label: 'Khả năng chịu gió',
    unit: 'm/s',
  },
  camera: { label: 'Loại camera' },
  cameraResolutionMp: { label: 'Độ phân giải camera', unit: 'MP' },
  sensor: { label: 'Cảm biến ảnh' },
  rtkSupported: { label: 'Hỗ trợ RTK' },
  gnss: { label: 'Hệ thống định vị' },
  ipRating: { label: 'Chuẩn bảo vệ' },
  supportsPreflight: { label: 'Hỗ trợ kiểm tra trước bay' },
  supportsPostflight: { label: 'Hỗ trợ kiểm tra sau bay' },
}

const MODEL_SPEC_ORDER = Object.keys(MODEL_SPEC_LABELS)
const DEVICE_CATEGORY_LABELS: Record<string, string> = {
  PORTABLE: 'Gọn nhẹ',
  HEAVY_LIFT: 'Tải trọng lớn',
  COMPACT_THERMAL: 'Gọn nhẹ, tích hợp camera nhiệt',
}
const MODEL_SPEC_VALUE_LABELS: Record<string, Record<string, string>> = {
  aircraftType: { MULTIROTOR: 'Đa cánh quạt' },
}
const SPEC_NUMBER_FORMAT = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 2,
})

type DeviceInfoRow = { icon: string; label: string; value: unknown }

function modelSpecRows(metadata?: Record<string, unknown> | null) {
  if (!metadata) return []

  return Object.entries(metadata)
    .sort(([left], [right]) => {
      const leftOrder = MODEL_SPEC_ORDER.indexOf(left)
      const rightOrder = MODEL_SPEC_ORDER.indexOf(right)
      if (leftOrder < 0 && rightOrder < 0) return left.localeCompare(right)
      if (leftOrder < 0) return 1
      if (rightOrder < 0) return -1
      return leftOrder - rightOrder
    })
    .flatMap(([key, rawValue]) => {
      if (
        rawValue == null ||
        (typeof rawValue !== 'string' &&
          typeof rawValue !== 'number' &&
          typeof rawValue !== 'boolean')
      ) {
        return []
      }

      const textValue = String(rawValue).trim()
      if (!textValue) return []

      const field = MODEL_SPEC_LABELS[key]
      const categoryLabel =
        key === 'category' ? DEVICE_CATEGORY_LABELS[textValue] : undefined
      const normalizedValue = textValue.toLocaleUpperCase('en-US')
      const translatedValue = MODEL_SPEC_VALUE_LABELS[key]?.[normalizedValue]
      const numericValue =
        typeof rawValue === 'number'
          ? rawValue
          : field?.unit && Number.isFinite(Number(textValue))
            ? Number(textValue)
            : null
      const value =
        categoryLabel ??
        translatedValue ??
        (numericValue != null
          ? `${SPEC_NUMBER_FORMAT.format(numericValue)}${field?.unit ? ` ${field.unit}` : ''}`
          : typeof rawValue === 'boolean'
            ? rawValue
              ? 'Có'
              : 'Không'
            : textValue)
      const label =
        field?.label ??
        key
          .replace(/([a-z\d])([A-Z])/g, '$1 $2')
          .replace(/[_-]+/g, ' ')
          .replace(/^./, (first) => first.toLocaleUpperCase('vi-VN'))

      return [{ key, label, value }]
    })
}

function handleDroneImageError(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.dataset.fallback === 'true') {
    image.hidden = true
    return
  }
  image.dataset.fallback = 'true'
  image.src = FALLBACK_DRONE_IMAGE
  image.alt = 'Ảnh minh họa drone'
}

const DEVICE_ASSIGNMENT_LABEL: Record<string, string> = {
  ASSIGNED: 'Đã phân công',
  CONNECTED: 'Đã kết nối GCS',
  CONNECTION_LOST: 'Mất kết nối',
  PREFLIGHT_CHECKING: 'Đang kiểm tra trước bay',
  READY_TO_FLY: 'Sẵn sàng bay',
  IN_PROGRESS: 'Đang thực hiện',
  RETURNING: 'Đang trở về',
  POSTFLIGHT_CHECKING: 'Đang kiểm tra sau bay',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Không đạt',
  RELEASED: 'Đã thu hồi',
}

const DEVICE_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Sẵn sàng',
}

// ─── Device card ──────────────────────────────────────────────────────────────

export function DroneDeviceCard({
  mission,
  compact = false,
  overview = false,
}: {
  mission: OperatorMission
  compact?: boolean
  overview?: boolean
}) {
  const droneLabel = formatDeviceLabel(mission) ?? 'Chưa gán thiết bị'
  const deviceProfileQuery = useApiQuery(
    (signal) =>
      mission.deviceId
        ? dronesApi.getDrone(mission.deviceId, signal)
        : Promise.resolve(null),
    [mission.deviceId],
  )
  const deviceProfile: DeviceResponse | null = deviceProfileQuery.data ?? null
  const droneModel =
    mission.droneModel ?? deviceProfile?.deviceModel?.modelName ?? null
  const dronePayload = mission.dronePayload ?? null
  const deviceStatus = mission.deviceStatus ?? deviceProfile?.status ?? null
  const specRows = modelSpecRows(deviceProfile?.deviceModel?.specsMetadata)
  const deviceInfoRows: DeviceInfoRow[] = [
    { icon: '#', label: 'ID thiết bị', value: mission.deviceId },
    { icon: 'ID', label: 'Mã thiết bị', value: mission.deviceCode },
    {
      icon: 'SN',
      label: 'Số serial',
      value: mission.deviceSerialNumber ?? deviceProfile?.serialNumber,
    },
    {
      icon: '●',
      label: 'Trạng thái',
      value: deviceStatus
        ? DEVICE_STATUS_LABEL[deviceStatus] ?? deviceStatus
        : null,
    },
    {
      icon: '↗',
      label: 'Trạng thái phân công',
      value: mission.deviceAssignmentStatus
        ? DEVICE_ASSIGNMENT_LABEL[mission.deviceAssignmentStatus] ??
          mission.deviceAssignmentStatus
        : null,
    },
    {
      icon: 'DR',
      label: 'Mã drone',
      value:
        mission.droneCode && mission.droneCode !== mission.deviceCode
          ? mission.droneCode
          : null,
    },
    {
      icon: 'NM',
      label: 'Tên drone',
      value: mission.droneName ?? deviceProfile?.name,
    },
    { icon: 'MD', label: 'Mẫu drone', value: droneModel },
    {
      icon: 'MC',
      label: 'Mã model',
      value: mission.deviceModelCode ?? deviceProfile?.deviceModel?.code,
    },
    {
      icon: 'MF',
      label: 'Hãng',
      value:
        mission.deviceManufacturer ?? deviceProfile?.deviceModel?.manufacturer,
    },
    { icon: 'PL', label: 'Camera / payload', value: dronePayload },
    { icon: 'ST', label: 'Trạm', value: mission.droneStation },
    {
      icon: '↔',
      label: 'Khoảng cách trạm',
      value:
        mission.droneStationDistanceKm == null
          ? null
          : `${mission.droneStationDistanceKm} km`,
    },
    {
      icon: '%',
      label: 'Sẵn sàng',
      value:
        mission.droneReadinessPct == null
          ? null
          : `${mission.droneReadinessPct}%`,
    },
    {
      icon: '⏱',
      label: 'Giờ bay từ bảo trì',
      value:
        mission.droneHoursSinceMaintenance == null
          ? null
          : `${mission.droneHoursSinceMaintenance} giờ`,
    },
  ].filter((row) => row.value != null && String(row.value).trim() !== '')
  const compactLabels = new Set([
    'Mã thiết bị',
    'Số serial',
    'Trạng thái',
    'Trạng thái phân công',
  ])
  const primaryRows = overview
    ? deviceInfoRows.filter((row) => row.label === 'Trạng thái phân công')
    : compact
      ? deviceInfoRows.filter((row) => compactLabels.has(row.label))
      : deviceInfoRows
  const extraRows = overview
    ? deviceInfoRows.filter(
        (row) => row.label !== 'Sẵn sàng' && row.label !== 'Trạng thái phân công',
      )
    : compact
      ? deviceInfoRows.filter((row) => !compactLabels.has(row.label))
      : []
  const deviceProfileError = Boolean(
    mission.deviceId && deviceProfileQuery.error,
  )
  const hasDeviceDetails = extraRows.length > 0 || specRows.length > 0

  return (
    <section
      className={`odm-card${overview ? ' mds-overview-device' : ''}`}
      aria-labelledby="mission-device-heading"
    >
      <div className="odm-card-header">
        <h2 id="mission-device-heading" className="mds-card-heading">
          {overview ? 'Thiết bị' : 'Thông tin thiết bị'}
        </h2>
      </div>
      <div
        className={
          compact ? 'odm-card-body mds-device-compact' : 'odm-card-body'
        }
        style={{ padding: '10px 14px' }}
      >
        <div className="mds-device-identity">
          <div className="mds-device-image-frame">
            <img
              className="mds-device-image"
              src={deviceProfile?.imageUrl || FALLBACK_DRONE_IMAGE}
              alt={
                deviceProfile?.imageUrl
                  ? `${droneLabel}${droneModel ? ` — ${droneModel}` : ''}`
                  : 'Ảnh minh họa drone'
              }
              loading="lazy"
              decoding="async"
              onError={handleDroneImageError}
            />
            {!deviceProfile?.imageUrl && (
              <span className="mds-device-image-note">Ảnh minh họa</span>
            )}
          </div>
          <div className="mds-device-identity-copy">
            <div className="mds-device-name">{droneLabel}</div>
            {(droneModel || dronePayload) && (
              <div className="mds-device-subtitle">
                {[droneModel, dronePayload]
                  .filter(Boolean)
                  .join(' / ')}
              </div>
            )}
            {mission.droneReadinessPct != null && (
              <div className="mds-device-status">
                <StatusBadge
                  tone={mission.droneReadinessPct >= 80 ? 'green' : 'yellow'}
                >
                  {mission.droneReadinessPct}% Sẵn sàng
                </StatusBadge>
              </div>
            )}
          </div>
        </div>
        {mission.deviceId && deviceProfileQuery.loading && (
          <p className="mds-device-load-note" role="status">
            Đang tải ảnh và thông số drone…
          </p>
        )}
        {deviceProfileError && (
          <div className="mds-device-load-error">
            <span role="alert">Không tải được thông số theo mẫu drone.</span>
            <button
              type="button"
              disabled={deviceProfileQuery.loading}
              onClick={deviceProfileQuery.reload}
            >
              Thử lại
            </button>
          </div>
        )}
        {!overview &&
          (mission.droneStation ||
            mission.droneHoursSinceMaintenance != null) && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px solid var(--bd)',
                fontSize: 12.5,
                color: 'var(--tx3)',
              }}
            >
              {mission.droneStation && (
                <span>Lấy tại {mission.droneStation}</span>
              )}
              {mission.droneStation &&
                mission.droneStationDistanceKm != null && (
                  <span> · cách {mission.droneStationDistanceKm} km</span>
                )}
              {mission.droneHoursSinceMaintenance != null && (
                <span style={{ display: 'block', marginTop: 2 }}>
                  {mission.droneHoursSinceMaintenance} giờ bay từ lần bảo trì
                </span>
              )}
            </div>
          )}
        {primaryRows.length > 0 ? (
          <div
            className={compact ? 'mds-device-primary-rows' : undefined}
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--bd)',
            }}
          >
            {primaryRows.map((row) => (
              <InfoRow
                key={`${row.icon}-${row.label}`}
                icon={row.icon}
                label={row.label}
                value={String(row.value)}
              />
            ))}
          </div>
        ) : null}
        {hasDeviceDetails ? (
          <details className="mds-device-details" open={overview}>
            <summary>
              {overview ? 'Thông số kỹ thuật' : 'Thông số và mã định danh khác'}
            </summary>
            <div>
              {extraRows.map((row) => (
                <InfoRow
                  key={`${row.icon}-${row.label}`}
                  icon={row.icon}
                  label={row.label}
                  value={String(row.value)}
                />
              ))}
              {specRows.map((row) => (
                <InfoRow
                  key={row.key}
                  icon={null}
                  label={row.label}
                  value={row.value}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </section>
  )
}
