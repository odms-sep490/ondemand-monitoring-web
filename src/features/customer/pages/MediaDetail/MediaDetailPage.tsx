import { ErrorState, LoadingState } from '../../components/common/StateView'
import { Card, PageHeader } from '../../../../shared/components/ui'
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
    <div className="mdp-page">
      <PageHeader
        back={<a href={customerHref({ screen: 'mediaLibrary' })}>{t.backToLibrary}</a>}
        title={item.fileName}
        subtitle={detail.missionLabel}
      />
      <div className="mdp-grid">
        <div className="mdp-stack">
          <MediaViewer item={item} />
          <SiblingNav prev={detail.nav.prev} next={detail.nav.next} />
        </div>
        <Card title={t.fileInfo}>
          <div className="mdp-stack">
            <MediaInfoList item={item} missionLabel={detail.missionLabel} />
            <DownloadButton item={item} />
          </div>
        </Card>
      </div>
    </div>
  )
}
