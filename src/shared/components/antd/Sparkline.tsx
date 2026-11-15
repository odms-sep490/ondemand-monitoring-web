import { lazy, Suspense } from 'react'

const STROKE = {
  blue: '#1565E8',
  green: '#16A34A',
  amber: '#F59E0B',
  violet: '#7C3AED',
  red: '#DC2626',
} as const

// recharts is ~600 KB; keep it out of every portal's first load and fetch it
// only when a sparkline actually renders.
const SparklineChart = lazy(() => import('./SparklineChart'))

/** Decorative mini area chart; the figure itself carries the accessible value. */
export function Sparkline({ values, tone }: { values: number[]; tone: keyof typeof STROKE }) {
  return (
    <div className="mgr-spark" aria-hidden="true">
      <Suspense fallback={null}>
        <SparklineChart values={values} stroke={STROKE[tone]} />
      </Suspense>
    </div>
  )
}
