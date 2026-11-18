import { Alert, Button, Tag } from 'antd'
import { ArrowRightOutlined, CheckCircleFilled, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import './SupplementInspectionResult.css'
import { defineMessages, useI18n } from '../../../shared/i18n'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { operatorHref } from '../../drone-operator/routes'
import { inspectionCorrectionApi } from './inspectionCorrectionApi'
import { CorrectionEvidenceGallery } from './CorrectionEvidenceGallery'

const messages = defineMessages({
  vi: {
    title: 'Kết quả nhiệm vụ bổ sung', loading: 'Đang tải kết quả bổ sung…',
    failed: 'Không tải được kết quả bổ sung. Hãy thử lại trước khi xác nhận.',
    refresh: 'Làm mới', note: 'Ghi chú nghiệm thu', checklistCount: (count: number) => `${count} hạng mục`, fileCount: (count: number) => `${count} tệp`, retry: 'Thử lại', open: 'Mở nhiệm vụ bổ sung', completed: 'Hoàn tất nghiệm thu',
    selectedFile: 'Gửi khách hàng', passed: 'Đạt yêu cầu', failedAssessment: 'Không đạt yêu cầu', pending: 'Chưa đánh giá',
    evidence: 'Bằng chứng đã nghiệm thu', selected: (count: number) => `${count} tệp được chọn gửi khách hàng`,
    noEvidence: 'Chưa có bằng chứng để hiển thị.', empty: 'Không có checklist để hiển thị.',
    hint: 'Rà soát bằng chứng bổ sung trước khi xác nhận và bàn giao kết quả.',
  },
  en: {
    title: 'Supplemental mission results', loading: 'Loading supplemental results…',
    failed: 'Unable to load supplemental results. Retry before confirming.',
    refresh: 'Refresh', note: 'Inspection notes', checklistCount: (count: number) => `${count} checklist items`, fileCount: (count: number) => `${count} files`, retry: 'Retry', open: 'Open supplemental mission', completed: 'Inspection completed',
    selectedFile: 'Customer delivery', passed: 'Work accepted', failedAssessment: 'Work not accepted', pending: 'Not assessed',
    evidence: 'Inspected evidence', selected: (count: number) => `${count} files selected for customer delivery`,
    noEvidence: 'No evidence available.', empty: 'No checklist items available.',
    hint: 'Review the supplemental evidence before confirming and delivering the results.',
  },
})

export function SupplementInspectionResult({ missionId, correctionId, version, refreshToken = 0 }: {
  missionId: string; correctionId: string; version: number; refreshToken?: number
}) {
  const { t, locale } = useI18n(messages)
  const load = (signal: AbortSignal) => inspectionCorrectionApi.supplementResult(missionId, correctionId, signal)
  const query = useApiQuery(load, [missionId, correctionId, version, refreshToken])
  const data = query.data
  const totalFiles = data?.executions.reduce((count, row) => count + (row.evidence?.length ?? 0), 0) ?? 0
  return (
    <section className="supplement-review" aria-label={t.title}>
      <header className="supplement-review__header">
        <div className="supplement-review__heading">
          <div><h4>{t.title}</h4></div>
        </div>
        {Boolean(query.error) && <Button icon={<ReloadOutlined />} onClick={query.reload} loading={query.loading}>{t.retry}</Button>}
      </header>
      {query.loading && !data && <p className="supplement-review__state" role="status">{t.loading}</p>}
      {query.error ? <Alert type="error" showIcon message={t.failed} /> : data && (
        <>
          <div className="supplement-review__summary">
            <div className="supplement-review__mission">
              <strong>{data.missionCode}</strong>
              <span><CheckCircleFilled aria-hidden="true" />{t.completed}</span>
            </div>
            <div className="supplement-review__facts">
              {data.completedAt && <span><ClockCircleOutlined aria-hidden="true" />{new Date(data.completedAt).toLocaleString(locale, { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' })}</span>}
              <span>{t.checklistCount(data.executions.length)}</span><span>{t.fileCount(totalFiles)}</span>
            </div>
            <Button type="link" href={operatorHref({ screen: 'missionDetail', missionId: data.missionId })}>
              {t.open}<ArrowRightOutlined />
            </Button>
          </div>
          {!data.executions.length && <p className="supplement-review__state">{t.empty}</p>}
          <div className="supplement-review__items">
            {data.executions.map((row, index) => (
              <article className="supplement-review__item" key={row.id}>
                <div className="supplement-review__item-heading">
                  <span className="supplement-review__number">{index + 1}</span>
                  <h5>{row.content}</h5>
                  <Tag color={row.assessmentStatus === 'COMPLIANT' ? 'green' : 'orange'}>
                    {row.assessmentStatus === 'COMPLIANT' ? t.passed : row.assessmentStatus === 'NON_COMPLIANT' ? t.failedAssessment : t.pending}
                  </Tag>
                </div>
                <div className="supplement-review__item-body">
                  <div className="supplement-review__assessment">
                    {row.assessmentNote && <div><span>{t.note}</span><p>{row.assessmentNote}</p></div>}
                    <span className="supplement-review__selection"><CheckCircleFilled aria-hidden="true" />{t.selected((row.evidence ?? []).filter(link => link.selectedForCustomer).length)}</span>
                  </div>
                  {row.evidence?.length ? (
                    <CorrectionEvidenceGallery
                      missionId={data.missionId} executionId={row.id} links={row.evidence}
                      selected={row.evidence.filter(link => link.selectedForCustomer).map(link => link.mediaId)}
                      selectedLabel={t.selectedFile} disabled readOnly title={t.evidence}
                      loadChecklist={load} onChange={() => {}}
                    />
                  ) : <p className="supplement-review__state">{t.noEvidence}</p>}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
