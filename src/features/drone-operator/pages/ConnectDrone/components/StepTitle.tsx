export function StepTitle({ n, text }: { n: number; text: string }) {
  return (
    <div className="stf-step-title">
      <span className="mgr-tile mgr-tile-sm mgr-tone-blue" aria-hidden="true">
        {n}
      </span>
      <span>{text}</span>
    </div>
  )
}
