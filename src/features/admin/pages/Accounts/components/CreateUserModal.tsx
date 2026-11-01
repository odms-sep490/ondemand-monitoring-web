import { Alert, Button, Form, Input, Radio } from 'antd'
import { useState, type FormEvent } from 'react'

import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  BE_USER_ROLES,
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../../api/adminUsersApi'
import { AdminModal } from '../../../components/common/AdminModal'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { createUserModalMessages } from './CreateUserModal.messages'

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
    <AdminModal
      width={520}
      title={t.title}
      subtitle={t.subtitle}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button
            type="primary"
            htmlType="submit"
            form="adm-create-user-form"
            disabled={submitting}
          >
            {submitting ? t.sending : t.submit}
          </Button>
        </>
      }
    >
      <Form
        id="adm-create-user-form"
        layout="vertical"
        onSubmitCapture={handleSubmit}
        noValidate
        requiredMark={false}
      >
        <Form.Item
          label={
            <>
              {t.fullName} <span className="adm-required">*</span>
            </>
          }
          htmlFor="adm-cu-name"
          validateStatus={errors.fullName ? 'error' : undefined}
          help={errors.fullName}
        >
          <Input
            id="adm-cu-name"
            placeholder={t.fullNamePlaceholder}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setErrors((p) => ({ ...p, fullName: undefined }))
            }}
            aria-invalid={!!errors.fullName}
          />
        </Form.Item>
        <Form.Item
          label={
            <>
              {t.email} <span className="adm-required">*</span>
            </>
          }
          htmlFor="adm-cu-email"
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email}
        >
          <Input
            id="adm-cu-email"
            type="email"
            placeholder={t.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((p) => ({ ...p, email: undefined }))
            }}
            aria-invalid={!!errors.email}
          />
        </Form.Item>
        <Form.Item label={t.role}>
          <Radio.Group
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="adm-choice-list"
          >
            {CREATABLE_ROLES.map((r) => (
              <Radio
                key={r}
                value={r}
                className={`adm-choice${role === r ? ' is-selected' : ''}`}
              >
                <span className="adm-choice-text">
                  <RoleBadge role={r} />
                  <small>{t.roleDescriptions[r]}</small>
                </span>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        {submitError && (
          <Alert
            type="error"
            showIcon
            message={submitError}
            className="adm-alert"
          />
        )}
      </Form>
    </AdminModal>
  )
}
