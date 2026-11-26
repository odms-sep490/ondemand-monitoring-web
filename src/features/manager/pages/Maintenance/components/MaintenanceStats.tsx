import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons'

import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'

type Props = {
  unassignedCount: number
  urgentCount: number
  resolvedCount: number
  openCount?: number
  inProgressCount?: number
  totalCount?: number
}

/** Asymmetric Bento KPI strip synchronized with the Manager Dashboard & Resource Lifecycle deck. */
export function MaintenanceStats({
  unassignedCount,
  urgentCount,
  resolvedCount,
  openCount = 0,
  inProgressCount = 0,
  totalCount,
}: Props) {
  const { t, lang } = useI18n(maintenancePageMessages)
  const total = totalCount ?? openCount + inProgressCount + resolvedCount
  const completionPct = total > 0 ? Math.round((resolvedCount / total) * 100) : 0
  const openPct = total > 0 ? Math.round((openCount / total) * 100) : 0
  const inProgPct = total > 0 ? Math.round((inProgressCount / total) * 100) : 0
  const vi = lang === 'vi'

  return (
    <div className="mgr-maint-bento">
      {/* Flagship Navy Telemetry Card */}
      <div className="mgr-maint-hero">
        <div className="mgr-maint-hero-top">
          <div>
            <div className="mgr-maint-hero-eyebrow">
              {vi ? 'Tiến độ xử lý bảo trì' : 'Maintenance completion'}
            </div>
            <div className="mgr-maint-hero-metric">
              <span className="mgr-maint-hero-pct">{completionPct}%</span>
              <span className="mgr-maint-hero-sub">
                {resolvedCount}/{total} {vi ? 'phiếu đã hoàn tất' : 'tickets completed'}
              </span>
            </div>
          </div>
          <span className="mgr-maint-hero-badge">
            <ToolOutlined />
            <span>
              {total} {vi ? 'Phiếu' : 'Tickets'}
            </span>
          </span>
        </div>

        <div className="mgr-maint-spectrum" aria-hidden="true">
          {openPct > 0 && (
            <div
              className="mgr-maint-spectrum-seg"
              style={{ width: `${openPct}%`, background: '#f59e0b' }}
            />
          )}
          {inProgPct > 0 && (
            <div
              className="mgr-maint-spectrum-seg"
              style={{ width: `${inProgPct}%`, background: '#3b82f6' }}
            />
          )}
          {completionPct > 0 && (
            <div
              className="mgr-maint-spectrum-seg"
              style={{ width: `${completionPct}%`, background: '#10b981' }}
            />
          )}
        </div>

        <div className="mgr-maint-hero-foot">
          <span className="mgr-maint-hero-dot-item">
            <span className="mgr-maint-dot" style={{ background: '#f59e0b' }} />
            {openCount} {vi ? 'đang mở' : 'open'}
          </span>
          <span className="mgr-maint-hero-dot-item">
            <span className="mgr-maint-dot" style={{ background: '#3b82f6' }} />
            {inProgressCount} {vi ? 'đang thực hiện' : 'in progress'}
          </span>
          <span className="mgr-maint-hero-dot-item">
            <span className="mgr-maint-dot" style={{ background: '#10b981' }} />
            {resolvedCount} {vi ? 'hoàn tất' : 'completed'}
          </span>
        </div>
      </div>

      {/* 3 Crisp Instrument Stat Tiles */}
      <div className="mgr-maint-tile">
        <div className="mgr-maint-tile-head">
          <span className="mgr-maint-tile-label">{t.page.unassignedStat}</span>
          <span className="mgr-maint-tile-icon is-amber">
            <WarningOutlined />
          </span>
        </div>
        <div className="mgr-maint-tile-val">{unassignedCount}</div>
        <div className="mgr-maint-tile-foot">
          <span className="mgr-maint-pill is-amber">
            {unassignedCount > 0
              ? vi
                ? 'Chờ staff gửi / kỹ thuật nhận'
                : 'Waiting for a technician'
              : vi
                ? 'Đã có kỹ thuật nhận hết'
                : 'All claimed'}
          </span>
        </div>
      </div>

      <div className="mgr-maint-tile">
        <div className="mgr-maint-tile-head">
          <span className="mgr-maint-tile-label">{t.page.urgentStat}</span>
          <span className="mgr-maint-tile-icon is-red">
            <ClockCircleOutlined />
          </span>
        </div>
        <div className="mgr-maint-tile-val">{urgentCount}</div>
        <div className="mgr-maint-tile-foot">
          <span className="mgr-maint-pill is-red">
            {vi ? 'Ưu tiên Cao / Nghiêm trọng' : 'High / Critical priority'}
          </span>
        </div>
      </div>

      <div className="mgr-maint-tile">
        <div className="mgr-maint-tile-head">
          <span className="mgr-maint-tile-label">{t.page.resolvedStat}</span>
          <span className="mgr-maint-tile-icon is-green">
            <CheckCircleOutlined />
          </span>
        </div>
        <div className="mgr-maint-tile-val">{resolvedCount}</div>
        <div className="mgr-maint-tile-foot">
          <span className="mgr-maint-pill is-green">
            {vi ? 'Đã xử lý & đóng hồ sơ' : 'Resolved & closed'}
          </span>
        </div>
      </div>
    </div>
  )
}
