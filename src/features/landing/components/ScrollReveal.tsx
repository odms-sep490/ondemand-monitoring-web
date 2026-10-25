import { useReducedMotion } from 'motion/react'
import { div as MotionDiv } from 'motion/react-m'
import type { ReactNode } from 'react'

export function ScrollReveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}) {
  const reduced = useReducedMotion()
  const shouldAnimate = !reduced && typeof IntersectionObserver !== 'undefined'
  return (
    <MotionDiv
      className="lp-scroll-reveal"
      initial={shouldAnimate ? { opacity: 0, y: 28 } : false}
      whileInView={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduced ? 0 : 0.65,
        delay: reduced ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionDiv>
  )
}
