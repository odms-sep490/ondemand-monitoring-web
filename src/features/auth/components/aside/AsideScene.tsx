import { useParallax } from '../../hooks/useParallax'
import { useI18n } from '../../../../shared/i18n'
import { authAsideMessages } from '../AuthAside.messages'
import { AsideBackground } from './AsideBackground'
import { AsideBrandBlock } from './AsideBrandBlock'
import { AsideFloatCards, type AsideValueProp } from './AsideFloatCards'
import { AsideHeroCard } from './AsideHeroCard'
import { AsideSecondaryCard } from './AsideSecondaryCard'
import { AsideStatusChip } from './AsideStatusChip'

/**
 * Layered hero scene for the auth aside, back to front:
 *  1. gradient + drifting color orbs + perspective grid + twinkling
 *     particles (AsideBackground)
 *  2. a big glass-framed hero photo card with 3D tilt + shine sweep
 *  3. a smaller secondary photo card overlapping its bottom-right corner
 *  4. a live-status glass chip over the hero's top-left corner
 *  5. the brand lockup (top) and value-prop chips (bottom)
 *
 * A subtle mouse-follow parallax nudges layers via `--parallax-x` /
 * `--parallax-y` (see useParallax) — disabled on touch devices and under
 * reduced motion.
 */
export function AsideScene({
  valueProps,
}: {
  valueProps: readonly AsideValueProp[]
}) {
  const parallaxRef = useParallax<HTMLDivElement>()
  const { t } = useI18n(authAsideMessages)

  return (
    <div className="odm-aside-scene" ref={parallaxRef}>
      <AsideBackground />
      <AsideBrandBlock />
      <div className="odm-aside-stage">
        <AsideHeroCard />
        <AsideStatusChip />
        <AsideSecondaryCard />
      </div>
      <div className="odm-aside-story">
        <h2>{t.heroTitle}<span>{t.heroAccent}</span></h2>
        <p>{t.heroDescription}</p>
        <span className="odm-aside-story-rule" aria-hidden="true" />
      </div>
      <AsideFloatCards items={valueProps} />
    </div>
  )
}
