import {
  AimOutlined,
  BorderOuterOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from '@ant-design/icons'
import { Tooltip } from 'antd'

export type DroneSceneToolbarProps = {
  lang: string
  hasSelection: boolean
  isFullscreen: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onFocusSelected: () => void
  onFitAll: () => void
  onReset: () => void
  onToggleFullscreen: () => void
}

const LABELS = {
  vi: {
    group: 'Điều khiển góc nhìn 3D',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    focus: 'Tập trung drone đang chọn',
    fitAll: 'Hiển thị toàn bộ đội drone',
    reset: 'Đặt lại góc nhìn mặc định',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
  },
  en: {
    group: '3D viewport controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    focus: 'Focus selected drone',
    fitAll: 'Fit all drones',
    reset: 'Reset camera',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
  },
} as const

export function DroneSceneToolbar({
  lang,
  hasSelection,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onFocusSelected,
  onFitAll,
  onReset,
  onToggleFullscreen,
}: DroneSceneToolbarProps) {
  const copy = lang === 'en' ? LABELS.en : LABELS.vi

  return (
    <div
      className="mgr-drone-scene-toolbar"
      role="toolbar"
      aria-label={copy.group}
    >
      <Tooltip title={copy.zoomIn} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={copy.zoomIn}
          onClick={onZoomIn}
        >
          <ZoomInOutlined aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip title={copy.zoomOut} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={copy.zoomOut}
          onClick={onZoomOut}
        >
          <ZoomOutOutlined aria-hidden="true" />
        </button>
      </Tooltip>

      <span className="mgr-drone-scene-tool-divider" aria-hidden="true" />

      <Tooltip title={copy.focus} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={copy.focus}
          disabled={!hasSelection}
          onClick={onFocusSelected}
        >
          <AimOutlined aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip title={copy.fitAll} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={copy.fitAll}
          onClick={onFitAll}
        >
          <BorderOuterOutlined aria-hidden="true" />
        </button>
      </Tooltip>

      <Tooltip title={copy.reset} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={copy.reset}
          onClick={onReset}
        >
          <RedoOutlined aria-hidden="true" />
        </button>
      </Tooltip>

      <span className="mgr-drone-scene-tool-divider" aria-hidden="true" />

      <Tooltip title={isFullscreen ? copy.exitFullscreen : copy.fullscreen} placement="top">
        <button
          type="button"
          className="mgr-drone-scene-tool-btn"
          aria-label={isFullscreen ? copy.exitFullscreen : copy.fullscreen}
          aria-pressed={isFullscreen}
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? (
            <FullscreenExitOutlined aria-hidden="true" />
          ) : (
            <FullscreenOutlined aria-hidden="true" />
          )}
        </button>
      </Tooltip>
    </div>
  )
}
