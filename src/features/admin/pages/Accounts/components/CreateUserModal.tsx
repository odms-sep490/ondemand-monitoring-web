import { Alert, Button, Form, Input, Modal, Radio } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { ApiError } from '../../../../../shared/api/httpClient'
import { useI18n } from '../../../../../shared/i18n'
import {
  BE_USER_ROLES,
  adminUsersApi,
  type ManagedAccountResponse,
} from '../../../api/adminUsersApi'
import { onFormSubmit } from '../../../components/common/formSubmit'
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

  async function handleSubmit() {
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
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={520}
      title={t.title}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{t.cancel}</Button>
          <Button type="primary" htmlType="submit" form="adm-create-user-form" loading={submitting}>
            {submitting ? t.sending : t.submit}
          </Button>
        </>
      }
    >
      <p className="mgr-modal-sub">{t.subtitle}</p>
      <Form
        id="adm-create-user-form"
        layout="vertical"
        onSubmitCapture={onFormSubmit(handleSubmit)}
        noValidate
      >
        <Form.Item
          label={t.fullName}
          required
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
          />
        </Form.Item>
        <Form.Item
          label={t.email}
          required
          htmlFor="adm-cu-email"
          validateStatus={errors.email ? 'error' : undefined}
          help={errors.email}
        >
          <Input
            id="adm-cu-email"
            type="email"
            placeholder="name@company.vn"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((p) => ({ ...p, email: undefined }))
            }}
          />
        </Form.Item>
        <Form.Item label={t.role}>
          <Radio.Group
            className="adm-choice-list"
            value={role}
            onChange={(e) => setRole(e.target.value as 'MANAGER' | 'STAFF')}
          >
            {CREATABLE_ROLES.map((r) => (
              <Radio key={r} value={r} className="adm-choice">
                <span className="adm-choice-text">
                  <RoleBadge role={r} />
                  <small>{t.roleDescriptions[r]}</small>
                </span>
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        {submitError && <Alert type="error" showIcon role="alert" message={submitError} />}
      </Form>
    </Modal>
  )
}
