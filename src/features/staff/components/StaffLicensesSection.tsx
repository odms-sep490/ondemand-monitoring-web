import { useState, type FormEvent } from 'react'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../shared/i18n'
import {
  staffLicenseApi,
  type StaffLicense,
  type StaffLicenseInput,
  type StaffLicenseStatus,
  type StaffLicenseType,
} from '../api/staffLicenseApi'
import './staffLicenses.css'

const initialForm = (userId: string): StaffLicenseInput => ({
  userId,
  licenseType: 'PILOT',
  licenseNumber: '',
  licenseName: '',
  issuingAuthority: '',
  issuedDate: '',
  expiryDate: null,
  licenseStatus: 'ACTIVE',
  notes: null,
})

export function StaffLicensesSection({ userId }: { userId: string }) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const query = useApiQuery(
    (signal) => staffLicenseApi.list(userId, signal),
    [userId],
  )
  const [editing, setEditing] = useState<StaffLicense | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<StaffLicenseInput>(() => initialForm(userId))
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [openingId, setOpeningId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function beginCreate() {
    setEditing(null)
    setFormOpen(true)
    setFile(null)
    setError('')
    setForm(initialForm(userId))
  }

  function beginEdit(license: StaffLicense) {
    setEditing(license)
    setFormOpen(true)
    setFile(null)
    setError('')
    setForm({
      userId,
      licenseType: license.licenseType,
      licenseNumber: license.licenseNumber,
      licenseName: license.licenseName,
      issuingAuthority: license.issuingAuthority,
      issuedDate: license.issuedDate,
      expiryDate: license.expiryDate,
      licenseStatus:
        license.licenseStatus === 'REVOKED' ? 'ACTIVE' : license.licenseStatus,
      notes: license.notes,
    })
  }

  function update<K extends keyof StaffLicenseInput>(
    key: K,
    value: StaffLicenseInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (form.expiryDate && form.expiryDate < form.issuedDate) {
      setError(
        vi
          ? 'Ngày hết hạn không được trước ngày cấp.'
          : 'Expiry date cannot be before the issue date.',
      )
      return
    }
    setBusy(true)
    try {
      const saved = editing
        ? await staffLicenseApi.update(editing.id, form)
        : await staffLicenseApi.create(form)
      if (file && !editing) setEditing(saved)
      if (file) await staffLicenseApi.upload(saved.id, file)
      setNotice(vi ? 'Đã lưu thông tin giấy tờ.' : 'License information saved.')
      setEditing(null)
      setFormOpen(false)
      setFile(null)
      query.reload()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : vi
            ? 'Không lưu được giấy tờ.'
            : 'Unable to save the license.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function openDocument(license: StaffLicense) {
    const tab = window.open('about:blank', '_blank')
    setOpeningId(license.id)
    try {
      const document = await staffLicenseApi.document(license.id)
      if (tab) {
        tab.opener = null
        tab.location.href = document.url
      } else
        setError(
          vi
            ? 'Trình duyệt đã chặn cửa sổ mới.'
            : 'The browser blocked the new tab.',
        )
    } catch {
      tab?.close()
      setError(vi ? 'Không mở được tài liệu.' : 'Unable to open the document.')
    } finally {
      setOpeningId('')
    }
  }

  return (
    <section
      className="user-profile-card staff-licenses"
      aria-labelledby="staff-licenses-title"
    >
      <div className="staff-licenses__heading">
        <div>
          <h2 id="staff-licenses-title">
            {vi ? 'Bằng lái & Chứng chỉ UAV' : 'UAV licenses & certificates'}
            {query.data ? (
              <span className="staff-licenses__count"> ({query.data.length})</span>
            ) : null}
          </h2>
          <p>
            {vi
              ? 'Giấy tờ do bạn cung cấp; trạng thái xác minh được quản lý riêng.'
              : 'Documents you provide; verification is managed separately.'}
          </p>
        </div>
        <button
          type="button"
          className="user-profile-button"
          onClick={beginCreate}
        >
          {vi ? 'Thêm giấy tờ' : 'Add license'}
        </button>
      </div>

      {query.loading && !query.data ? (
        <p role="status">{vi ? 'Đang tải giấy tờ…' : 'Loading licenses…'}</p>
      ) : null}
      {query.error ? (
        <div className="staff-license-error" role="alert">
          <span>
            {vi ? 'Không tải được giấy tờ.' : 'Unable to load licenses.'}
          </span>
          <button
            type="button"
            className="staff-license-link"
            onClick={query.reload}
          >
            {vi ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      ) : null}
      {notice ? (
        <p className="staff-license-success" role="status">
          {notice}
        </p>
      ) : null}
      {error && !formOpen ? (
        <p className="staff-license-error" role="alert">
          {error}
        </p>
      ) : null}

      {query.data?.length ? (
        <div className="staff-license-cards">
          {query.data.map((license) => (
            <article className="staff-license-card" key={license.id}>
              <div className="staff-license-card__heading">
                <div>
                  <span className="staff-license-type">
                    {typeLabel(license.licenseType, vi)}
                  </span>
                  <h3>{license.licenseName}</h3>
                  <p>
                    {vi ? 'Mã:' : 'Number:'} {license.licenseNumber}
                  </p>
                </div>
                <div className="staff-license-card__badges">
                  <span
                    className={`staff-license-badge staff-license-badge--${license.licenseStatus.toLowerCase()}`}
                  >
                    {statusLabel(license.licenseStatus, vi)}
                  </span>
                  <span
                    className={`staff-license-badge staff-license-badge--${license.verificationStatus.toLowerCase()}`}
                  >
                    {verificationLabel(license.verificationStatus, vi)}
                  </span>
                </div>
              </div>
              <dl className="staff-license-facts">
                <div>
                  <dt>{vi ? 'Cơ quan cấp' : 'Issuer'}</dt>
                  <dd>{license.issuingAuthority}</dd>
                </div>
                <div>
                  <dt>{vi ? 'Ngày cấp' : 'Issued'}</dt>
                  <dd>{formatLicenseDate(license.issuedDate, vi)}</dd>
                </div>
                <div>
                  <dt>{vi ? 'Ngày hết hạn' : 'Expires'}</dt>
                  <dd>
                    {license.expiryDate
                      ? formatLicenseDate(license.expiryDate, vi)
                      : vi
                        ? 'Không có thời hạn'
                        : 'No expiry'}
                  </dd>
                </div>
                <div>
                  <dt>{vi ? 'Tệp đính kèm' : 'Attachment'}</dt>
                  <dd>
                    {license.documentFileName ||
                      (vi ? 'Chưa có tài liệu đính kèm' : 'No document attached')}
                  </dd>
                </div>
              </dl>
              {license.notes && !license.demoRecord ? (
                <p className="staff-license-note">{license.notes}</p>
              ) : null}
              <div className="staff-license-actions">
                {license.licenseStatus !== 'REVOKED' ? (
                  <button
                    type="button"
                    className="staff-license-link"
                    onClick={() => beginEdit(license)}
                  >
                    {vi ? 'Chỉnh sửa' : 'Edit'}
                  </button>
                ) : null}
                {license.documentFileName ? (
                  <button
                    type="button"
                    className="staff-license-link"
                    disabled={openingId === license.id}
                    onClick={() => void openDocument(license)}
                  >
                    {openingId === license.id
                      ? vi
                        ? 'Đang mở…'
                        : 'Opening…'
                      : vi
                        ? 'Xem chứng chỉ'
                        : 'View certificate'}
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : !query.loading && !query.error ? (
        <p className="staff-license-empty">
          {vi
            ? 'Chưa có bằng lái hoặc chứng chỉ nào.'
            : 'No licenses or certificates yet.'}
        </p>
      ) : null}

      {formOpen ? (
        <form
          className="staff-license-form"
          onSubmit={(event) => void save(event)}
        >
          <h3>
            {editing
              ? vi
                ? 'Cập nhật giấy tờ'
                : 'Update license'
              : vi
                ? 'Thêm giấy tờ mới'
                : 'Add a license'}
          </h3>
          <div className="staff-license-form__grid">
            <label>
              {vi ? 'Loại giấy tờ' : 'Document type'}
              <select
                value={form.licenseType}
                onChange={(event) =>
                  update('licenseType', event.target.value as StaffLicenseType)
                }
              >
                <option value="PILOT">
                  {vi ? 'Bằng lái UAV' : 'UAV pilot'}
                </option>
                <option value="TECHNICAL">
                  {vi ? 'Chứng chỉ kỹ thuật' : 'Technical'}
                </option>
                <option value="OTHER">{vi ? 'Khác' : 'Other'}</option>
              </select>
            </label>
            <label>
              {vi ? 'Số giấy tờ' : 'Document number'}
              <input
                required
                maxLength={100}
                value={form.licenseNumber}
                onChange={(event) =>
                  update('licenseNumber', event.target.value)
                }
              />
            </label>
            <label>
              {vi ? 'Tên bằng / chứng chỉ' : 'License name'}
              <input
                required
                maxLength={200}
                value={form.licenseName}
                onChange={(event) => update('licenseName', event.target.value)}
              />
            </label>
            <label>
              {vi ? 'Cơ quan cấp' : 'Issuing authority'}
              <input
                required
                maxLength={200}
                value={form.issuingAuthority}
                onChange={(event) =>
                  update('issuingAuthority', event.target.value)
                }
              />
            </label>
            <label>
              {vi ? 'Ngày cấp' : 'Issue date'}
              <input
                required
                type="date"
                value={form.issuedDate}
                onChange={(event) => update('issuedDate', event.target.value)}
              />
            </label>
            <label>
              {vi ? 'Ngày hết hạn (nếu có)' : 'Expiry date (optional)'}
              <input
                type="date"
                value={form.expiryDate || ''}
                onChange={(event) =>
                  update('expiryDate', event.target.value || null)
                }
              />
            </label>
            <label>
              {vi ? 'Trạng thái hiệu lực' : 'Validity status'}
              <select
                value={form.licenseStatus}
                onChange={(event) =>
                  update(
                    'licenseStatus',
                    event.target.value as Exclude<
                      StaffLicenseStatus,
                      'REVOKED'
                    >,
                  )
                }
              >
                <option value="ACTIVE">
                  {vi ? 'Đang hoạt động' : 'Active'}
                </option>
                <option value="EXPIRED">{vi ? 'Hết hạn' : 'Expired'}</option>
                <option value="SUSPENDED">
                  {vi ? 'Tạm ngưng' : 'Suspended'}
                </option>
              </select>
            </label>
            <label className="staff-license-form__wide">
              {vi ? 'Ghi chú' : 'Notes'}
              <textarea
                maxLength={2000}
                value={form.notes || ''}
                onChange={(event) =>
                  update('notes', event.target.value || null)
                }
              />
            </label>
            <label className="staff-license-form__wide">
              {vi
                ? 'Tệp giấy tờ (PDF, JPG, PNG · tối đa 10 MB)'
                : 'Document file (PDF, JPG, PNG · up to 10 MB)'}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {error ? (
            <p className="staff-license-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="staff-license-actions">
            <button
              className="user-profile-button"
              type="submit"
              disabled={busy}
            >
              {busy
                ? vi
                  ? 'Đang lưu…'
                  : 'Saving…'
                : vi
                  ? 'Lưu giấy tờ'
                  : 'Save license'}
            </button>
            <button
              type="button"
              className="staff-license-link"
              disabled={busy}
              onClick={() => setFormOpen(false)}
            >
              {vi ? 'Đóng biểu mẫu' : 'Close form'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

function typeLabel(type: StaffLicenseType, vi: boolean) {
  return {
    PILOT: vi ? 'ĐIỀU KHIỂN UAV' : 'UAV PILOT',
    TECHNICAL: vi ? 'KỸ THUẬT' : 'TECHNICAL',
    OTHER: vi ? 'KHÁC' : 'OTHER',
  }[type]
}

function statusLabel(status: StaffLicenseStatus, vi: boolean) {
  return {
    ACTIVE: vi ? 'Đang hoạt động' : 'Active',
    EXPIRED: vi ? 'Hết hạn' : 'Expired',
    SUSPENDED: vi ? 'Tạm ngưng' : 'Suspended',
    REVOKED: vi ? 'Đã thu hồi' : 'Revoked',
  }[status]
}

function verificationLabel(status: string, vi: boolean) {
  return (
    {
      PENDING: vi ? 'Chờ xác minh' : 'Pending',
      VERIFIED: vi ? 'Đã xác minh' : 'Verified',
      REJECTED: vi ? 'Bị từ chối' : 'Rejected',
    }[status] ?? status
  )
}

function formatLicenseDate(value: string, vi: boolean) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat(vi ? 'vi-VN' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}
