import { Button } from 'antd'
import { motion, useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { ServiceOption } from '../../../api/customerApi'
import { AI_CARD_TILT_DEG, AI_MOTION } from './aiMotionTokens'
import { resolveServiceMicroWorldTheme } from './ServiceMicroWorld'

type Props = {
  service: ServiceOption
  selected: boolean
  disabled: boolean
  index?: number
  onSelect: (service: ServiceOption, sourceEl?: HTMLElement | null) => void
  onHoverChange?: (service: ServiceOption | null) => void
}

/**
 * Interactive service option card with staggered magic reveal, pointer-driven 3D tilt,
 * specular cyan lighting, subtle image parallax, and animated selected state.
 * Always renders real backend service metadata and images.
 */
export function AnimatedServiceCard({
  service,
  selected,
  disabled,
  index = 0,
  onSelect,
  onHoverChange,
}: Props) {
  const reduceMotion = useReducedMotion()
  const cardRef = useRef<HTMLElement | null>(null)
  const [imageSrc, setImageSrc] = useState(service.imageUrl || service.fallbackImageUrl || '')
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false })
  const theme = resolveServiceMicroWorldTheme(service)

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reduceMotion || event.pointerType !== 'mouse') return
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const nx = (event.clientX - rect.left) / rect.width
    const ny = (event.clientY - rect.top) / rect.height
    setTilt({
      rx: (0.5 - ny) * AI_CARD_TILT_DEG * 2,
      ry: (nx - 0.5) * AI_CARD_TILT_DEG * 2,
      px: Math.round(nx * 100),
      py: Math.round(ny * 100),
      active: true,
    })
  }

  function handlePointerLeave() {
    setTilt({ rx: 0, ry: 0, px: 50, py: 50, active: false })
    onHoverChange?.(null)
  }

  return (
    <motion.article
      ref={cardRef}
      data-service-id={service.id}
      data-service-theme={theme}
      className={`ai-svc-card${selected ? ' is-selected' : ''}${tilt.active ? ' is-tilting' : ''}`}
      style={
        {
          '--card-px': `${tilt.px}%`,
          '--card-py': `${tilt.py}%`,
          transformPerspective: 820,
        } as React.CSSProperties
      }
      initial={
        reduceMotion
          ? false
          : {
              opacity: 0,
              y: 16,
              scale: 0.94,
              rotateX: 8,
            }
      }
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: tilt.active ? tilt.rx : 0,
        rotateY: tilt.active ? tilt.ry : 0,
      }}
      whileHover={reduceMotion ? undefined : { y: -3 }}
      transition={{
        opacity: { duration: 0.28, delay: reduceMotion ? 0 : 0.08 + index * AI_MOTION.stagger },
        y: { duration: 0.34, delay: reduceMotion ? 0 : 0.08 + index * AI_MOTION.stagger, ease: AI_MOTION.ease.out },
        scale: { duration: 0.34, delay: reduceMotion ? 0 : 0.08 + index * AI_MOTION.stagger, ease: AI_MOTION.ease.out },
        rotateX: AI_MOTION.ease.softSpring,
        rotateY: AI_MOTION.ease.softSpring,
      }}
      onPointerEnter={() => onHoverChange?.(service)}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <span className="ai-svc-glow" aria-hidden="true" />
      <div className="ai-svc-media is-loaded">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            style={
              !reduceMotion && tilt.active
                ? {
                    transform: `scale(1.06) translate3d(${(50 - tilt.px) * 0.12}px, ${(50 - tilt.py) * 0.12}px, 0)`,
                  }
                : undefined
            }
            onError={() => {
              if (service.fallbackImageUrl && imageSrc !== service.fallbackImageUrl) {
                setImageSrc(service.fallbackImageUrl)
              } else {
                setImageSrc('')
              }
            }}
          />
        ) : (
          <span className="ai-svc-media-empty" aria-hidden="true">
            {service.name.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="ai-svc-body">
        <strong>{service.name}</strong>
        {service.description && <p>{service.description}</p>}
        {typeof service.defaultPrice === 'number' && (
          <span className="ai-svc-price">
            Giá tham khảo: {service.defaultPrice.toLocaleString('vi-VN')} đồng
          </span>
        )}
        <Button
          type="primary"
          block
          disabled={disabled}
          aria-pressed={selected}
          onClick={() => onSelect(service, cardRef.current)}
        >
          {selected ? 'Đã chọn' : 'Chọn dịch vụ'}
        </Button>
      </div>
    </motion.article>
  )
}
