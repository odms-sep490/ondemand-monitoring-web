import { useEffect, useRef, useState } from 'react'

import { Icon } from '../../../shared/components/Icon'
import { LanguageToggle } from '../../../shared/components/LanguageToggle'
import { useI18n } from '../../../shared/i18n'
import { AuthApiError, authApi, authSession } from '../api/authApi'
import { getRoleHomeUrl } from '../routing'
import type { UserRole } from '../types'
import { socialCallbackPageMessages } from './SocialCallbackPage.messages'

const CALLBACK_PATH = '/social/callback'
const processedSocialCodes = new Set<string>()

export function SocialCallbackPage() {
  const { t } = useI18n(socialCallbackPageMessages)
  const [error, setError] = useState<string>()
  const [isSlow, setIsSlow] = useState(false)
  const [userName, setUserName] = useState<string>()
  const [userRole, setUserRole] = useState<UserRole>()
  const started = useRef(false)

  const getProviderErrorMessage = (value: string | null) => {
    if (!value) return undefined
    if (value.includes('SourceUser is already linked to DestinationUser')) {
      return t.linkedAccountError
    }
    return value
  }

  useEffect(() => {
    if (started.current) return
    started.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const providerError = getProviderErrorMessage(
      params.get('error_description') ?? params.get('error'),
    )
    const redirectUri = `${window.location.origin}${CALLBACK_PATH}`
    const storageKey = code ? `fieldwise.google.code.${code}` : undefined
    const slowTimer = window.setTimeout(() => setIsSlow(true), 8000)

    if (!code) {
      setError(providerError ?? t.missingCodeError)
      window.clearTimeout(slowTimer)
      return
    }

    const codeState = storageKey ? sessionStorage.getItem(storageKey) : null
    const rememberMe =
      sessionStorage.getItem('fieldwise.google.rememberMe') === 'true'
    const alreadyAuthenticated = Boolean(authSession.getAccessToken())

    if (
      processedSocialCodes.has(code) ||
      codeState === 'processing' ||
      codeState === 'done'
    ) {
      window.clearTimeout(slowTimer)
      if (alreadyAuthenticated || codeState === 'done') {
        window.location.replace(getRoleHomeUrl(authSession.getUser()?.role))
      }
      return
    }
    processedSocialCodes.add(code)
    if (storageKey) sessionStorage.setItem(storageKey, 'processing')

    authApi
      .socialSync({
        code,
        redirectUri,
        intent: 'LOGIN_OR_REGISTER',
        provider: 'GOOGLE',
        rememberMe,
      })
      .then((response) => {
        sessionStorage.removeItem('fieldwise.google.rememberMe')
        if (storageKey) sessionStorage.setItem(storageKey, 'done')
        setUserName(response.user?.fullName)
        setUserRole(response.user?.role)
        const pendingEmail = sessionStorage.getItem(
          'fieldwise.pendingLocalLinkEmail',
        )
        sessionStorage.removeItem('fieldwise.pendingLocalLinkEmail')
        const shouldLink =
          pendingEmail &&
          response.user?.email.trim().toLowerCase() === pendingEmail
        window.setTimeout(
          () =>
            window.location.replace(
              shouldLink
                ? `${window.location.origin}/#profile`
                : getRoleHomeUrl(response.user?.role),
            ),
          700,
        )
      })
      .catch((requestError: unknown) => {
        processedSocialCodes.delete(code)
        if (storageKey) sessionStorage.removeItem(storageKey)
        setError(
          requestError instanceof AuthApiError
            ? requestError.message
            : t.signInFailedGeneric,
        )
      })
      .finally(() => window.clearTimeout(slowTimer))

    return () => window.clearTimeout(slowTimer)
  }, [])

  if (error) {
    return (
      <div className="auth-callback-page">
        <LanguageToggle className="auth-callback-lang-toggle" />
        <div className="auth-callback-card">
          <div className="auth-callback-icon auth-callback-icon--error">
            <Icon name="x" />
          </div>
          <p className="eyebrow">{t.secureWorkspaceAccess}</p>
          <h1>{t.signInFailedTitle}</h1>
          <p>{error}</p>
          <a className="button button--primary" href="#auth/login">
            <span>{t.backToSignIn}</span>
            <Icon name="arrow-left" />
          </a>
        </div>
      </div>
    )
  }

  if (userName) {
    return (
      <div className="auth-callback-page">
        <LanguageToggle className="auth-callback-lang-toggle" />
        <div className="auth-callback-card">
          <div className="auth-callback-icon auth-callback-icon--success">
            <Icon name="check" />
          </div>
          <p className="eyebrow">{t.accountConnected}</p>
          <h1>{t.welcome(userName)}</h1>
          <p>{t.accountReady}</p>
          <a className="button button--primary" href={getRoleHomeUrl(userRole)}>
            <span>{t.continueToApp}</span>
            <Icon name="arrow-right" />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-callback-page">
      <LanguageToggle className="auth-callback-lang-toggle" />
      <div
        className="auth-callback-card auth-callback-card--loading"
        role="status"
        aria-live="polite"
      >
        <div className="auth-callback-spinner" aria-hidden="true" />
        <p className="eyebrow">{t.googleAccount}</p>
        <h1>{t.finishingSignIn}</h1>
        <p>{isSlow ? t.takingLonger : t.verifying}</p>
      </div>
    </div>
  )
}
