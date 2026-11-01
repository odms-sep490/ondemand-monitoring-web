import { Card, Statistic } from 'antd'

export type PolicyStat = { key: string; label: string; value: string }

/** A responsive row of figures (antd Statistic) used for limits and customer-added prices. */
export function PolicyStats({ stats }: { stats: PolicyStat[] }) {
  return (
    <div className="ppo-tiles">
      {stats.map((stat) => (
        <Card size="small" key={stat.key} className="ppo-tile">
          <Statistic title={stat.label} value={stat.value} />
        </Card>
      ))}
    </div>
  )
}
