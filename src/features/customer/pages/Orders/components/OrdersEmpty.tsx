import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { EmptyState } from '../../../components/common/StateView'
import { useI18n } from '../../../../../shared/i18n'
import { customerHref } from '../../../routes'
import { ordersEmptyMessages } from './OrdersEmpty.messages'

type Props = { filtered: boolean; onClear: () => void }

export function OrdersEmpty({ filtered, onClear }: Props) {
  const { t } = useI18n(ordersEmptyMessages)
  return (
    <EmptyState
      title={filtered ? t.noMatchTitle : t.emptyTitle}
      description={filtered ? t.emptyFiltered : t.emptyAll}
      action={
        filtered ? (
          <Button onClick={onClear}>{t.clearFilters}</Button>
        ) : (
          <Button type="primary" icon={<PlusOutlined aria-hidden="true" />} href={customerHref({ screen: 'createOrder' })}>
            {t.createFirst}
          </Button>
        )
      }
    />
  )
}
