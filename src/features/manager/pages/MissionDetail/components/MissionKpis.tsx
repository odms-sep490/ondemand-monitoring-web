export function MissionKpis({
  kpis,
}: {
  kpis: { label: string; value: string }[]
}) {
  return (
    <dl className="mgr-md-kpis">
      {kpis.map((item) => (
        <div className="mgr-md-kpi" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
