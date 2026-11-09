import { Button } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import type { MediaItem } from '../../../lib/media/types'
import { customerHref } from '../../../routes'
import { siblingNavMessages } from './SiblingNav.messages'

type Props = { prev: MediaItem | null; next: MediaItem | null }

export function SiblingNav({ prev, next }: Props) {
  const { t } = useI18n(siblingNavMessages)
  const link = (target: MediaItem | null, label: string) =>
    target ? (
      <Button href={customerHref({ screen: 'mediaDetail', mediaId: target.id })}>{label}</Button>
    ) : (
      <Button disabled>{label}</Button>
    )
  return (
    <nav className="mdp-nav" aria-label={t.label}>
      {link(prev, t.prev)}
      {link(next, t.next)}
    </nav>
  )
}
