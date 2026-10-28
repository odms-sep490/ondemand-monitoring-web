import {
  ErrorState,
  LoadingState,
} from '../../components/common/StateView'
import { EmptyState, PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { MediaPreviewModal } from '../../components/common/media'
import { customerHref } from '../../routes'
import { MissionMediaSection } from './components/MissionMediaSection'
import { useOrderMedia } from './hooks/useOrderMedia'
import './Media.css'
import { mediaPageMessages } from './MediaPage.messages'

/** Published media of an owned Order, including ongoing Missions. */
export function MediaPage({ orderId }: { orderId: string }) {
  const { t } = useI18n(mediaPageMessages)
  const media = useOrderMedia(orderId)

  if (media.loading && !media.loaded) return <LoadingState />
  if (!media.loaded || media.error) {
    return (
      <ErrorState
        title={t.errorTitle}
        error={undefined}
        onRetry={media.reload}
      />
    )
  }

  return (
    <div className="om-page">
      <PageHeader
        back={
          <a href={customerHref({ screen: 'orderDetail', orderId })}>
            {t.backToOrder}
          </a>
        }
        title={t.title}
        subtitle={t.subtitle}
      />
      {media.sections.length === 0 ? (
        <EmptyState
          title={t.emptyTitle}
          description={t.emptyDescription}
          action={
            <a
              className="odm-btn odm-btn-gh"
              href={customerHref({ screen: 'mediaLibrary' })}
            >
              {t.openLibrary}
            </a>
          }
        />
      ) : (
        media.sections.map(({ mission, items }) => (
          <MissionMediaSection
            key={mission.id}
            mission={mission}
            items={items}
            onOpen={(item) => media.openPreview(item.id)}
          />
        ))
      )}
      {media.preview && (
        <MediaPreviewModal
          item={media.preview}
          missionLabel={media.previewLabel}
          onClose={media.closePreview}
          onPrev={media.prevPreview}
          onNext={media.nextPreview}
        />
      )}
    </div>
  )
}
