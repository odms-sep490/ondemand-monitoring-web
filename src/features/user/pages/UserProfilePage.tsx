import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Button } from 'antd'
import { useState, type FormEvent } from 'react'
import { userProfileApi, canSetLocalPassword } from '../api/userProfileApi'
import {
  CardComponent,
  ErrorState,
  PageHeader,
} from '../../../shared/components/antd'
import { PageFrame } from '../../../shared/components/antd/PageFrame'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { authApi, authSession } from '../../auth/api/authApi'
import { PasswordField } from '../../auth/components/PasswordField'
import { userProfileMessages } from './UserProfilePage.messages'
import './UserProfilePage.scss'

export function UserProfilePage() {
  const { t } = useI18n(userProfileMessages)
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
      setError(t.passwordMismatch)
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
      setError(cause instanceof Error ? cause.message : t.passwordFailed)
    } finally {
      setBusy(false)
    }
  }

  if (profile.loading && !profile.data)
    return (
      <PageFrame maxWidth={920}>
        <p role="status" className="up-status">
          {t.loading}
        </p>
      </PageFrame>
    )
  if (profile.error)
    return (
      <PageFrame maxWidth={920}>
        <ErrorState
          title={t.loadFailed}
          error={profile.error}
          onRetry={profile.reload}
        />
      </PageFrame>
    )

  const initials =
    profile.data?.fullName
      ?.trim()
      .split(/\s+/)
      .map((word) => word[0])
      .filter(Boolean)
      .slice(-2)
      .join('')
      .toUpperCase() || 'U'

  return (
    <PageFrame maxWidth={920}>
      <PageHeader crumb={t.eyebrow} title={t.title} description={t.subtitle} />
      <div className="up-grid">
        <CardComponent
          title={t.personalInfo}
          icon={<UserOutlined />}
          aria-label={t.personalInfo}
        >
          <div className="up-identity">
            <Avatar size={56} className="up-avatar" aria-hidden="true">
              {initials}
            </Avatar>
            <div>
              <h2 className="up-name">{profile.data?.fullName}</h2>
              <p className="up-email">{profile.data?.email}</p>
            </div>
          </div>
          {profile.data?.role === 'CUSTOMER' && (
            <dl className="up-details">
              <div>
                <dt>{t.phone}</dt>
                <dd>
                  {profile.data.customerProfile?.phoneNumber || t.notProvided}
                </dd>
              </div>
              <div>
                <dt>{t.company}</dt>
                <dd>
                  {profile.data.customerProfile?.companyName || t.notProvided}
                </dd>
              </div>
              <div className="up-detail-wide">
                <dt>{t.address}</dt>
                <dd>
                  {profile.data.customerProfile?.address || t.notProvided}
                </dd>
              </div>
            </dl>
          )}
        </CardComponent>

        {linked && (
          <p className="up-success" role="status">
            {t.passwordSet}
          </p>
        )}
        {!linked && canSetLocalPassword(profile.data) && (
          <CardComponent
            title={t.security}
            icon={<SafetyCertificateOutlined />}
            tone="green"
          >
            <form onSubmit={submit} className="up-form">
              <p className="up-help">{t.securityHint}</p>
              <h3 className="up-form-title">{t.createPassword}</h3>
              <p className="up-help">{t.googleNote}</p>
              <div className="up-passwords">
                <PasswordField
                  id="local-password"
                  label={t.newPassword}
                  value={password}
                  onChange={setPassword}
                />
                <PasswordField
                  id="local-confirmation"
                  label={t.confirmPassword}
                  value={confirmation}
                  onChange={setConfirmation}
                />
              </div>
              {error && (
                <p className="up-error" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="primary"
                htmlType="submit"
                loading={busy}
                disabled={busy}
              >
                {busy ? t.saving : t.setPassword}
              </Button>
            </form>
          </CardComponent>
        )}
      </div>
    </PageFrame>
  )
}
