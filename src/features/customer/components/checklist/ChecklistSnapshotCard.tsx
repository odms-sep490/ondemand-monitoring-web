import type { ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { Card } from '../common/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistSnapshot } from '../../lib/checklist/types'
import './Checklist.css'
import { ChecklistGuidance } from '../../../../shared/components/ChecklistGuidance'
import { formatVnd } from '../../../../shared/lib/formatVnd'

export function ChecklistSnapshotCard({
  items = [],
  snapshotAt,
  title,
}: {
  items?: ChecklistSnapshot[]
  snapshotAt?: string | null
  /** Optional heading node (e.g. with an icon chip); defaults to the plain title. */
  title?: ReactNode
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <div role="region" aria-label={t.title}>
      <Card className="checklist-card" title={title ?? t.title}>
        <p className="checklist-lock">{t.locked}</p>
        <p className="checklist-hint">{t.history}</p>
        {items.length ? (
          <ol className="checklist-snapshot">
            {[...items]
              .sort(
                (a, b) =>
                  a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
              )
              .map((item) => (
                <li key={item.id}>
                  <span className="checklist-snapshot-content">
                    {item.content}
                  </span>
                  <ChecklistGuidance
                    guidance={item}
                    sections={['description', 'outputs']}
                  />
                  {item.evidencePolicyVersion === 3 && (
                    <span className="checklist-snapshot-evidence">
                      {t.requestedImages}: {item.requestedImageCount ?? 0} ·{' '}
                      {t.requestedVideos}: {item.requestedVideoCount ?? 0} ·{' '}
                      {t.includedMedia(
                        item.includedImageCountSnapshot ?? 0,
                        item.includedVideoCountSnapshot ?? 0,
                      )}
                    </span>
                  )}
                  {item.evidencePolicyVersion !== 3 &&
                    (item.minimumEvidenceCount !== undefined ||
                      item.requiredEvidenceType !== undefined) && (
                      <span className="checklist-snapshot-evidence">
                        {item.minimumEvidenceCount ?? 1} ·{' '}
                        {item.requiredEvidenceType === 'IMAGE'
                          ? t.image
                          : item.requiredEvidenceType === 'VIDEO'
                            ? t.video
                            : item.requiredEvidenceType === 'IMAGE_AND_VIDEO'
                              ? t.imageAndVideo
                              : t.imageOrVideo}
                      </span>
                    )}
                  {item.sourceType !== 'SERVICE_TEMPLATE' && (
                    <span className="checklist-snapshot-evidence">
                      {item.priceAvailable ? (
                        item.pricingStatus === 'DUPLICATE' ? (
                          t.priceDuplicate
                        ) : item.pricingStatus === 'REJECTED' ? (
                          t.priceRejected
                        ) : (
                          <>{t.priceAdditional} {formatVnd(item.approvedPrice ?? 0)}</>
                        )
                      ) : (
                        t.pricePending
                      )}
                    </span>
                  )}
                </li>
              ))}
          </ol>
        ) : (
          <p>{snapshotAt ? t.emptySnapshot : t.legacy}</p>
        )}
      </Card>
    </div>
  )
}
