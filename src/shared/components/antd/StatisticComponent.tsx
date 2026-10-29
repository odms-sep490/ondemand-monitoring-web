import { Statistic, type StatisticProps } from 'antd'
import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

import { Sparkline } from './Sparkline'

export type StatTone = 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'cyan'

type Props = Omit<StatisticProps, 'title'> & {
  title: string
  icon?: ReactNode
  hint?: ReactNode
  hintTone?: StatTone
  tone?: StatTone
  /** Real series to draw as a tiny sparkline; omit when there is no data. */
  spark?: number[]
  /** Position in the row, drives the staggered entrance. */
  index?: number
  className?: string
}

/** Stat card: gradient icon tile, big number, optional hint chip + sparkline. */
export function StatisticComponent({
  title,
  icon,
  hint,
  hintTone,
  tone = 'blue',
  spark,
  index = 0,
  className = '',
  ...props
}: Props) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      className={`mgr-card mgr-stat mgr-stat-${tone} ${className}`.trim()}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: reduce ? 0 : index * 0.07, ease: 'easeOut' }}
      whileHover={reduce ? undefined : { y: -3 }}
    >
      <div className="mgr-stat-top">
        {icon ? (
          <span className={`mgr-tile mgr-tone-${tone}`} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <div className="mgr-stat-label">{title}</div>
      </div>
      <Statistic {...props} />
      {hint || (spark && spark.length > 1) ? (
        <div className="mgr-stat-bottom">
          {hint ? <span className={`mgr-chip mgr-chip-${hintTone ?? tone}`}>{hint}</span> : <span />}
          {spark && spark.length > 1 ? <Sparkline values={spark} tone={tone} /> : null}
        </div>
      ) : null}
    </motion.div>
  )
}
