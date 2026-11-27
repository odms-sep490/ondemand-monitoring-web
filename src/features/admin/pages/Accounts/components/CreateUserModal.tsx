import { useState, type FormEvent } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  BE_USER_ROLES,
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../../api/adminUsersApi'
import { Modal } from '../../../../../shared/components/ui'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { createUserModalMessages } from './CreateUserModal.messages'
import './createUserModal.css'

// CUSTOMER accounts self-register; admins only create internal accounts.
const CREATABLE_ROLES = BE_USER_ROLES.filter(
  (r): r is 'MANAGER' | 'STAFF' => r === 'MANAGER' || r === 'STAFF',
)

type FormErrors = Partial<Record<'fullName' | 'email', string>>

export function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (result: ManagedAccountResponse) => void
}) {
  const { t } = useI18n(createUserModalMessages)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'MANAGER' | 'STAFF'>('MANAGER')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  function validate(): boolean {
    const next: FormErrors = {}
    if (!fullName.trim()) next.fullName = t.required
    if (!email.trim()) next.email = t.required
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t.invalidEmail
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await adminUsersApi.createAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
      })
      onCreated(result)
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        setErrors({ fullName: err.errors.fullName, email: err.errors.email })
      }
      setSubmitError(err instanceof Error ? err.message : t.genericError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="accounts-create-dialog">
      <Modal
        width={600}
        icon="users"
        title={t.title}
        subtitle={t.description}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              className="odm-btn odm-btn-gh"
              onClick={onClose}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              form="adm-create-user-form"
              className="odm-btn odm-btn-p"
              disabled={submitting}
            >
              {submitting ? t.sending : t.submit}
            </button>
          </>
        }
      >
        <form
          id="adm-create-user-form"
          className="accounts-create-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <section
            className="accounts-create-section"
            aria-labelledby="adm-cu-details"
          >
            <h3 id="adm-cu-details">{t.accountDetails}</h3>
            <div className="accounts-create-fields">
              <div className="adm-form-field">
                <label htmlFor="adm-cu-name" className="adm-label">
                  {t.fullName} <span className="adm-required">*</span>
                </label>
                <input
                  id="adm-cu-name"
                  className="odm-inp"
                  type="text"
                  autoComplete="name"
                  required
                  disabled={submitting}
                  placeholder={t.fullNamePlaceholder}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    setErrors((p) => ({ ...p, fullName: undefined }))
                  }}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && (
                  <div className="adm-field-error">{errors.fullName}</div>
                )}
              </div>
              <div className="adm-form-field">
                <label htmlFor="adm-cu-email" className="adm-label">
                  {t.email} <span className="adm-required">*</span>
                </label>
                <input
                  id="adm-cu-email"
                  className="odm-inp"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={submitting}
                  placeholder="name@company.vn"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <div className="adm-field-error">{errors.email}</div>
                )}
              </div>
            </div>
          </section>
          <section
            className="accounts-create-section"
            aria-labelledby="adm-cu-role"
          >
            <h3 id="adm-cu-role">{t.role}</h3>
            <div
              className="adm-choice-grid"
              role="group"
              aria-labelledby="adm-cu-role"
            >
              {CREATABLE_ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`adm-choice${role === r ? ' is-selected' : ''}`}
                  aria-pressed={role === r}
                  disabled={submitting}
                >
                  <span className="adm-choice-radio" aria-hidden="true" />
                  <span className="adm-choice-text">
                    <span>
                      <RoleBadge role={r} />
                    </span>
                    <small>{t.roleDescriptions[r]}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
          <p className="accounts-create-invitation">{t.subtitle}</p>
          {submitError && (
            <div role="alert" className="adm-alert is-danger">
              {submitError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
