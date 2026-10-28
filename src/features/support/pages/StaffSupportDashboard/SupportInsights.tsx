import {
  ClockCircleOutlined,
  PieChartOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Progress } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import type { SupportInsights as Insights } from './supportMetrics'
import { staffSupportMessages } from './StaffSupportDashboard.messages'

/** FAQ deflection, response-time (SLA) and issue-source cards. */
export function SupportInsights({ insights }: { insights: Insights }) {
  const { t } = useI18n(staffSupportMessages)
  const sources = [
    { label: t.insight.sourceOrders, pct: insights.ordersPct },
    { label: t.insight.sourceMissions, pct: insights.missionsPct },
    { label: t.insight.sourceMedia, pct: insights.mediaPct },
  ]
  return (
    <div className="sd-insights">
      <CardComponent
        icon={<QuestionCircleOutlined />}
        tone="violet"
        title={t.insight.faqTitle}
      >
        <div className="sd-big">{insights.deflectionRate}%</div>
        <p className="sd-note">
          {t.insight.faqSummary(insights.totalHelpfulVotes)}
        </p>
        <div className="sd-sub-title">{t.insight.topFaq}</div>
        {insights.totalHelpfulVotes > 0 ? (
          <ol className="sd-faq-list">
            {insights.topHelpfulArticles.map((article) => (
              <li key={article.id}>
                <span className="sd-faq-q" title={article.question}>
                  {article.question}
                </span>
                <span className="sd-faq-n">
                  {t.insight.likes(article.votesCount)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sd-note">{t.insight.noVotes}</p>
        )}
      </CardComponent>

      <CardComponent
        icon={<ClockCircleOutlined />}
        tone="amber"
        title={t.insight.slaTitle}
      >
        <div className="sd-big">
          {t.insight.minutes(insights.avgResponseTimeMins)}
        </div>
        <p className="sd-note">{t.insight.avgResponse}</p>
        <p className="sd-sla">
          {t.insight.slaCommit(insights.slaComplianceRate)}
        </p>
      </CardComponent>

      <CardComponent
        icon={<PieChartOutlined />}
        tone="blue"
        title={t.insight.sourceTitle}
      >
        <ul className="sd-sources">
          {sources.map((source) => (
            <li key={source.label}>
              <div className="sd-source-row">
                <span>{source.label}</span>
                <b>{source.pct}%</b>
              </div>
              <Progress
                percent={Math.min(100, Math.max(0, source.pct))}
                showInfo={false}
                size="small"
                aria-hidden="true"
              />
            </li>
          ))}
        </ul>
      </CardComponent>
    </div>
  )
}
