import { motion, useReducedMotion } from 'motion/react'

export type ServiceMicroWorldTheme = 'factory' | 'forest' | 'construction' | 'area'

export type ServiceMicroWorldInput = {
  name?: string | null
  description?: string | null
  code?: string | null
}

/**
 * Derives a purely decorative visual metaphor from real backend service metadata.
 * Never fabricates site geometry or operational capabilities.
 */
export function resolveServiceMicroWorldTheme(
  service?: ServiceMicroWorldInput | null,
): ServiceMicroWorldTheme {
  if (!service) return 'area'
  const haystack = `${service.code ?? ''} ${service.name ?? ''} ${service.description ?? ''}`.toLowerCase()
  if (/xưởng|mái|nhà máy|factory|industrial|roof|kho/.test(haystack)) return 'factory'
  if (/rừng|cây|nông|lâm|forest|tree|canopy|cháy/.test(haystack)) return 'forest'
  if (/xây|công trình|tiến độ|construction|building|hạ tầng/.test(haystack)) return 'construction'
  return 'area'
}

type Props = {
  service?: ServiceMicroWorldInput | null
  className?: string
}

/**
 * Lightweight decorative SVG silhouette reacting to the selected service category.
 */
export function ServiceMicroWorld({ service, className = '' }: Props) {
  const reduceMotion = useReducedMotion()
  const theme = resolveServiceMicroWorldTheme(service)

  return (
    <motion.div
      key={theme}
      className={`ai-service-microworld is-${theme} ${className}`.trim()}
      data-microworld={theme}
      aria-hidden="true"
      initial={reduceMotion ? false : { y: 4, scale: 0.96 }}
      animate={{ y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <svg viewBox="0 0 220 56" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        {theme === 'factory' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M 10 48 L 10 26 L 40 16 L 40 26 L 70 16 L 70 26 L 100 16 L 100 48 Z" fill="currentColor" fillOpacity="0.08" />
            <rect x="116" y="22" width="48" height="26" rx="2" fill="currentColor" fillOpacity="0.07" />
            <line x1="126" y1="30" x2="154" y2="30" strokeOpacity="0.55" />
            <line x1="126" y1="38" x2="154" y2="38" strokeOpacity="0.55" />
            <line x1="6" y1="48" x2="214" y2="48" strokeOpacity="0.45" />
            <motion.line
              x1="14"
              y1="22"
              x2="170"
              y2="22"
              stroke="#00c4ff"
              strokeWidth="1.2"
              strokeDasharray="4 4"
              animate={reduceMotion ? undefined : { y: [0, 18, 0], opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </g>
        )}

        {theme === 'forest' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M 4 48 Q 55 34 110 44 T 216 42 L 216 54 L 4 54 Z" fill="currentColor" fillOpacity="0.08" />
            <polygon points="34,44 44,20 54,44" fill="currentColor" fillOpacity="0.12" />
            <polygon points="62,45 75,14 88,45" fill="currentColor" fillOpacity="0.14" />
            <polygon points="104,46 114,24 124,46" fill="currentColor" fillOpacity="0.1" />
            <polygon points="146,45 158,18 170,45" fill="currentColor" fillOpacity="0.13" />
            <polygon points="182,45 190,26 198,45" fill="currentColor" fillOpacity="0.1" />
          </g>
        )}

        {theme === 'construction' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="24" y="20" width="38" height="28" fill="currentColor" fillOpacity="0.08" />
            <line x1="24" y1="29" x2="62" y2="29" strokeOpacity="0.5" />
            <line x1="24" y1="38" x2="62" y2="38" strokeOpacity="0.5" />
            <rect x="74" y="12" width="44" height="36" fill="currentColor" fillOpacity="0.1" />
            <line x1="74" y1="24" x2="118" y2="24" strokeOpacity="0.5" />
            <line x1="74" y1="36" x2="118" y2="36" strokeOpacity="0.5" />
            {/* Crane silhouette */}
            <line x1="152" y1="48" x2="152" y2="10" />
            <line x1="132" y1="12" x2="196" y2="12" />
            <line x1="184" y1="12" x2="184" y2="28" stroke="#00c4ff" strokeDasharray="3 2" />
            <line x1="8" y1="48" x2="212" y2="48" strokeOpacity="0.45" />
          </g>
        )}

        {theme === 'area' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M 16 44 L 54 30 L 116 36 L 166 20 L 204 34" strokeOpacity="0.45" />
            <path d="M 24 48 L 66 36 L 128 42 L 178 28 L 208 42" strokeOpacity="0.28" />
            <circle cx="116" cy="36" r="14" stroke="#00c4ff" strokeOpacity="0.35" />
            <circle cx="116" cy="36" r="24" stroke="#00c4ff" strokeOpacity="0.18" strokeDasharray="4 4" />
            <circle cx="116" cy="36" r="3" fill="#00c4ff" />
          </g>
        )}
      </svg>
    </motion.div>
  )
}
