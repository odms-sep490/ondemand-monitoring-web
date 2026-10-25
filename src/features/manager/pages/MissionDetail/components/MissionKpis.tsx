export function MissionKpis({
  kpis,
}: {
  kpis: { label: string; value: string }[]
}) {
  return (
    <div className="odm-or-md-kpis">
      {kpis.map((item) => (
        <div key={item.label} className="odm-or-md-kpi">
          <span>{item.label}</span>
          <strong title={item.value}>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}
