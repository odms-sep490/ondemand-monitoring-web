import { FileImageOutlined } from '@ant-design/icons'

import { ErrorState, LoadingState } from '../../components/common/StateView'
import { Card, PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { MediaInfoList, MediaViewer } from '../../components/common/media'
import { customerHref } from '../../routes'
import { DownloadButton } from './components/DownloadButton'
import { SiblingNav } from './components/SiblingNav'
import { useMediaDetail } from './hooks/useMediaDetail'
import './MediaDetail.css'
import { mediaDetailPageMessages } from './MediaDetailPage.messages'

/** One result file, backed by `GET /api/media/{mediaId}/download`. */
export function MediaDetailPage({ mediaId }: { mediaId: string }) {
  const { t } = useI18n(mediaDetailPageMessages)
  const detail = useMediaDetail(mediaId)
  const { item } = detail

  if (detail.loading && !item) return <LoadingState />
  if (!item) {
    return <ErrorState title={t.errorTitle} error={detail.error} onRetry={detail.reload} />
  }

  return (
    <div className="cus-page mdp-page">
      <PageHeader
        back={<a className="cus-back" href={customerHref({ screen: 'mediaLibrary' })}>{t.backToLibrary}</a>}
        title={item.fileName}
        subtitle={detail.missionLabel}
      />
      <div className="cus-main-grid">
        <div className="cus-stack">
          <MediaViewer item={item} />
          <SiblingNav prev={detail.nav.prev} next={detail.nav.next} />
        </div>
        <Card title={t.fileInfo} icon={<FileImageOutlined />}>
          <div className="mdp-stack">
            <MediaInfoList item={item} missionLabel={detail.missionLabel} />
            <DownloadButton item={item} />
          </div>
        </Card>
      </div>
    </div>
  )
}
