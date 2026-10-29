import { Alert, Button, Modal } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'

import { useI18n } from '../../../../../shared/i18n'
import {
  adminUsersApi,
  type UserManagementDetailResponse,
} from '../../../api/adminUsersApi'
import { userProfileApi } from '../../../api/userProfileApi'
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
      open
      centered
      getContainer={mgrPopupContainer}
      width={640}
      title={user.fullName}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>{isSelf ? t.cancel : t.close}</Button>
          {isSelf && (
            <Button
              type="primary"
              onClick={save}
              loading={busy}
              disabled={!draft.fullName.trim()}
            >
              {busy ? t.saving : t.save}
            </Button>
          )}
        </>
      }
    >
      <p className="mgr-modal-sub">{user.email}</p>
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
      <p className="adm-readonly-note">
        {isSelf ? t.selfNote : t.readonlyNote}
      </p>
      {message && (
        <Alert
          type={message.ok ? 'success' : 'error'}
          showIcon
          role={message.ok ? 'status' : 'alert'}
          message={message.text}
        />
      )}
    </Modal>
  )
}
