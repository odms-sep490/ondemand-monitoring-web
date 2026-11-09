import { Collapse } from 'antd'
import type { ReactNode } from 'react'

/**
 * Inline expandable section (antd Collapse) used for secondary content such as
 * technical details or terms. Panels are force-rendered so fields inside stay
 * mounted (form state and label lookups keep working while collapsed).
 */
export function InnerCollapse({
  title,
  children,
  className,
}: {
  title: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Collapse
      size="small"
      className={`cus-inner-collapse ${className ?? ''}`.trim()}
      items={[{ key: 'panel', label: title, children, forceRender: true }]}
    />
  )
}
