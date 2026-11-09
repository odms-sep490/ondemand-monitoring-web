import { DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'

import { requestOriginalMediaDownload, startOriginalMediaDownload } from '../../../../../shared/api/originalMediaDownload'
import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { downloadButtonMessages } from './DownloadButton.messages'

export function DownloadButton({ item }: { item: MediaItem }) {
  const { t } = useI18n(downloadButtonMessages)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  if (!item.canDownloadOriginal) {
    return (
      <p className="mdp-download-note" role="status">
        {t.unavailable}
      </p>
    )
  }
  return (
    <>
      <Button
        type="primary"
        className="mdp-download"
        icon={<DownloadOutlined aria-hidden="true" aria-label={undefined} />}
        loading={loading}
        onClick={() => {
          setLoading(true)
          setFailed(false)
          void requestOriginalMediaDownload(item.id)
            .then((download) => startOriginalMediaDownload(download.downloadUrl))
            .catch(() => setFailed(true))
            .finally(() => setLoading(false))
        }}
      >
        {t.download}
      </Button>
      {failed && <p className="mdp-expired" role="alert">{t.failed}</p>}
    </>
  )
}
