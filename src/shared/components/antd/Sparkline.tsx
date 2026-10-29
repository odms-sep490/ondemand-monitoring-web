import { lazy, Suspense } from 'react'

// recharts is ~400 kB: load it only when a stat tile actually renders a sparkline,
// so screens without trend tiles (and the first paint of every portal) skip it.
const SparklineChart = lazy(() =>
  import('./SparklineChart').then((m) => ({ default: m.SparklineChart })),
)

type SparklineProps = {
  values: number[]
  tone: 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'cyan'
}

/** Decorative mini area chart; the figure itself carries the accessible value. */
export function Sparkline(props: SparklineProps) {
  return (
    <Suspense fallback={<div className="mgr-spark" aria-hidden="true" />}>
      <SparklineChart {...props} />
    </Suspense>
  )
}
