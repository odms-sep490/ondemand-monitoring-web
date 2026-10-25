import { useEffect, type ReactNode } from 'react'
import { missionApi } from '../../../mission/api/missionApi'
import {
  mayPerformMissionAction,
  type MissionAction,
} from '../../../mission/types/permissions'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../../shared/i18n'
import { operatorHref } from '../../routes'

export function MissionActionGuard({
  missionId,
  action,
  children,
}: {
  missionId?: string
  action: MissionAction
  children: ReactNode
}) {
  const { lang } = useLanguage()
  const query = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, action],
  )
  const backHref = missionId
    ? operatorHref({ screen: 'missionDetail', missionId })
    : operatorHref({ screen: 'missions' })
  const pilotOnOperatorStep =
    query.data?.canControlFlight === true &&
    query.data?.canOperatePayload !== true &&
    (action === 'connect' || action === 'preflight' || action === 'handover')

  useEffect(() => {
    if (pilotOnOperatorStep && missionId) {
      window.location.hash = operatorHref({ screen: 'flight', missionId })
    }
  }, [missionId, pilotOnOperatorStep])

  if (query.loading)
    return (
      <GuardStateCard
        tone="blue"
        eyebrow={lang === 'vi' ? 'Đang kiểm tra' : 'Checking'}
        title={
          lang === 'vi'
            ? 'Đang kiểm tra quyền nhiệm vụ'
            : 'Checking mission permissions'
        }
        description={
          lang === 'vi'
            ? 'Hệ thống đang xác nhận phân công của bạn trước khi mở thao tác này.'
            : 'The system is confirming your assignment before opening this action.'
        }
        statusRole="status"
      />
    )
  if (
    query.error ||
    !query.data ||
    !mayPerformMissionAction(query.data, action)
  ) {
    if (pilotOnOperatorStep) {
      return (
        <GuardStateCard
          tone="blue"
          eyebrow={lang === 'vi' ? 'Sẵn sàng bay' : 'Ready to fly'}
          title={lang === 'vi' ? 'Đang mở buồng lái' : 'Opening the cockpit'}
          description={
            lang === 'vi'
              ? 'Operator đã hoàn tất kiểm tra và bàn giao. Pilot có thể tiếp tục bay trong buồng lái.'
              : 'The operator completed checks and handover. The pilot can continue in the cockpit.'
          }
          statusRole="status"
        />
      )
    }
    const message =
      (query.error
        ? lang === 'vi'
          ? 'Không thể xác nhận quyền Mission. Vui lòng kiểm tra lại hoặc đăng nhập lại.'
          : 'Unable to confirm Mission access. Retry or sign in again.'
        : undefined) ??
      (pilotOnOperatorStep
        ? lang === 'vi'
          ? 'Bước này dành cho operator kết nối thiết bị, preflight và bàn giao. Pilot tiếp tục ở buồng lái sau khi operator bàn giao.'
          : 'This step is for the operator to connect the device, run preflight, and hand over. The pilot continues in the cockpit after handover.'
        : lang === 'vi'
          ? 'Bạn chưa được phân công hoặc chưa có quyền thực hiện thao tác này.'
          : 'Your accepted mission assignment does not permit this action.')
    return (
      <GuardStateCard
        tone="amber"
        eyebrow={lang === 'vi' ? 'Chưa thể thao tác' : 'Action unavailable'}
        title={
          lang === 'vi'
            ? 'Bạn chưa có quyền mở bước này'
            : 'You cannot open this step yet'
        }
        description={message}
        statusRole="alert"
        primaryAction={{
          label: pilotOnOperatorStep
            ? lang === 'vi'
              ? 'Mở buồng lái'
              : 'Open cockpit'
            : lang === 'vi'
              ? 'Quay lại mission'
              : 'Back to mission',
          href:
            pilotOnOperatorStep && missionId
              ? operatorHref({ screen: 'flight', missionId })
              : backHref,
        }}
        secondaryAction={{
          label: lang === 'vi' ? 'Kiểm tra lại' : 'Retry',
          onClick: query.reload,
        }}
      />
    )
  }
  return children
}

function GuardStateCard({
  tone,
  eyebrow,
  title,
  description,
  statusRole,
  primaryAction,
  secondaryAction,
}: {
  tone: 'blue' | 'amber'
  eyebrow: string
  title: string
  description: string
  statusRole: 'status' | 'alert'
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; onClick: () => void }
}) {
  const color =
    tone === 'amber'
      ? {
          bg: '#fff7ed',
          border: '#fed7aa',
          strong: '#9a3412',
          soft: '#c2410c',
          chipBg: '#ffedd5',
        }
      : {
          bg: '#eff6ff',
          border: '#bfdbfe',
          strong: '#1d4ed8',
          soft: '#2563eb',
          chipBg: '#dbeafe',
        }

  return (
    <section
      role={statusRole}
      style={{
        minHeight: 'calc(100vh - 150px)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 18px',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          borderRadius: 14,
          border: `1px solid ${color.border}`,
          background: '#fff',
          boxShadow: '0 18px 50px rgba(15, 23, 42, .08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            background: color.bg,
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 26,
              padding: '0 10px',
              borderRadius: 999,
              background: color.chipBg,
              color: color.strong,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            {eyebrow}
          </span>
          <h1
            style={{
              margin: '12px 0 0',
              fontSize: 22,
              lineHeight: 1.25,
              color: 'var(--tx)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--tx2)',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        </div>
        {(primaryAction || secondaryAction) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '16px 24px',
              flexWrap: 'wrap',
            }}
          >
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="odm-btn"
                style={{ minWidth: 128 }}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <a
                href={primaryAction.href}
                className="odm-btn odm-btn-p"
                style={{ minWidth: 150, textDecoration: 'none' }}
              >
                {primaryAction.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
