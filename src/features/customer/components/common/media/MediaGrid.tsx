import { shortId } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'
import { MediaCard } from './MediaCard'

type Props = {
  items: MediaItem[]
  missionLabels?: Record<string, string>
  onOpen: (item: MediaItem) => void
}

export function MediaGrid({ items, missionLabels, onOpen }: Props) {
  return (
    <ul className="md-grid">
      {items.map((item) => (
        <li key={item.id}>
          <MediaCard
            item={item}
            missionLabel={
              missionLabels
                ? (missionLabels[item.missionId] ?? shortId(item.missionId))
                : undefined
            }
            onOpen={onOpen}
          />
        </li>
      ))}
    </ul>
  )
}
