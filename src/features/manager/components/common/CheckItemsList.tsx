import type {
  PreflightCheckItem,
  PostDeviceCheckItem,
} from '../../types/missions'
import { checkTone, checkLabel } from './missionDetailHelpers'
import { viCheckName, viCheckMessage } from '../../../../shared/lib/checkText'

export function CheckItemsList({
  items,
}: {
  items: Array<PreflightCheckItem | PostDeviceCheckItem>
}) {
  if (items.length === 0) {
    return <div className="odm-or-empty">Chưa có hạng mục kiểm tra.</div>
  }
  return (
    <ul className="odm-or-check-list">
      {items.map((item) => (
        <li
          key={`${item.checkType}-${item.checkName}`}
          className="odm-or-check-item"
        >
          <span className={`odm-or-dot is-${checkTone(item.status)}`} />
          <span>
            <strong>{viCheckName(item.checkName)}</strong>
            {item.message ? (
              <small>{viCheckMessage(item.message)}</small>
            ) : null}
          </span>
          <span className={`odm-or-pill odm-or-pill-${checkTone(item.status)}`}>
            {checkLabel(item.status)}
          </span>
        </li>
      ))}
    </ul>
  )
}
