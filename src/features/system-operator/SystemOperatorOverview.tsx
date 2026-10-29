import {
  CardComponent,
  PageHeader,
  StatisticComponent,
} from '../../shared/components/antd'
import { Icon, type IconName } from '../../shared/components/Icon'
import { useI18n } from '../../shared/i18n'
import { rolePortalPageMessages } from '../portal/pages/RolePortalPage.messages'
import { technicalOverviewMessages } from './TechnicalOverview.messages'
import './sysop.scss'

const TONES = ['blue', 'cyan', 'amber', 'green'] as const

/** Overview body for the system operator, shown inside the staff shell. */
export function SystemOperatorOverview() {
  const { t } = useI18n(rolePortalPageMessages)
  const { t: technical } = useI18n(technicalOverviewMessages)
  const content = technical.content
  return (
    <div className="mgr-view">
      <PageHeader
        title={content.title}
        description={content.subtitle}
        crumb={content.eyebrow}
        actions={
          <a
            className="ant-btn ant-btn-primary"
            href="#portal/staff/technical/devices"
          >
            {content.primary}
          </a>
        }
      />

      <section className="mgr-kpi-strip" aria-label={t.metricsAriaLabel}>
        {content.metrics.map((metric, index) => (
          <StatisticComponent
            key={metric.label}
            index={index}
            tone={TONES[index % TONES.length]}
            title={metric.label}
            value={metric.value}
            hint={metric.detail}
            icon={<Icon name={metric.icon as IconName} />}
          />
        ))}
      </section>

      <div className="sysop-lower">
        <CardComponent
          title={t.recentActivityTitle}
          icon={<Icon name="clock" />}
        >
          <ul className="sysop-activity">
            {content.activities.map((activity, index) => (
              <li className="sysop-activity-item" key={activity}>
                <i
                  className={index === 0 ? 'is-active' : ''}
                  aria-hidden="true"
                />
                <div>
                  <strong>{activity}</strong>
                  <small>
                    {index === 0 ? t.updatedJustNow : t.hoursAgo(index + 1)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
        </CardComponent>
        <CardComponent
          title={t.nextActionTitle}
          icon={<Icon name="shield" />}
          tone="violet"
        >
          <p className="sysop-note">{t.nextActionCopy}</p>
        </CardComponent>
      </div>
    </div>
  )
}
