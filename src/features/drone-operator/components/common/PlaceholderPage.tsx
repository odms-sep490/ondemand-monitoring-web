import { ToolOutlined } from '@ant-design/icons'

import { CardComponent, EmptyState } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { placeholderPageMessages } from './PlaceholderPage.messages'

export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useI18n(placeholderPageMessages)
  return (
    <CardComponent>
      <EmptyState
        icon={<ToolOutlined />}
        title={title}
        description={t.inDevelopment}
      />
    </CardComponent>
  )
}
