import { useState, type FormEvent, type ReactNode } from 'react'
import {
  CalendarOutlined,
  EditOutlined,
  ClockCircleOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  userProfileApi,
  canSetLocalPassword,
  type CurrentUserProfile,
  type UserProfileUpdateRequest,
} from '../api/userProfileApi'
import { useToast } from '../../../shared/components/ui'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../shared/i18n'
import { authApi, authSession } from '../../auth/api/authApi'
import { PasswordField } from '../../auth/components/PasswordField'
import { getRoleHomePath } from '../../auth/routing'
import { StaffLicensesSection } from '../../staff/components/StaffLicensesSection'
import './UserProfilePage.css'

function formatDate(value: string | undefined, vi: boolean): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(vi ? 'vi-VN' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function initials(name: string | undefined): string {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(-2)
      .join('')
      .toUpperCase() || 'U'
  )
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="up-card">
      <header className="up-card-head">
        <span className="up-card-icon" aria-hidden="true">
          {icon}
        </span>
        <h3>{title}</h3>
      </header>
      <dl className="up-fields">{children}</dl>
    </section>
  )
}

type EditSpec = {
  name: keyof UserProfileForm
  value: string
  error?: string
  onChange: (name: keyof UserProfileForm, value: string) => void
  maxLength?: number
  inputMode?: 'numeric' | 'tel'
}

function Field({
  label,
  value,
  empty,
  wide,
  edit,
}: {
  label: string
  value?: string
  empty: string
  wide?: boolean
  edit?: EditSpec
}) {
  const cls = wide ? 'up-field is-wide' : 'up-field'
  if (edit) {
    const id = `up-input-${edit.name}`
    return (
      <div className={cls}>
        <dt>
          <label htmlFor={id}>{label}</label>
        </dt>
        <dd>
          <input
            id={id}
            className={edit.error ? 'up-input has-error' : 'up-input'}
            value={edit.value}
            maxLength={edit.maxLength}
            inputMode={edit.inputMode}
            aria-invalid={edit.error ? true : undefined}
            onChange={(e) => edit.onChange(edit.name, e.target.value)}
          />
          {edit.error && (
            <span className="up-input-error" role="alert">
              {edit.error}
            </span>
          )}
        </dd>
      </div>
    )
  }
  return (
    <div className={cls}>
      <dt>{label}</dt>
      <dd className={value ? undefined : 'is-empty'}>{value || empty}</dd>
    </div>
  )
}

function ContactRow({
  icon,
  label,
  value,
  empty,
}: {
  icon: ReactNode
  label: string
  value?: string
  empty: string
}) {
  return (
    <li className="up-contact-row">
      <span className="up-contact-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <span className="up-contact-label">{label}</span>
        <span
          className={value ? 'up-contact-value' : 'up-contact-value is-empty'}
        >
          {value || empty}
        </span>
      </div>
    </li>
  )
}

type UserProfileForm = Required<UserProfileUpdateRequest>

function toForm(data: CurrentUserProfile): UserProfileForm {
  const c = data.customerProfile
  return {
    fullName: data.fullName ?? '',
    phoneNumber: c?.phoneNumber || data.phoneNumber || '',
    address: c?.address ?? '',
    companyName: c?.companyName ?? '',
    citizenIdentificationNumber: c?.citizenIdentificationNumber ?? '',
    companyTaxCode: c?.companyTaxCode ?? '',
  }
}

// Mirrors BE UserProfileUpdateRequest constraints.
function validateForm(
  form: UserProfileForm,
  isCustomer: boolean,
  vi: boolean,
): Partial<Record<keyof UserProfileForm, string>> {
  const errors: Partial<Record<keyof UserProfileForm, string>> = {}
  const name = form.fullName.trim()
  if (!name)
    errors.fullName = vi ? 'Vui lòng nhập họ tên.' : 'Full name is required.'
  else if (name.length > 100)
    errors.fullName = vi
      ? 'Họ tên tối đa 100 ký tự.'
      : 'Full name must be at most 100 characters.'
  if (!isCustomer) return errors
  const phone = form.phoneNumber.trim()
  if (phone && !/^[0-9+() .-]{8,20}$/.test(phone))
    errors.phoneNumber = vi
      ? 'Số điện thoại gồm 8-20 ký tự số, khoảng trắng hoặc + ( ) . -'
      : 'Phone must be 8-20 characters: digits, spaces or + ( ) . -'
  if (form.address.trim().length > 500)
    errors.address = vi
      ? 'Địa chỉ tối đa 500 ký tự.'
      : 'Address must be at most 500 characters.'
  if (form.companyName.trim().length > 200)
    errors.companyName = vi
      ? 'Tên công ty tối đa 200 ký tự.'
      : 'Company name must be at most 200 characters.'
  const cccd = form.citizenIdentificationNumber.trim()
  if (cccd && !/^[0-9]{12}$/.test(cccd))
    errors.citizenIdentificationNumber = vi
      ? 'Số CCCD gồm đúng 12 chữ số.'
      : 'Citizen ID must be exactly 12 digits.'
  const tax = form.companyTaxCode.trim()
  if (tax && !/^[0-9]{10}(-[0-9]{3})?$/.test(tax))
    errors.companyTaxCode = vi
      ? 'Mã số thuế gồm 10 chữ số, có thể kèm -XXX.'
      : 'Tax code must be 10 digits, optionally followed by -XXX.'
  return errors
}

function Avatar({ data }: { data: CurrentUserProfile }) {
  const [broken, setBroken] = useState(false)
  if (data.avatarUrl && !broken)
    return (
      <img
        className="up-avatar is-image"
        src={data.avatarUrl}
        alt={data.fullName}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    )
  return (
    <span className="up-avatar" aria-hidden="true">
      {initials(data.fullName)}
    </span>
  )
}

export function UserProfilePage() {
  const { lang } = useLanguage()
  const vi = lang === 'vi'
  const empty = vi ? 'Chưa cập nhật' : 'Not provided'
  const profile = useApiQuery((signal) => userProfileApi.getCurrent(signal), [])
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [linked, setLinked] = useState(false)
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<UserProfileForm | null>(null)
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof UserProfileForm, string>>
  >({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  function startEdit() {
    if (!profile.data) return
    setForm(toForm(profile.data))
    setFormErrors({})
    setSaveError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setFormErrors({})
    setSaveError('')
  }

  function changeField(name: keyof UserProfileForm, value: string) {
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev))
    setFormErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    const current = profile.data
    if (!current || !form || saving) return
    const customer = current.role === 'CUSTOMER'
    const errors = validateForm(form, customer, vi)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    const payload: UserProfileUpdateRequest = customer
      ? {
          fullName: form.fullName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          address: form.address.trim(),
          companyName: form.companyName.trim(),
          citizenIdentificationNumber: form.citizenIdentificationNumber.trim(),
          companyTaxCode: form.companyTaxCode.trim(),
        }
      : { fullName: form.fullName.trim() }
    setSaving(true)
    setSaveError('')
    try {
      await userProfileApi.update(payload)
      profile.reload()
      setEditing(false)
      toast.success(vi ? 'Đã cập nhật hồ sơ.' : 'Profile updated.')
    } catch (cause) {
      setSaveError(
        cause instanceof Error
          ? cause.message
          : vi
            ? 'Không lưu được hồ sơ.'
            : 'Unable to save profile.',
      )
    } finally {
      setSaving(false)
    }
  }

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
        cause instanceof Error
          ? cause.message
          : vi
            ? 'Không đặt được mật khẩu.'
            : 'Unable to set password.',
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

  const data = profile.data
  const isCustomer = data?.role === 'CUSTOMER'
  const phone = data?.customerProfile?.phoneNumber || data?.phoneNumber
  const edit = (
    name: keyof UserProfileForm,
    extra?: Partial<EditSpec>,
  ): EditSpec | undefined =>
    editing && form
      ? {
          name,
          value: form[name],
          error: formErrors[name],
          onChange: changeField,
          ...extra,
        }
      : undefined

  return (
    <main className="user-profile-page">
      <a className="user-profile-back" href={getRoleHomePath(data?.role)}>
        ← {vi ? 'Về trang chính' : 'Back to workspace'}
      </a>
      <header className="up-page-heading">
        <h1 className="up-title">{vi ? 'Hồ sơ cá nhân' : 'My profile'}</h1>
        <p>
          {vi
            ? 'Quản lý thông tin cá nhân và thông tin liên hệ của bạn.'
            : 'Manage your personal details and contact information.'}
        </p>
      </header>

      {data && (
        <>
          <section
            className="up-hero"
            aria-label={vi ? 'Tổng quan tài khoản' : 'Account overview'}
          >
            <div className="up-identity">
              <Avatar data={data} />
              <div className="up-identity-text">
                <h2>{data.fullName}</h2>
                <p>{data.email}</p>
              </div>
              <div className="up-badges">
                {data.emailVerified !== undefined && (
                  <span
                    className={`up-badge ${data.emailVerified ? 'is-ok' : 'is-warn'}`}
                  >
                    {data.emailVerified
                      ? vi
                        ? 'Email đã xác minh'
                        : 'Email verified'
                      : vi
                        ? 'Email chưa xác minh'
                        : 'Email not verified'}
                  </span>
                )}
              </div>
              {!editing && (
                <button
                  type="button"
                  className="up-edit-btn"
                  onClick={startEdit}
                >
                  <EditOutlined /> {vi ? 'Chỉnh sửa hồ sơ' : 'Edit profile'}
                </button>
              )}
            </div>
          </section>

          <div className="up-layout">
            <aside className="up-card up-summary">
              <h3 className="up-summary-title">{vi ? 'Liên hệ' : 'Contact'}</h3>
              <ul className="up-contact">
                <ContactRow
                  icon={<MailOutlined />}
                  label="Email"
                  value={data.email}
                  empty={empty}
                />
                {!isCustomer && (
                  <ContactRow
                    icon={<PhoneOutlined />}
                    label={vi ? 'Số điện thoại' : 'Phone number'}
                    value={phone}
                    empty={empty}
                  />
                )}
              </ul>
              <div className="up-summary-divider" />
              <ul className="up-contact">
                <ContactRow
                  icon={<CalendarOutlined />}
                  label={vi ? 'Ngày tham gia' : 'Member since'}
                  value={formatDate(data.createdAt, vi)}
                  empty={empty}
                />
                <ContactRow
                  icon={<ClockCircleOutlined />}
                  label={vi ? 'Đăng nhập gần nhất' : 'Last sign-in'}
                  value={formatDate(data.lastLoginAt, vi)}
                  empty={empty}
                />
              </ul>
            </aside>

            <div className="up-main">
              <form className="up-edit-form" onSubmit={saveProfile} noValidate>
                <SectionCard
                  icon={<UserOutlined />}
                  title={vi ? 'Thông tin cá nhân' : 'Personal information'}
                >
                  <Field
                    label={vi ? 'Họ và tên' : 'Full name'}
                    value={data.fullName}
                    empty={empty}
                    wide={!isCustomer || editing}
                    edit={edit('fullName', { maxLength: 100 })}
                  />
                  {isCustomer && (
                    <Field
                      label={vi ? 'Số điện thoại' : 'Phone number'}
                      value={phone}
                      empty={empty}
                      edit={edit('phoneNumber', {
                        maxLength: 20,
                        inputMode: 'tel',
                      })}
                    />
                  )}
                  {isCustomer && (
                    <Field
                      label={vi ? 'Số CCCD' : 'Citizen ID number'}
                      value={data.customerProfile?.citizenIdentificationNumber}
                      empty={empty}
                      edit={edit('citizenIdentificationNumber', {
                        maxLength: 12,
                        inputMode: 'numeric',
                      })}
                    />
                  )}
                  {isCustomer && (
                    <Field
                      label={vi ? 'Địa chỉ liên hệ' : 'Contact address'}
                      value={data.customerProfile?.address}
                      empty={empty}
                      wide
                      edit={edit('address', { maxLength: 500 })}
                    />
                  )}
                </SectionCard>

                {isCustomer && (
                  <SectionCard
                    icon={<ShopOutlined />}
                    title={vi ? 'Công ty / tổ chức' : 'Company / organization'}
                  >
                    <Field
                      label={vi ? 'Tên công ty' : 'Company name'}
                      value={data.customerProfile?.companyName}
                      empty={empty}
                      edit={edit('companyName', { maxLength: 200 })}
                    />
                    <Field
                      label={vi ? 'Mã số thuế' : 'Tax code'}
                      value={data.customerProfile?.companyTaxCode}
                      empty={empty}
                      edit={edit('companyTaxCode', { maxLength: 14 })}
                    />
                  </SectionCard>
                )}

                {editing && (
                  <div className="up-actionbar">
                    {saveError && (
                      <p className="user-profile-error" role="alert">
                        {saveError}
                      </p>
                    )}
                    <button
                      type="button"
                      className="up-btn-ghost"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      {vi ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="user-profile-button"
                      disabled={saving}
                    >
                      {saving
                        ? vi
                          ? 'Đang lưu…'
                          : 'Saving…'
                        : vi
                          ? 'Lưu thay đổi'
                          : 'Save changes'}
                    </button>
                  </div>
                )}
              </form>

              {data.role === 'STAFF' && data.id ? (
                <div className="up-card up-licenses">
                  <StaffLicensesSection userId={data.id} />
                </div>
              ) : null}

              {linked && (
                <p className="user-profile-success" role="status">
                  {vi
                    ? 'Đã đặt mật khẩu. Bạn có thể đăng nhập bằng email và mật khẩu.'
                    : 'Password set. You can now sign in with email and password.'}
                </p>
              )}

              {!linked && canSetLocalPassword(data) && (
                <section className="up-card">
                  <header className="up-card-head">
                    <span className="up-card-icon" aria-hidden="true">
                      <LockOutlined />
                    </span>
                    <h3>{vi ? 'Tạo mật khẩu' : 'Create a password'}</h3>
                  </header>
                  <form onSubmit={submit}>
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
            </div>
          </div>
        </>
      )}
    </main>
  )
}
