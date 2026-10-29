import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { downloadButtonMessages } from './DownloadButton.messages'

export function DownloadButton({ item }: { item: MediaItem }) {
  const { t } = useI18n(downloadButtonMessages)
  if (!item.url) {
    return (
      <p className="mdp-expired" role="status">
        {t.unavailable}
      </p>
    )
  }
  return (
    <Button
      type="primary"
      className="mdp-download"
      icon={<DownloadOutlined aria-hidden="true" aria-label={undefined} />}
      href={item.url}
      download={item.fileName}
      target="_blank"
      rel="noopener noreferrer"
    >
      {t.download}
    </Button>
  )
}
