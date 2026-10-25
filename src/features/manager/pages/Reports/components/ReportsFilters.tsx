export function ReportsFilters({
  t,
  handleExportCsv,
}: {
  t: {
    pageTitle: string
    pageSubtitle: string
    loadError: string
    emptyTitle: string
    emptyDescription: string
    filters: {
      period: string
      periodOptions: string[]
      service: string
      allServices: string
      drone: string
      allDrones: string
      pilot: string
      allPilots: string
      reset: string
      exportCsv: string
    }
    csvHeaders: string[]
    csvFilenamePrefix: string
    kpis: {
      successRate: string
      successRateSub: (delta: number) => string
      missionsFlown: string
      missionsFlownSub: (completed: number, failed: number) => string
      avgApprovalTime: string
      avgApprovalTimeValue: (hours: number) => string
      avgApprovalTimeSub: (deltaHours: number, weekLabel: string) => string
      avgFleetUtilization: string
    }
    charts: {
      successRateByWeek: string
      successRateFootnote: string
      serviceDistribution: string
      droneUtilization: string
      droneUtilizationFootnote: string
      avgApprovalTime: string
      avgApprovalTimeFootnote: string
      topFailureReasons: string
      topFailureReasonsFootnote: (failedMissions: number) => string
      donutUnit: string
    }
  }
  handleExportCsv: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
        marginBottom: 14,
        flexWrap: 'wrap',
      }}
    >
      <label style={{ display: 'block', width: 170 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx2)',
            marginBottom: 4,
          }}
        >
          {t.filters.period}
        </span>
        <select className="odm-inp">
          {t.filters.periodOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      </label>
      <label style={{ display: 'block', width: 250 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx2)',
            marginBottom: 4,
          }}
        >
          {t.filters.service}
        </span>
        {/* Service names below are the app's service catalog (same
              proper-noun catalog values shown elsewhere in the app) — kept
              as-is rather than machine-translated, same treatment as the
              drone/pilot names below. This filter row is decorative (no
              onChange handler yet — filtering isn't wired to the API in
              this phase). */}
        <select className="odm-inp">
          <option>{t.filters.allServices}</option>
          <option>Giám sát tiến độ công trình</option>
          <option>Kiểm tra nhiệt mái và tấm pin</option>
          <option>Tuần tra an ninh khu vực</option>
          <option>Giám sát cây trồng (NDVI)</option>
          <option>Giám sát giao thông và sự kiện</option>
          <option>Bản đồ 2D/3D (orthomosaic)</option>
        </select>
      </label>
      <label style={{ display: 'block', width: 180 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx2)',
            marginBottom: 4,
          }}
        >
          {t.filters.drone}
        </span>
        <select className="odm-inp">
          <option>{t.filters.allDrones}</option>
          <option>DRN-01 Đại Bàng</option>
          <option>DRN-02 Hải Âu</option>
          <option>DRN-03 Chim Én</option>
          <option>DRN-04 Sếu Đầu Đỏ</option>
          <option>DRN-05 Diều Hâu</option>
          <option>DRN-06 Cú Mèo</option>
          <option>DRN-07 Vạc</option>
          <option>DRN-08 Cò Trắng</option>
          <option>DRN-09 Sơn Ca</option>
        </select>
      </label>
      <label style={{ display: 'block', width: 190 }}>
        <span
          style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx2)',
            marginBottom: 4,
          }}
        >
          {t.filters.pilot}
        </span>
        <select className="odm-inp">
          <option>{t.filters.allPilots}</option>
          <option>Hoàng Đức Thắng</option>
          <option>Bùi Anh Tuấn</option>
          <option>Ngô Thị Lan Phương</option>
          <option>Đỗ Minh Quân</option>
          <option>Vũ Hải Đăng</option>
          <option>Lý Thanh Sơn</option>
        </select>
      </label>
      <span style={{ flex: 1 }} />
      <button type="button" className="odm-btn">
        {t.filters.reset}
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-p"
        onClick={handleExportCsv}
      >
        {t.filters.exportCsv}
      </button>
    </div>
  )
}
