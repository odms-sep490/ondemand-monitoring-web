import { Alert, Button, Modal, Skeleton } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { authSession } from '../../../../auth/api/authApi'
import { adminUsersApi } from '../../../api/adminUsersApi'
import { EditUserForm } from './EditUserForm'
import { editUserModalMessages } from './EditUserModal.messages'

/** Loads `GET /api/admin/users/{id}` and shows only the fields the BE returns. */
export function EditUserModal({
  userId,
  onClose,
  onChanged,
}: {
  userId: string
  onClose: () => void
  onChanged: () => void
}) {
  const { t } = useI18n(editUserModalMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.getUser(userId, signal),
    [userId],
  )

  if (data) {
    return (
      <EditUserForm
        user={data}
        isSelf={authSession.getUser()?.id === data.id}
        onClose={onClose}
        onChanged={onChanged}
      />
    )
  }

  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={640}
      title={t.title}
      onCancel={onClose}
      footer={<Button onClick={onClose}>{t.close}</Button>}
    >
      {loading && (
        <div aria-busy="true">
          <Skeleton active paragraph={{ rows: 5 }} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </div>
      )}
      {!loading && error !== undefined && (
        <Alert
          type="error"
          showIcon
          role="alert"
          message={t.loadError}
          action={
            <Button size="small" onClick={reload}>
              {t.retry}
            </Button>
          }
        />
      )}
    </Modal>
  )
}
