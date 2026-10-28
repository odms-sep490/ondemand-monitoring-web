import { Descriptions } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import { formatBytes } from '../../../lib/media/mapMedia'
import type { MediaItem } from '../../../lib/media/types'
import { mediaInfoListMessages } from './MediaInfoList.messages'
import { mediaUiMessages } from './mediaUi'

type Props = { item: MediaItem; missionLabel: string }

export function MediaInfoList({ item, missionLabel }: Props) {
  const { t, locale } = useI18n(mediaInfoListMessages)
  const { t: ui } = useI18n(mediaUiMessages)
  const when = (iso: string | null) => (iso ? fmtDateTime(iso, locale) : ui.unknown)
  const rows: Array<[string, string]> = [
    [t.fileName, item.fileName],
    [t.type, ui.kind[item.kind]],
    [t.size, formatBytes(item.fileSize) ?? ui.unknown],
    [t.capturedAt, when(item.capturedAt)],
    [t.availableAt, when(item.availableAt)],
    [t.mission, missionLabel],
    [t.device, item.deviceId ?? ui.unknown],
  ]
  return (
    <Descriptions
      className="md-info"
      size="small"
      column={{ xs: 1, sm: 2 }}
      layout="vertical"
      items={rows.map(([label, value]) => ({ key: label, label, children: value }))}
    />
  )
}
