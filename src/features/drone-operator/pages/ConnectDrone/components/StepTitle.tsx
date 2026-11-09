export function StepTitle({
  n,
  text,
  id,
}: {
  n: number
  text: string
  id?: string
}) {
  return (
    <h2 id={id} className="connect-step-title">
      <span className="connect-step-title__number" aria-hidden="true">
        {n}
      </span>
      <span className="connect-step-title__text">{text}</span>
    </h2>
  )
}
