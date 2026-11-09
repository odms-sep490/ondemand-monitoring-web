import { Button } from 'antd'

import { EmptyState } from '../../../components/common/StateView'
import { useI18n } from '../../../../../shared/i18n'
import { libraryEmptyMessages } from './LibraryEmpty.messages'

type Props = { filtered: boolean; onClear: () => void }

export function LibraryEmpty({ filtered, onClear }: Props) {
  const { t } = useI18n(libraryEmptyMessages)
  return (
    <EmptyState
      title={t.title}
      description={filtered ? t.filtered : t.none}
      action={filtered ? <Button onClick={onClear}>{t.clear}</Button> : undefined}
    />
  )
}
