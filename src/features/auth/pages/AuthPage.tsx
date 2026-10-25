import { useState, type FormEvent } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import {
  AuthApiError,
  authApi,
  authSession,
  getGoogleAuthorizationUrl,
} from '../api/authApi'
import { AuthAside } from '../components/AuthAside'
import { AuthLogo } from '../components/AuthLogo'
import { AuthNotice } from '../components/AuthNotice'
import { FirstLoginForm } from '../components/FirstLoginForm'
import { ForgotForm } from '../components/ForgotForm'
import { LoginForm } from '../components/LoginForm'
import { ModeSwitch } from '../components/ModeSwitch'
import { RegisterForm } from '../components/RegisterForm'
import { ResetForm } from '../components/ResetForm'
import { ThemeToggle } from '../components/ThemeToggle'
import { VerifyForm } from '../components/VerifyForm'
import { redirectToRoleHome } from '../routing'
import type { AuthMode, Notice } from '../types/authMode'
import { authPageMessages } from './AuthPage.messages'
import '../auth.css'
import '../auth-reference.css'

export function AuthPage({
  initialMode = 'login',
}: {
  initialMode?: 'login' | 'register'
}) {
  const { t } = useI18n(authPageMessages)
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [challengeSession, setChallengeSession] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<Notice | undefined>()

  const handleApiError = (error: unknown) => {
    if (error instanceof AuthApiError) {
      setFieldErrors(error.errors ?? {})
      if (error.code === 'LOCAL_IDENTITY_LINK_REQUIRED') {
        sessionStorage.setItem(
          'fieldwise.pendingLocalLinkEmail',
          email.trim().toLowerCase(),
        )
        setMode('login')
        setNotice({ type: 'info', message: t.linkLocalRequired })
        return
      }
      if (error.code === 'USER_NOT_CONFIRMED') setMode('verify')
      if (error.code === 'ACCOUNT_DISABLED') {
        // Design state "Tài khoản khoá" (SYS-01). No backend "remaining
        // attempts" field exists, so we do not render the design's
        // "Còn 3 lần thử trước khi tạm khoá." line — see evd report.
        setNotice({
          type: 'error',
          message: t.accountLocked,
          detail: t.accountLockedDetail,
        })
        return
      }
      if (error.code === 'INVALID_CREDENTIALS') {
        // Design state "Sai thông tin" (SYS-01).
        setNotice({ type: 'error', message: t.invalidCredentials })
        return
      }
      setNotice({ type: 'error', message: error.message })
      return
    }
    setNotice({ type: 'error', message: t.genericError })
  }

  const submitRegister = async () => {
    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: t.passwordMismatch })
      return
    }
    const response = await authApi.register({
      email,
      password,
      fullName,
      role: 'CUSTOMER',
    })
    if (response?.otpRequired) {
      setMode('verify')
      setNotice({
        type: 'success',
        message: t.otpSent(email),
      })
      return
    }
    setMode('login')
    setNotice({
      type: 'success',
      message: t.registerSuccess,
    })
  }

  const submitVerify = async () => {
    await authApi.verifyOtp({ email, otpCode })
    setMode('login')
    setNotice({
      type: 'success',
      message: t.verifySuccess,
    })
  }

  const submitForgot = async () => {
    await authApi.forgotPassword({ email })
    setMode('reset')
    setNotice({
      type: 'success',
      message: t.forgotSuccess,
    })
  }

  const submitReset = async () => {
    await authApi.resetPassword({ email, otpCode, newPassword })
    setMode('login')
    setNotice({
      type: 'success',
      message: t.resetSuccess,
    })
  }

  const submitLogin = async () => {
    const response = await authApi.login({ email, password })
    if (response.status === 'PASSWORD_CHANGE_REQUIRED' && response.session) {
      setChallengeSession(response.session)
      setMode('first-login')
      setNotice({
        type: 'info',
        message: t.firstLoginRequired,
      })
      return
    }
    authSession.save(response, rememberMe)
    const suffix = response.user?.fullName ? `, ${response.user.fullName}` : ''
    setNotice({ type: 'success', message: t.loginSuccess(suffix) })
    redirectToRoleHome(response.user?.role)
  }

  const submitFirstLogin = async () => {
    const response = await authApi.completeFirstLogin({
      email,
      session: challengeSession,
      newPassword,
    })
    authSession.save(response, rememberMe)
    setNotice({
      type: 'success',
      message: t.firstLoginSuccess,
    })
    redirectToRoleHome(response.user?.role)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setNotice(undefined)
    setFieldErrors({})
    setIsSubmitting(true)
    const submitters: Partial<Record<AuthMode, () => Promise<void>>> = {
      register: submitRegister,
      verify: submitVerify,
      forgot: submitForgot,
      reset: submitReset,
      login: submitLogin,
      'first-login': submitFirstLogin,
    }
    try {
      await submitters[mode]?.()
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendOtp = async () => {
    setNotice(undefined)
    setIsSubmitting(true)
    try {
      await authApi.resendOtp({ email })
      setNotice({
        type: 'success',
        message: t.otpResent(email),
      })
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = () => {
    setNotice(undefined)
    setFieldErrors({})
    try {
      window.location.assign(getGoogleAuthorizationUrl())
    } catch (error) {
      handleApiError(error)
    }
  }

  const backToLogin = () => {
    setMode('login')
    setNotice(undefined)
    setFieldErrors({})
  }
  const title = t.titles[mode]
  const subtitle = t.subtitles[mode]

  return (
    <div className="odm odm-auth">
      <a className="skip-link" href="#auth-form">
        {t.skipLink}
      </a>
      <AuthAside />
      <main className="odm-auth-main">
        <div className="odm-auth-topbar">
          <ThemeToggle />
        </div>
        <div className="odm-auth-content">
          <div className="odm-auth-card">
            <AuthLogo />
            <div className="odm-auth-heading">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            {notice ? <AuthNotice notice={notice} /> : null}
            <form
              id="auth-form"
              className="odm-auth-form"
              key={mode}
              onSubmit={handleSubmit}
            >
              {mode === 'login' ? (
                <LoginForm
                  email={email}
                  onEmailChange={setEmail}
                  password={password}
                  onPasswordChange={setPassword}
                  rememberMe={rememberMe}
                  onRememberMeChange={setRememberMe}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onGoogleSignIn={handleGoogleSignIn}
                  onForgotPassword={() => {
                    setMode('forgot')
                    setNotice(undefined)
                  }}
                />
              ) : null}
              {mode === 'register' ? (
                <RegisterForm
                  fullName={fullName}
                  onFullNameChange={setFullName}
                  email={email}
                  onEmailChange={setEmail}
                  password={password}
                  onPasswordChange={setPassword}
                  confirmPassword={confirmPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                />
              ) : null}
              {mode === 'verify' ? (
                <VerifyForm
                  email={email}
                  onEmailChange={setEmail}
                  otpCode={otpCode}
                  onOtpCodeChange={setOtpCode}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onResendOtp={handleResendOtp}
                />
              ) : null}
              {mode === 'forgot' ? (
                <ForgotForm
                  email={email}
                  onEmailChange={setEmail}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onBackToLogin={backToLogin}
                />
              ) : null}
              {mode === 'reset' ? (
                <ResetForm
                  email={email}
                  onEmailChange={setEmail}
                  otpCode={otpCode}
                  onOtpCodeChange={setOtpCode}
                  newPassword={newPassword}
                  onNewPasswordChange={setNewPassword}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  onBackToLogin={backToLogin}
                />
              ) : null}
              {mode === 'first-login' ? (
                <FirstLoginForm
                  email={email}
                  onEmailChange={setEmail}
                  newPassword={newPassword}
                  onNewPasswordChange={setNewPassword}
                  fieldErrors={fieldErrors}
                  isSubmitting={isSubmitting}
                  challengeSession={challengeSession}
                />
              ) : null}
            </form>
            <ModeSwitch
              mode={mode}
              onChange={(nextMode) => {
                setMode(nextMode)
                setNotice(undefined)
                // Keep the URL in sync with the visible form so the back
                // button and a copy-pasted link both land on the right mode.
                window.location.hash =
                  nextMode === 'register' ? '#auth/register' : '#auth/login'
              }}
            />
            {mode === 'verify' ? (
              <button
                type="button"
                className="odm-auth-back odm-auth-bottom-back"
                onClick={backToLogin}
              >
                <Icon name="arrow-left" /> {t.useAnotherEmail}
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
