import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  adminUsersApi,
  type UserManagementDetailResponse,
} from '../../../api/adminUsersApi'
import { userProfileApi } from '../../../api/userProfileApi'
import { Modal } from '../../../../../shared/components/ui'
import {
  AccountSection,
  ContactSection,
  StatusSection,
  TimesSection,
  type ProfileDraft,
} from './EditUserSections'
import { editUserModalMessages } from './EditUserModal.messages'

export function EditUserForm({
  user,
  isSelf,
  onClose,
  onChanged,
}: {
  user: UserManagementDetailResponse
  isSelf: boolean
  onClose: () => void
  onChanged: () => void
}) {
  const { t } = useI18n(editUserModalMessages)
  const profile = user.customerProfile
  const [draft, setDraft] = useState<ProfileDraft>({
    fullName: user.fullName,
    phoneNumber: profile?.phoneNumber ?? '',
    address: profile?.address ?? '',
    companyName: profile?.companyName ?? '',
  })
  const [active, setActive] = useState(user.active)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      onChanged()
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof Error ? err.message : t.genericError,
      })
    } finally {
      setBusy(false)
    }
  }

  const toggle = () =>
    run(async () => {
      const res = await adminUsersApi.updateUserStatus(user.id, {
        active: !active,
      })
      setActive(res.active)
      setMessage({ ok: true, text: t.saved })
    })

  const save = () =>
    run(async () => {
      await userProfileApi.updateMe({
        fullName: draft.fullName.trim(),
        ...(profile
          ? {
              phoneNumber: draft.phoneNumber,
              address: draft.address,
              companyName: draft.companyName,
            }
          : {}),
      })
      setMessage({ ok: true, text: t.saved })
    })

  const patch = (p: Partial<ProfileDraft>) => setDraft((d) => ({ ...d, ...p }))

  return (
    <Modal
      width={640}
      icon="users"
      title={user.fullName}
      subtitle={user.email}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={onClose}
          >
            {isSelf ? t.cancel : t.close}
          </button>
          {isSelf && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={save}
              disabled={busy || !draft.fullName.trim()}
            >
              {busy ? t.saving : t.save}
            </button>
          )}
        </>
      }
    >
      <AccountSection
        user={user}
        draft={draft}
        editable={isSelf}
        onChange={patch}
      />
      <StatusSection
        user={user}
        active={active}
        busy={busy}
        canToggle={!isSelf}
        onToggle={toggle}
      />
      {profile && (
        <ContactSection draft={draft} editable={isSelf} onChange={patch} />
      )}
      <TimesSection user={user} />
      {isSelf && <p className="adm-readonly-note">{t.selfNote}</p>}
      {message && (
        <div
          role={message.ok ? 'status' : 'alert'}
          className={`adm-alert ${message.ok ? 'is-success' : 'is-danger'}`}
        >
          {message.text}
        </div>
      )}
    </Modal>
  )
}
