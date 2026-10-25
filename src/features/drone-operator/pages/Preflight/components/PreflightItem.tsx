import { useI18n } from '../../../../../shared/i18n'
import type { Language } from '../../../../../shared/i18n/languageStore'
import type {
  PreflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'
import { preflightItemMessages } from './PreflightItem.messages'

export type PreflightItemDef = {
  key: PreflightItemKey
  label: string
  detail: string
  code: string
}

/** Bilingual preflight item groups. `key`/`code` stay stable across languages. */
export function preflightGroups(
  lang: Language,
): { title: string; items: PreflightItemDef[] }[] {
  const item = (key: string, label: string, detail: string): PreflightItemDef => ({ key, label, detail, code: key })
  const text = (vi: string, en: string) => (lang === 'en' ? en : vi)
  return [
    {
      title: text('1. Thiết bị bay', '1. Aircraft'),
      items: [
        item('battery_health', text('Pin máy bay', 'Aircraft battery'), text('Dung lượng và tình trạng pin theo dữ liệu thiết bị', 'Battery level and condition from device telemetry')),
        item('propeller_inspection', text('Cánh quạt', 'Propellers'), text('Nứt, cong, lỏng hoặc hư hỏng', 'Cracks, bending, looseness, or damage')),
        item('airframe_inspection', text('Thân máy bay', 'Airframe'), text('Khung, càng đáp và các bộ phận lắp ghép', 'Frame, landing gear, and attached components')),
        item('camera_health', text('Hệ thống camera', 'Camera system'), text('Kết nối, hoạt động và khả năng ghi hình', 'Connection, operation, and recording capability')),
        item('obstacle_sensor_health', text('Cảm biến phát hiện vật cản', 'Obstacle sensors'), text('Tình trạng cảm biến và khả năng phát hiện vật cản', 'Sensor condition and obstacle detection capability')),
      ],
    },
    {
      title: text('2. Kết nối và điều khiển', '2. Connection and control'),
      items: [
        item('aircraft_connection', text('Kết nối máy bay', 'Aircraft connection'), text('Kết nối đang hoạt động và telemetry còn mới', 'Connection is active and telemetry is current')),
        item('command_link', text('Tín hiệu điều khiển', 'Command link'), text('Chất lượng đường truyền lệnh điều khiển', 'Command-link signal quality')),
        item('flight_controller', text('Bộ điều khiển máy bay', 'Flight controller'), text('Tình trạng bộ điều khiển bay', 'Flight-controller condition')),
        item('aircraft_readiness', text('Trạng thái sẵn sàng bay', 'Aircraft readiness'), text('Khả năng sẵn sàng bay do thiết bị xác nhận', 'Readiness confirmed by the aircraft')),
        item('monitoring_connection', text('Kết nối giám sát', 'Monitoring connection'), text('Dữ liệu giám sát được cập nhật liên tục', 'Monitoring data updates continuously')),
        item('manual_override', text('Điều khiển dự phòng', 'Manual override'), text('Phương án điều khiển dự phòng đã sẵn sàng', 'Backup control is ready')),
      ],
    },
    {
      title: text('3. Môi trường bay', '3. Flight environment'),
      items: [
        item('flight_visibility', text('Tầm nhìn', 'Flight visibility'), text('Tầm nhìn thực tế tại khu vực bay', 'Observed visibility at the flight area')),
        item('takeoff_area', text('Khu vực cất cánh', 'Takeoff area'), text('Khu vực cất cánh thông thoáng và an toàn', 'Takeoff area is clear and safe')),
        item('landing_area', text('Khu vực hạ cánh', 'Landing area'), text('Khu vực hạ cánh thông thoáng và an toàn', 'Landing area is clear and safe')),
        item('airspace_permission', text('Khu vực được phép bay', 'Airspace permission'), text('Giấy phép hoặc xác nhận vùng trời hợp lệ', 'Valid flight permit or airspace confirmation')),
      ],
    },
  ]
}

export function PreflightItemRow({
  def,
  result,
  note,
  onSetResult,
  onSetNote,
}: {
  def: PreflightItemDef
  result: PreflightItemResult | null
  note: string
  onSetResult: (result: PreflightItemResult) => void
  onSetNote: (note: string) => void
}) {
  const { t } = useI18n(preflightItemMessages)
  const failed = result === 'fail'
  return (
    <div
      style={{
        background: failed ? 'var(--red-bg)' : 'var(--sf)',
        border: `1.5px solid ${failed ? 'var(--red-dot)' : 'var(--bd)'}`,
        borderRadius: 12,
        padding: '10px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            background:
              result === 'ok'
                ? 'var(--green-bg)'
                : failed
                  ? 'var(--red-solid)'
                  : 'var(--sf3)',
            color:
              result === 'ok'
                ? 'var(--green-fg)'
                : failed
                  ? 'var(--red-on)'
                  : 'var(--tx2)',
            fontWeight: 700,
          }}
        >
          {result === 'ok' ? '✓' : failed ? '✕' : '•'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{def.label}</div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {def.detail ? `${def.detail} · ` : ''}
            <span className="odm-mono">{def.code}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSetResult('ok')}
          className="odm-btn"
          style={{
            minWidth: 78,
            background: result === 'ok' ? 'var(--green-solid)' : undefined,
            color: result === 'ok' ? 'var(--green-on)' : undefined,
            borderColor: result === 'ok' ? 'var(--green-solid)' : undefined,
          }}
        >
          {t.pass}
        </button>
        <button
          type="button"
          onClick={() => onSetResult('fail')}
          className="odm-btn"
          style={{
            minWidth: 96,
            background: failed ? 'var(--red-solid)' : undefined,
            color: failed ? 'var(--red-on)' : undefined,
            borderColor: failed ? 'var(--red-solid)' : undefined,
          }}
        >
          {t.fail}
        </button>
      </div>
      {failed ? (
        <textarea
          className="odm-input"
          rows={2}
          style={{ marginTop: 8, resize: 'none' }}
          placeholder={t.notePlaceholder}
          value={note}
          onChange={(e) => onSetNote(e.target.value)}
        />
      ) : null}
    </div>
  )
}
