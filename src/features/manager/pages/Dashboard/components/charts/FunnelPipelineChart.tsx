type Props = { stages: { label: string; value: number }[]; empty: string; ariaLabel: string }

export function FunnelPipelineChart({ stages, empty, ariaLabel }: Props) {
  const max = Math.max(0, ...stages.map((stage) => stage.value))
  if (!max) return <p className="mgr-empty-line">{empty}</p>
  return <ol className="mgr-stage-chart" aria-label={ariaLabel}>{stages.map((stage) =>
    <li key={stage.label}><div><span>{stage.label}</span><strong>{stage.value}</strong></div>
      <div className="mgr-stage-track"><span style={{ width: `${stage.value / max * 100}%` }} /></div>
    </li>)}</ol>
}
