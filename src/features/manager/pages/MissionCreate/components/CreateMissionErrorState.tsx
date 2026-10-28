import { Button } from 'antd'

import { ErrorState } from '../../../components/common/ErrorState'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { missionCreatePageMessages } from '../MissionCreatePage.messages'

export function CreateMissionErrorState({ error }: { error: unknown }) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <div className="mgr-view">
      <ErrorState
        title={t.loadError}
        error={error}
        action={
          <Button type="primary" href={managerHref({ screen: 'orderQueue' })}>
            {t.backToQueue}
          </Button>
        }
      />
    </div>
  )
}
