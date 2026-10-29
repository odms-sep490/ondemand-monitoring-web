import { Avatar, Descriptions, Input, Tag } from 'antd'
import type { ReactNode } from 'react'

import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { UserManagementDetailResponse } from '../../../api/adminUsersApi'
import { AdminToggle } from '../../../components/common/AdminToggle'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { fmtDateTime } from '../../../lib/accountStatus'
import { editUserModalMessages } from './EditUserModal.messages'

export type ProfileDraft = {
  fullName: string
  phoneNumber: string
  address: string
  companyName: string
}

const COLUMNS = { xs: 1, sm: 2 }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="adm-section">
      <h3 className="adm-section-title">{title}</h3>
      {children}
    </section>
  )
}

/** Editable (self) input or plain read-only value. */
function TextValue({
  id,
  value,
  editable,
  onChange,
}: {
  id: string
  value: string
  editable: boolean
  onChange: (v: string) => void
}) {
  if (!editable) return <>{value || '—'}</>
  return <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
}

function textLabel(id: string, label: string, editable: boolean): ReactNode {
  return editable ? <label htmlFor={id}>{label}</label> : label
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
        <Avatar size={44} aria-hidden="true">
          {initials}
        </Avatar>
        <RoleBadge role={user.role} />
      </div>
      <Descriptions
        colon={false}
        size="small"
        column={COLUMNS}
        layout="vertical"
        items={[
          {
            key: 'name',
            label: textLabel('adm-eu-name', t.fullName, editable),
            children: (
              <TextValue
                id="adm-eu-name"
                value={draft.fullName}
                editable={editable}
                onChange={(fullName) => onChange({ fullName })}
              />
            ),
          },
          { key: 'email', label: t.email, children: user.email },
        ]}
      />
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
  const providers = user.linkedProviders ?? []
  return (
    <Section title={t.sectionStatus}>
      <Descriptions
        colon={false}
        size="small"
        column={COLUMNS}
        layout="vertical"
        items={[
          {
            key: 'active',
            label: t.active,
            children: (
              <div>
                <div>
                  <AdminToggle
                    active={active}
                    label={t.active}
                    onToggle={onToggle}
                    disabled={busy || !canToggle}
                  />
                </div>
                <div className="adm-readonly-note">{t.activeHint}</div>
              </div>
            ),
          },
          {
            key: 'verified',
            label: t.emailVerified,
            children: (
              <StatusTag tone={user.emailVerified ? 'success' : 'warning'}>
                {user.emailVerified ? t.verified : t.unverified}
              </StatusTag>
            ),
          },
          ...(providers.length > 0
            ? [
                {
                  key: 'providers',
                  label: t.providers,
                  children: (
                    <div className="adm-chip-row">
                      {providers.map((p) => (
                        <Tag key={p} bordered={false}>
                          {p}
                        </Tag>
                      ))}
                    </div>
                  ),
                },
              ]
            : []),
        ]}
      />
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
      <Descriptions
        colon={false}
        size="small"
        column={COLUMNS}
        layout="vertical"
        items={[
          {
            key: 'phone',
            label: textLabel('adm-eu-phone', t.phone, editable),
            children: (
              <TextValue
                id="adm-eu-phone"
                value={draft.phoneNumber}
                editable={editable}
                onChange={(phoneNumber) => onChange({ phoneNumber })}
              />
            ),
          },
          {
            key: 'company',
            label: textLabel('adm-eu-company', t.company, editable),
            children: (
              <TextValue
                id="adm-eu-company"
                value={draft.companyName}
                editable={editable}
                onChange={(companyName) => onChange({ companyName })}
              />
            ),
          },
          {
            key: 'address',
            span: 'filled',
            label: textLabel('adm-eu-address', t.address, editable),
            children: (
              <TextValue
                id="adm-eu-address"
                value={draft.address}
                editable={editable}
                onChange={(address) => onChange({ address })}
              />
            ),
          },
        ]}
      />
    </Section>
  )
}

export function TimesSection({ user }: { user: UserManagementDetailResponse }) {
  const { t, lang } = useI18n(editUserModalMessages)
  const fmt = (iso?: string) => (iso ? fmtDateTime(iso, lang) : '—')
  return (
    <Section title={t.sectionTimes}>
      <Descriptions
        colon={false}
        size="small"
        column={COLUMNS}
        layout="vertical"
        items={[
          { key: 'created', label: t.createdAt, children: fmt(user.createdAt) },
          { key: 'updated', label: t.updatedAt, children: fmt(user.updatedAt) },
          { key: 'login', label: t.lastLogin, children: fmt(user.lastLoginAt) },
        ]}
      />
    </Section>
  )
}
