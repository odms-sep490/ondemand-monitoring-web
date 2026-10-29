import { DeleteOutlined, EditOutlined, MoreOutlined, ProfileOutlined } from '@ant-design/icons'
import { Button, Dropdown, Space } from 'antd'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import { servicesTableMessages } from './ServicesTable.messages'
import type { AdminService } from '../../../types/catalog'

export function ServiceRowActions({
  service,
  edit,
  remove,
}: {
  service: AdminService
  edit: () => void
  remove: () => void
}) {
  const { t } = useI18n(servicesTableMessages)
  return (
    <Space size={6} className="service-row-actions">
      <Button
        size="small"
        icon={<ProfileOutlined aria-hidden="true" aria-label={undefined} />}
        href={adminHref({ screen: 'serviceChecklists', serviceId: service.id })}
      >
        {t.checklist}
      </Button>
      <Button
        size="small"
        type="text"
        icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
        aria-label={t.edit + ' ' + service.name}
        title={t.edit}
        onClick={edit}
      />
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        getPopupContainer={mgrPopupContainer}
        menu={{
          items: [
            {
              key: 'delete',
              danger: true,
              icon: <DeleteOutlined aria-hidden="true" aria-label={undefined} />,
              label: <span aria-label={t.remove + ' ' + service.name}>{t.remove}</span>,
              onClick: remove,
            },
          ],
        }}
      >
        <Button
          size="small"
          type="text"
          icon={<MoreOutlined aria-hidden="true" aria-label={undefined} />}
          aria-label={t.more + ' ' + service.name}
          title={t.more}
        />
      </Dropdown>
    </Space>
  )
}
