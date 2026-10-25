import { useRef, useState } from 'react'

import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { OrderDetailView } from '../../../lib/orders/types'
import { reviewNoticeMessages } from './ReviewNotice.messages'
import { LocationCorrectionForm } from './LocationCorrectionForm'

type SupplementalDocument = {
  id: string
  documentType: 'AUTHORIZATION_LETTER'
  documentName: string
  fileName: string
  contentType: string
  sizeBytes: number
  dataUrl: string
  notes: string
}

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024
const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

function readDocument(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Không thể đọc tài liệu.'))
    reader.readAsDataURL(file)
  })
}

/** Result of the staff review (BE `rejectReason`, `reviewByName`, `reviewAt`). */
export function ReviewNotice({
  order,
  onInformationSubmitted,
}: {
  order: OrderDetailView
  onInformationSubmitted?: () => void
}) {
  const { t, locale } = useI18n(reviewNoticeMessages)
  const [information, setInformation] = useState('')
  const [siteContactName, setSiteContactName] = useState(
    order.siteContactName ?? '',
  )
  const [siteContactPhone, setSiteContactPhone] = useState(
    order.siteContactPhone ?? '',
  )
  const [accessNotes, setAccessNotes] = useState(order.accessNotes ?? '')
  const [monitoringRelationship, setMonitoringRelationship] = useState(
    order.monitoringRelationship ?? '',
  )
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(
    Boolean(order.monitoringAuthorizationConfirmed),
  )
  const [documents, setDocuments] = useState<SupplementalDocument[]>([])
  const documentInput = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rejected = order.status === 'REJECTED'
  const needsInfo = order.status === 'NEEDS_INFO'
  const needsLocation = needsInfo && order.requestedUpdateScope === 'LOCATION'
  const requiresAuthorizationDocument = Boolean(
    needsInfo &&
    order.rejectReason &&
    /giấy tờ|ủy quyền|quyền sử dụng/i.test(order.rejectReason),
  )
  const reviewed =
    rejected || needsInfo || (order.status === 'APPROVED' && order.reviewAt)
  if (!reviewed) return null

  async function submitInformation() {
    if (requiresAuthorizationDocument && documents.length === 0) {
      setError('Vui lòng tải lên giấy tờ được yêu cầu.')
      return
    }
    const submissionInformation =
      information.trim() ||
      (documents.length > 0
        ? 'Đã bổ sung tài liệu xác minh quyền truy cập hiện trường.'
        : '')
    if (!submissionInformation) {
      setError('Vui lòng nhập thông tin cần bổ sung trước khi gửi.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await apiRequest(
        `/api/orders/${encodeURIComponent(order.id)}/additional-information`,
        {
          method: 'POST',
          body: {
            information: submissionInformation,
            siteContactName: siteContactName.trim(),
            siteContactPhone: siteContactPhone.trim(),
            accessNotes: accessNotes.trim(),
            monitoringRelationship: monitoringRelationship || null,
            monitoringAuthorizationConfirmed: authorizationConfirmed,
            monitoringAuthorizationDocuments: documents,
          },
        },
      )
      setSent(true)
      onInformationSubmitted?.()
    } catch (cause) {
      setError(
        cause instanceof ApiError || cause instanceof Error
          ? cause.message
          : t.sendFailed,
      )
      setBusy(false)
    }
  }

  async function addDocument(file?: File) {
    if (!file) return
    setError(null)
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      setError('Chỉ chấp nhận file PDF, JPG hoặc PNG.')
      return
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError('Mỗi tài liệu không được vượt quá 5 MB.')
      return
    }
    if (documents.length >= 10) {
      setError('Chỉ được tải tối đa 10 tài liệu.')
      return
    }
    try {
      const dataUrl = await readDocument(file)
      setDocuments((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          documentType: 'AUTHORIZATION_LETTER',
          documentName: file.name,
          fileName: file.name,
          contentType: file.type,
          sizeBytes: file.size,
          dataUrl,
          notes: '',
        },
      ])
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không thể đọc tài liệu.',
      )
    }
  }

  const meta = [
    order.reviewByName ? t.by(order.reviewByName) : null,
    order.reviewAt ? fmtDateTime(order.reviewAt, locale) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={`od-notice ${rejected ? 'is-danger' : needsInfo ? 'is-warning' : 'is-success'}`}
      role={rejected ? 'alert' : 'status'}
    >
      <strong>
        {rejected ? t.rejected : needsInfo ? t.needsInfo : t.approved}
      </strong>
      {meta && <span className="od-notice-meta">{meta}</span>}
      {(rejected || needsInfo) && (
        <p>
          {t.reason}: {order.rejectReason || t.noReason}
        </p>
      )}
      {needsLocation && !sent ? (
        <LocationCorrectionForm
          order={order}
          onSaved={() => {
            setSent(true)
            onInformationSubmitted?.()
          }}
        />
      ) : needsInfo && !sent ? (
        <div className="od-additional-info-form">
          <strong>{t.supplementTitle}</strong>
          <div className="od-additional-info-grid">
            <label>
              <span>{t.contactName}</span>
              <input
                value={siteContactName}
                onChange={(event) => setSiteContactName(event.target.value)}
              />
            </label>
            <label>
              <span>{t.contactPhone}</span>
              <input
                value={siteContactPhone}
                onChange={(event) => setSiteContactPhone(event.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>{t.accessNotes}</span>
              <input
                value={accessNotes}
                onChange={(event) => setAccessNotes(event.target.value)}
              />
            </label>
            <label className="is-wide">
              <span>{t.relationship}</span>
              <select
                value={monitoringRelationship}
                onChange={(event) =>
                  setMonitoringRelationship(
                    event.target.value as typeof monitoringRelationship,
                  )
                }
              >
                <option value="">—</option>
                <option value="OWNER">Chủ sở hữu / Chủ đầu tư</option>
                <option value="AUTHORIZED_PERSON">Người được ủy quyền</option>
                <option value="CONTRACTOR">Nhà thầu / Đơn vị thi công</option>
                <option value="MANAGER_OR_SUPERVISOR">
                  Đơn vị quản lý / Tư vấn giám sát
                </option>
                <option value="OTHER">Khác</option>
              </select>
            </label>
          </div>
          <label className="od-additional-info-confirm">
            <input
              type="checkbox"
              checked={authorizationConfirmed}
              onChange={(event) =>
                setAuthorizationConfirmed(event.target.checked)
              }
            />
            <span>{t.authorization}</span>
          </label>
          {requiresAuthorizationDocument ? (
            <section
              className="od-additional-documents"
              aria-labelledby="additional-documents-title"
            >
              <div>
                <strong id="additional-documents-title">
                  Tài liệu xác minh quyền truy cập
                </strong>
                <span>Bắt buộc · PDF, JPG hoặc PNG · tối đa 5 MB/file</span>
              </div>
              <input
                ref={documentInput}
                hidden
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={(event) => {
                  void addDocument(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                className="odm-btn"
                onClick={() => documentInput.current?.click()}
              >
                Tải tài liệu lên
              </button>
              {documents.length > 0 ? (
                <ul>
                  {documents.map((document) => (
                    <li key={document.id}>
                      <span>{document.fileName}</span>
                      <button
                        type="button"
                        aria-label={`Xóa ${document.fileName}`}
                        onClick={() =>
                          setDocuments((current) =>
                            current.filter((item) => item.id !== document.id),
                          )
                        }
                      >
                        Xóa
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <small>Chưa có tài liệu nào được chọn.</small>
              )}
            </section>
          ) : null}
          <textarea
            rows={3}
            aria-label={t.informationPlaceholder}
            value={information}
            placeholder={t.informationPlaceholder}
            onChange={(event) => setInformation(event.target.value)}
          />
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            disabled={busy}
            onClick={() => void submitInformation()}
          >
            {busy ? t.sending : t.sendInformation}
          </button>
          {error ? <span role="alert">{error}</span> : null}
        </div>
      ) : null}
      {needsInfo && sent ? <p>{t.sent}</p> : null}
    </div>
  )
}
