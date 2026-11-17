import { ArrowDownOutlined, ArrowUpOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import type { KeyboardEvent } from 'react'

import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceCheckCriterion } from '../../../api/deviceCheckCriteriaApi'
import { deviceCheckCriteriaMessages } from '../DeviceCheckCriteriaPage.messages'

type Props = {
  criterion: DeviceCheckCriterion
  selected: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  busy: boolean
  onSelect: (criterion: DeviceCheckCriterion) => void
  onMove: (criterion: DeviceCheckCriterion, delta: -1 | 1) => void
}

/** Square, ticket-style card for one inspection criterion (mirrors the manager maintenance ticket card). */
export function CriterionCard({ criterion, selected, canMoveUp, canMoveDown, busy, onSelect, onMove }: Props) {
  const { t } = useI18n(deviceCheckCriteriaMessages)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onSelect(criterion)
    }
  }

  const classes = ['adm-crit-card', selected && 'is-selected', !criterion.active && 'is-inactive']
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role="button"
      tabIndex={0}
      aria-label={criterion.name}
      onClick={() => onSelect(criterion)}
      onKeyDown={handleKeyDown}
    >
      <div className="adm-crit-card-top">
        <span className="adm-crit-card-code">{criterion.code}</span>
        {criterion.systemLogic && (
          <span className="adm-crit-card-system">
            <ThunderboltOutlined aria-hidden="true" /> {t.card.system}
          </span>
        )}
      </div>

      <div className="adm-crit-card-title">{criterion.name}</div>

      <div className="adm-crit-card-tags">
        <StatusTag tone={criterion.required ? 'danger' : 'warning'}>
          {criterion.required ? t.card.required : t.card.optional}
        </StatusTag>
        {!criterion.active && <StatusTag tone="neutral">{t.card.inactive}</StatusTag>}
      </div>

      <div className={`adm-crit-card-desc${criterion.description ? '' : ' is-empty'}`}>
        {criterion.description || t.card.noDescription}
      </div>

      <div className="adm-crit-card-foot">
        <span className="adm-crit-card-order">
          {t.card.order} <b>#{criterion.sortOrder}</b>
        </span>
        <span className="adm-crit-card-moves">
          <Tooltip title={t.card.moveUp}>
            <Button
              size="small"
              type="text"
              icon={<ArrowUpOutlined />}
              aria-label={`${t.card.moveUp}: ${criterion.name}`}
              disabled={!canMoveUp || busy}
              onClick={(event) => {
                event.stopPropagation()
                onMove(criterion, -1)
              }}
            />
          </Tooltip>
          <Tooltip title={t.card.moveDown}>
            <Button
              size="small"
              type="text"
              icon={<ArrowDownOutlined />}
              aria-label={`${t.card.moveDown}: ${criterion.name}`}
              disabled={!canMoveDown || busy}
              onClick={(event) => {
                event.stopPropagation()
                onMove(criterion, 1)
              }}
            />
          </Tooltip>
        </span>
      </div>
    </div>
  )
}
