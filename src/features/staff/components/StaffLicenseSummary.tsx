import { useEffect, useState } from 'react'
import { useLanguage } from '../../../shared/i18n'
import {
  staffLicenseApi,
  type StaffLicense,
  type StaffLicenseVerification,
} from '../api/staffLicenseApi'
import './staffLicenses.css'

type Props = {
  userId: string
  assignedRole?: string
  canVerify?: boolean
  onChanged?: () => void
}

export function StaffLicenseSummary({
  userId,
  assignedRole,
  canVerify = false,
  onChanged,
}: Props) {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const [licenses, setLicenses] = useState<StaffLicense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    staffLicenseApi
      .list(userId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setLicenses(items)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(vi ? 'Không tải được giấy tờ.' : 'Could not load licenses.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [userId, vi, retry])

  async function openDocument(license: StaffLicense) {
    const tab = window.open('about:blank', '_blank')
    setBusyId(license.id)
    setError('')
    try {
      const document = await staffLicenseApi.document(license.id)
      if (tab) {
        tab.opener = null
        tab.location.href = document.url
      } else {
        setError(
          vi
            ? 'Trình duyệt đã chặn cửa sổ mới. Hãy cho phép cửa sổ bật lên rồi thử lại.'
            : 'The browser blocked the new tab. Allow pop-ups and try again.',
        )
      }
    } catch {
      tab?.close()
      setError(vi ? 'Không mở được tài liệu.' : 'Unable to open the document.')
    } finally {
      setBusyId('')
    }
  }

  async function verify(
    license: StaffLicense,
    status: Exclude<StaffLicenseVerification, 'PENDING'>,
  ) {
    setBusyId(license.id)
    setError('')
    try {
      const updated = await staffLicenseApi.verify(license.id, status)
      setLicenses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      onChanged?.()
    } catch {
      setError(
        vi
          ? 'Không cập nhật được trạng thái xác minh.'
          : 'Unable to update verification status.',
      )
    } finally {
      setBusyId('')
    }
  }

  const filtered = licenses.filter((license) => {
    if (assignedRole === 'PILOT') return license.licenseType === 'PILOT'
    if (assignedRole === 'MAINTAINER' || assignedRole === 'TECHNICIAN')
      return license.licenseType === 'TECHNICAL'
    return true
  })

  if (loading)
    return (
      <p className="staff-license-hint" role="status">
        {vi ? 'Đang tải giấy tờ…' : 'Loading licenses…'}
      </p>
    )
  if (error && licenses.length === 0)
    return (
      <div className="staff-license-error" role="alert">
        <span>{error}</span>
        <button
          type="button"
          className="staff-license-link"
          onClick={() => setRetry((value) => value + 1)}
        >
          {vi ? 'Thử lại' : 'Retry'}
        </button>
      </div>
    )

  return (
    <div className="staff-license-summary">
      <div className="staff-license-summary__heading">
        <strong>
          {vi ? 'Bằng lái & chứng chỉ' : 'Licenses & certificates'}
        </strong>
        <span className="staff-license-summary__count">{filtered.length}</span>
      </div>
      {filtered.length === 0 ? (
        <p className="staff-license-hint">
          {vi
            ? 'Chưa có giấy tờ phù hợp với vai trò này.'
            : 'No license matches this assignment role.'}
        </p>
      ) : (
        <ul className="staff-license-summary__list">
          {filtered.map((license) => {
            const status = license.licenseStatus
            const statusText = vi
              ? {
                  ACTIVE: 'Đang hoạt động',
                  EXPIRED: 'Hết hạn',
                  SUSPENDED: 'Tạm ngưng',
                  REVOKED: 'Đã thu hồi',
                }[status]
              : status.toLowerCase().replace('_', ' ')
            const verificationText = vi
              ? {
                  PENDING: 'Chờ xác minh',
                  VERIFIED: 'Đã xác minh',
                  REJECTED: 'Bị từ chối',
                }[license.verificationStatus]
              : license.verificationStatus.toLowerCase()
            return (
              <li key={license.id}>
                <div className="staff-license-summary__details">
                  <strong>{license.licenseName}</strong>
                  <span>
                    {vi ? 'Mã: ' : 'Number: '}
                    {license.licenseNumber} · {statusText} · {verificationText}
                  </span>
                </div>
                <div className="staff-license-summary__actions">
                  {license.documentFileName ? (
                    <button
                      type="button"
                      className="staff-license-link"
                      disabled={busyId === license.id}
                      onClick={() => void openDocument(license)}
                    >
                      {busyId === license.id
                        ? vi
                          ? 'Đang mở…'
                          : 'Opening…'
                        : vi
                          ? 'Xem chứng chỉ'
                          : 'View certificate'}
                    </button>
                  ) : (
                    <span className="staff-license-hint">
                      {vi ? 'Chưa có tài liệu đính kèm' : 'No document attached'}
                    </span>
                  )}
                  {canVerify &&
                  !license.demoRecord &&
                  license.documentFileName &&
                  license.verificationStatus === 'PENDING' ? (
                    <>
                      <button
                        type="button"
                        className="staff-license-link"
                        disabled={busyId === license.id}
                        onClick={() => void verify(license, 'VERIFIED')}
                      >
                        {vi ? 'Xác minh' : 'Verify'}
                      </button>
                      <button
                        type="button"
                        className="staff-license-link staff-license-link--danger"
                        disabled={busyId === license.id}
                        onClick={() => void verify(license, 'REJECTED')}
                      >
                        {vi ? 'Từ chối' : 'Reject'}
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {error ? (
        <p className="staff-license-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
