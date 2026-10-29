import { memo } from 'react'
import type { ControlStatus, IconName } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useI18n } from '../../../../../shared/i18n'
import { inFlightControlMessages } from './InFlightControl.messages'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

export const CameraStatusPanel = memo(function CameraStatusPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('CameraStatusPanel')
  const { t } = useI18n(inFlightControlMessages)
  const thermalEnabled = status?.thermalEnabled === true
  const cameraMode = status?.cameraMode === 'DOWN' ? 'DOWN' : 'FRONT'
  const cameraPitch = Number.isFinite(status?.cameraPitchDeg)
    ? Number(status?.cameraPitchDeg)
    : cameraMode === 'DOWN'
      ? -90
      : 0
  const cameraLabel = thermalEnabled
    ? t.cameraStatus.thermal
    : cameraPitch <= -89.5
      ? t.cameraStatus.downward
      : cameraPitch >= -0.5
        ? t.cameraStatus.fpv
        : t.cameraStatus.gimbal
  const viewLabel = thermalEnabled
    ? t.cameraStatus.heatMap
    : t.cameraStatus.pitch(Number(cameraPitch.toFixed(0)))

  return (
    <GlassPanel
      style={{
        position: 'absolute',
        left: 22,
        top: 22,
        width: 176,
        padding: 14,
      }}
    >
      {(
        [
          {
            id: 'camera',
            icon: 'camera',
            label: t.cameraStatus.camera,
            value: cameraLabel,
          },
          {
            id: 'view',
            icon: 'eye',
            label: t.cameraStatus.view,
            value: viewLabel,
          },
          {
            id: 'mode',
            icon: 'joystick',
            label: t.cameraStatus.mode,
            value: t.cameraStatus.manual,
          },
        ] as const
      ).map(({ id, icon, label, value }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: id === 'mode' ? 0 : 12,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--fc-tx)',
              fontSize: 12,
            }}
          >
            <Icon name={icon as IconName} size={15} />
            {label}
          </span>
          <strong style={{ color: 'var(--fc-green)', fontSize: 12 }}>
            {value}
          </strong>
        </div>
      ))}
    </GlassPanel>
  )
})
