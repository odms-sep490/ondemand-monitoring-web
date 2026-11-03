import { useState, type FormEvent } from 'react'
import { userProfileApi, canSetLocalPassword } from '../api/userProfileApi'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../shared/i18n'
import { authApi, authSession } from '../../auth/api/authApi'
import { PasswordField } from '../../auth/components/PasswordField'
import { getRoleHomePath } from '../../auth/routing'
import { StaffLicensesSection } from '../../staff/components/StaffLicensesSection'
import './UserProfilePage.css'

export function UserProfilePage() {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const profile = useApiQuery((signal) => userProfileApi.getCurrent(signal), [])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linked, setLinked] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSetLocalPassword(profile.data) || busy || linked) return
    setError('')
    if (password !== confirmation) {
      setError(vi ? 'Mật khẩu không khớp.' : 'Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await authApi.linkLocal(password)
      authSession.markLocalLinked()
      setPassword('')
      setConfirmation('')
      setLinked(true)
      profile.reload()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to set password.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (profile.loading && !profile.data)
    return (
      <main className="user-profile-page">
        <p role="status">{vi ? 'Đang tải hồ sơ…' : 'Loading profile…'}</p>
      </main>
    )
  if (profile.error)
    return (
      <section className="user-profile-page">
        <p role="alert">
          {vi
            ? 'Không tải được hồ sơ. Vui lòng thử lại.'
            : 'Unable to load profile. Please retry.'}
        </p>
        <button className="user-profile-button" onClick={profile.reload}>
          {vi ? 'Thử lại' : 'Retry'}
        </button>
      </section>
    )
  return (
    <main className="user-profile-page">
      <a
        className="user-profile-back"
        href={getRoleHomePath(profile.data?.role)}
      >
        ← {vi ? 'Về trang chính' : 'Back to workspace'}
      </a>
      <header className="user-profile-heading">
        <p className="user-profile-eyebrow">
          {vi ? 'TÀI KHOẢN CỦA BẠN' : 'YOUR ACCOUNT'}
        </p>
        <h1>{vi ? 'Hồ sơ cá nhân' : 'My profile'}</h1>
        <p>
          {vi
            ? 'Thông tin liên hệ và bảo mật tài khoản của bạn.'
            : 'Your contact details and account security.'}
        </p>
      </header>
      <section
        className="user-profile-card"
        aria-label={vi ? 'Thông tin cá nhân' : 'Personal information'}
      >
        <div className="user-profile-identity">
          <span className="user-profile-avatar" aria-hidden="true">
            {profile.data?.fullName
              ?.trim()
              .split(/\s+/)
              .map((word) => word[0])
              .filter(Boolean)
              .slice(-2)
              .join('')
              .toUpperCase() || 'U'}
          </span>
          <div>
            <h2>{profile.data?.fullName}</h2>
            <p>{profile.data?.email}</p>
          </div>
        </div>
        {profile.data?.role === 'CUSTOMER' && (
          <dl className="user-profile-details">
            <div>
              <dt>{vi ? 'Số điện thoại' : 'Phone number'}</dt>
              <dd>
                {profile.data.customerProfile?.phoneNumber ||
                  (vi ? 'Chưa cập nhật' : 'Not provided')}
              </dd>
            </div>
            <div>
              <dt>{vi ? 'Công ty / tổ chức' : 'Company / organization'}</dt>
              <dd>
                {profile.data.customerProfile?.companyName ||
                  (vi ? 'Chưa cập nhật' : 'Not provided')}
              </dd>
            </div>
            <div className="user-profile-detail-wide">
              <dt>{vi ? 'Địa chỉ liên hệ' : 'Contact address'}</dt>
              <dd>
                {profile.data.customerProfile?.address ||
                  (vi ? 'Chưa cập nhật' : 'Not provided')}
              </dd>
            </div>
          </dl>
        )}
      </section>
      {profile.data?.role === 'STAFF' && profile.data.id ? (
        <StaffLicensesSection userId={profile.data.id} />
      ) : null}
      {linked && (
        <p className="user-profile-success" role="status">
          {vi
            ? 'Đã đặt mật khẩu. Bạn có thể đăng nhập bằng email và mật khẩu.'
            : 'Password set. You can now sign in with email and password.'}
        </p>
      )}
      {!linked && canSetLocalPassword(profile.data) && (
        <section className="user-profile-card user-profile-security">
          <div className="user-profile-security-heading">
            <span aria-hidden="true">◇</span>
            <div>
              <h2>{vi ? 'Bảo mật tài khoản' : 'Account security'}</h2>
              <p>
                {vi
                  ? 'Thêm cách đăng nhập bằng email và mật khẩu.'
                  : 'Add email and password sign-in.'}
              </p>
            </div>
          </div>
          <form onSubmit={submit}>
            <h3>{vi ? 'Tạo mật khẩu' : 'Create a password'}</h3>
            <p className="user-profile-help">
              {vi
                ? 'Bạn đang đăng nhập bằng Google. Tạo mật khẩu để có thêm lựa chọn đăng nhập bằng email; đăng nhập Google vẫn được giữ nguyên.'
                : 'You currently sign in with Google. Create a password to also sign in with email. Google sign-in will remain available.'}
            </p>
            <div className="user-profile-passwords">
              <PasswordField
                id="local-password"
                label={vi ? 'Mật khẩu mới' : 'New password'}
                value={password}
                onChange={setPassword}
              />
              <PasswordField
                id="local-confirmation"
                label={vi ? 'Xác nhận mật khẩu' : 'Confirm password'}
                value={confirmation}
                onChange={setConfirmation}
              />
            </div>
            {error && (
              <p className="user-profile-error" role="alert">
                {error}
              </p>
            )}
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
                  ? 'Đặt mật khẩu'
                  : 'Set password'}
            </button>
          </form>
        </section>
      )}
    </main>
  )
}
