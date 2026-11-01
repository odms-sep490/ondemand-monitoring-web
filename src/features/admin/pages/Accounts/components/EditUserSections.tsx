import { Avatar, Tag } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { UserManagementDetailResponse } from '../../../api/adminUsersApi'
import { AdminToggle } from '../../../components/common/AdminToggle'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { StatusTag } from '../../../../../shared/components/antd'
import { fmtDateTime } from '../../../lib/accountStatus'
import { Field, Section, TextField } from './EditUserParts'
import { editUserModalMessages } from './EditUserModal.messages'

export type ProfileDraft = {
  fullName: string
  phoneNumber: string
  address: string
  companyName: string
}

export function AccountSection({
  user,
  draft,
  editable,
  onChange,
}: {
  user: UserManagementDetailResponse
  draft: ProfileDraft
  editable: boolean
  onChange: (patch: Partial<ProfileDraft>) => void
}) {
  const { t } = useI18n(editUserModalMessages)
  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return (
    <Section title={t.sectionAccount}>
      <div className="adm-identity">
        <Avatar size={44} className="adm-avatar-lg" aria-hidden="true">
          {initials}
        </Avatar>
        <RoleBadge role={user.role} />
      </div>
      <div className="adm-section-grid">
        <TextField
          id="adm-eu-name"
          label={t.fullName}
          value={draft.fullName}
          editable={editable}
          onChange={(fullName) => onChange({ fullName })}
        />
        <Field label={t.email}>{user.email}</Field>
      </div>
    </Section>
  )
}

export function StatusSection({
  user,
  active,
  busy,
  canToggle,
  onToggle,
}: {
  user: UserManagementDetailResponse
  active: boolean
  busy: boolean
  canToggle: boolean
  onToggle: () => void
}) {
  const { t } = useI18n(editUserModalMessages)
  return (
    <Section title={t.sectionStatus}>
      <div className="adm-section-grid">
        <Field label={t.active}>
          <AdminToggle
            active={active}
            label={t.active}
            onToggle={onToggle}
            disabled={busy || !canToggle}
          />
          <div className="adm-readonly-note">{t.activeHint}</div>
        </Field>
        <Field label={t.emailVerified}>
          <StatusTag tone={user.emailVerified ? 'success' : 'warning'}>
            {user.emailVerified ? t.verified : t.unverified}
          </StatusTag>
        </Field>
        {user.linkedProviders && user.linkedProviders.length > 0 && (
          <Field label={t.providers}>
            <div className="adm-chip-row">
              {user.linkedProviders.map((p) => (
                <Tag key={p} bordered={false} color="processing">
                  {p}
                </Tag>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Section>
  )
}

export function ContactSection({
  draft,
  editable,
  onChange,
}: {
  draft: ProfileDraft
  editable: boolean
  onChange: (patch: Partial<ProfileDraft>) => void
}) {
  const { t } = useI18n(editUserModalMessages)
  return (
    <Section title={t.sectionContact}>
      <div className="adm-section-grid">
        <TextField
          id="adm-eu-phone"
          label={t.phone}
          value={draft.phoneNumber}
          editable={editable}
          onChange={(phoneNumber) => onChange({ phoneNumber })}
        />
        <TextField
          id="adm-eu-company"
          label={t.company}
          value={draft.companyName}
          editable={editable}
          onChange={(companyName) => onChange({ companyName })}
        />
      </div>
      <div className="adm-modal-gap">
        <TextField
          id="adm-eu-address"
          label={t.address}
          value={draft.address}
          editable={editable}
          onChange={(address) => onChange({ address })}
        />
      </div>
    </Section>
  )
}

export function TimesSection({ user }: { user: UserManagementDetailResponse }) {
  const { t, lang } = useI18n(editUserModalMessages)
  const fmt = (iso?: string) => (iso ? fmtDateTime(iso, lang) : '—')
  return (
    <Section title={t.sectionTimes}>
      <div className="adm-section-grid">
        <Field label={t.createdAt}>{fmt(user.createdAt)}</Field>
        <Field label={t.updatedAt}>{fmt(user.updatedAt)}</Field>
        <Field label={t.lastLogin}>{fmt(user.lastLoginAt)}</Field>
      </div>
    </Section>
  )
}
