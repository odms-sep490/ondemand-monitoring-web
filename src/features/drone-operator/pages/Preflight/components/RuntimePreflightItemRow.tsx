import {
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
  MinusOutlined,
} from '@ant-design/icons'
import { Button, Input, theme } from 'antd'
import { useState } from 'react'

import { StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { ItemState } from '../preflightTypes'
import { statusText } from '../preflightHelpers'
import { preflightPageMessages } from '../PreflightPage.messages'
import type { PreflightItemDef } from './PreflightItem'

export function RuntimePreflightItemRow({
  def,
  state,
  manual,
  updating,
  onUpdate,
  onRecheck,
}: {
  def: PreflightItemDef
  state: ItemState
  manual: boolean
  updating: boolean
  onUpdate: (
    checkType: string,
    status: 'PASSED' | 'FAILED',
    message: string,
  ) => Promise<void>
  onRecheck: (checkType: string) => Promise<void>
}) {
  const { t } = useI18n(preflightPageMessages)
  const { token } = theme.useToken()
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  const checking = state.status === 'CHECKING'
  const decided = passed || failed
  const [showFailureReason, setShowFailureReason] = useState(false)
  const [failureReason, setFailureReason] = useState('')
  const tone = failed
    ? { label: t.itemFail, tag: 'danger' as const }
    : passed
      ? { label: t.itemPass, tag: 'success' as const }
      : {
          label: checking ? t.itemChecking : t.itemPending,
          tag: 'neutral' as const,
        }
  const message = statusText(t, state.status, state.message)
  const tile = passed
    ? 'mgr-tone-green'
    : failed
      ? 'mgr-tone-red'
      : 'stf-tile-neutral'

  return (
    <div
      className="stf-item"
      style={
        failed
          ? {
              borderColor: token.colorErrorBorder,
              background: token.colorErrorBg,
            }
          : passed
            ? { borderColor: token.colorSuccessBorder }
            : undefined
      }
    >
      <div className="stf-item-main">
        <span className={`mgr-tile mgr-tile-sm ${tile}`} aria-hidden="true">
          {passed ? (
            <CheckOutlined />
          ) : failed ? (
            <CloseOutlined />
          ) : checking ? (
            <LoadingOutlined />
          ) : (
            <MinusOutlined />
          )}
        </span>
        <div style={{ minWidth: 0 }}>
          <div className="stf-item-name">{def.label}</div>
          <div className="stf-muted" style={{ fontSize: 12 }}>
            {def.detail ? `${def.detail} · ` : ''}
            <span className="stf-mono">{def.code}</span>
          </div>
          <div className="stf-item-msg" title={message}>
            {message}
          </div>
        </div>
        <div className="stf-item-action">
          {manual && !decided ? (
            <>
              <Button
                type="primary"
                disabled={updating}
                loading={updating}
                onClick={() => {
                  void onUpdate(def.key, 'PASSED', t.operatorConfirmedPass)
                    .then(() => {
                      setShowFailureReason(false)
                    })
                    .catch(() => undefined)
                }}
              >
                {t.itemPass}
              </Button>
              <Button
                danger
                disabled={updating}
                onClick={() => setShowFailureReason((value) => !value)}
              >
                {t.itemFail}
              </Button>
            </>
          ) : manual ? (
            <StatusTag tone={tone.tag}>{tone.label}</StatusTag>
          ) : def.key === 'battery_health' && !decided ? (
            <Button
              type="primary"
              disabled={updating}
              loading={updating}
              onClick={() => void onRecheck(def.key).catch(() => undefined)}
            >
              {updating ? t.itemChecking : t.fetchCurrentBattery}
            </Button>
          ) : (
            <StatusTag tone={tone.tag}>{tone.label}</StatusTag>
          )}
        </div>
      </div>
      {manual && !decided && showFailureReason ? (
        <div className="stf-row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
          <Input
            value={failureReason}
            onChange={(event) => setFailureReason(event.target.value)}
            placeholder={t.failureReasonPlaceholder}
          />
          <Button
            danger
            type="primary"
            disabled={updating || failureReason.trim().length === 0}
            onClick={() =>
              void onUpdate(def.key, 'FAILED', failureReason.trim())
                .then(() => {
                  setShowFailureReason(false)
                  setFailureReason('')
                })
                .catch(() => undefined)
            }
          >
            {t.confirmFailure}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
