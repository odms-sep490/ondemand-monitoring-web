import { useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { Lottie } from 'lottie-react'
import { useReducedMotion } from 'motion/react'

import { useI18n } from '../../../shared/i18n'
import droneAnimation from '../assets/drone-animation.json'
import { landingMessages } from '../content'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export function MissionJourney() {
  const sectionRef = useRef<HTMLElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const reducedMotion = useReducedMotion()
  const { t: copy } = useI18n(landingMessages)
  const activeStage = copy.journey.stages[activeIndex] ?? copy.journey.stages[0]

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section) return

      const chapters = Array.from(
        section.querySelectorAll<HTMLElement>('[data-story-index]'),
      )
      const triggers = chapters.map((chapter, index) =>
        ScrollTrigger.create({
          trigger: chapter,
          start: 'top 62%',
          end: 'bottom 38%',
          onEnter: () => setActiveIndex(index),
          onEnterBack: () => setActiveIndex(index),
        }),
      )

      return () => triggers.forEach((trigger) => trigger.kill())
    },
    {
      scope: sectionRef,
      dependencies: [copy.journey.stages.length],
      revertOnUpdate: true,
    },
  )

  return (
    <section
      className="lpx-journey lpx-container"
      id="how-it-works"
      ref={sectionRef}
      aria-labelledby="lpx-journey-title"
      aria-label={copy.journey.visualLabel}
    >
      <header className="lpx-section-intro lpx-journey-intro">
        <p className="lpx-section-label">{copy.journey.label}</p>
        <h2 id="lpx-journey-title">{copy.journey.title}</h2>
        <p>{copy.journey.lead}</p>
      </header>

      <div className="lpx-journey-grid">
        <div className="lpx-story-visual" data-ui="mission-progress">
          <div className="lpx-story-photo lpx-orbit">
            {copy.journey.stages.map((stage, index) => (
              <img
                key={stage.id}
                className={`lpx-story-image${index === activeIndex ? ' is-active' : ''}`}
                src={stage.image}
                alt={index === activeIndex ? stage.imageAlt : ''}
                aria-hidden={index !== activeIndex}
                width="1920"
                height="1280"
                loading={index === activeIndex ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))}
            <span
              className="lpx-orbit-ring lpx-orbit-ring--outer"
              aria-hidden="true"
            />
            <span
              className="lpx-orbit-ring lpx-orbit-ring--inner"
              aria-hidden="true"
            />
            <span className="lpx-orbit-point" aria-hidden="true" />
            {activeIndex >= 2 && (
              <div
                className="lpx-journey-drone"
                role="img"
                aria-label={copy.hero.animationAlt}
              >
                <Lottie
                  src={droneAnimation}
                  autoplay={!reducedMotion}
                  loop={!reducedMotion}
                  className="lpx-drone-animation"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          <div className="lpx-story-card">
            <p className="lpx-preview-label">
              {copy.journey.currentStageLabel}
            </p>
            <h3>{activeStage.status}</h3>
            <p>{activeStage.title}</p>
            <ol aria-label={copy.journey.label}>
              {copy.journey.stages.map((stage, index) => (
                <li
                  key={stage.id}
                  className={index === activeIndex ? 'is-current' : ''}
                  aria-current={index === activeIndex ? 'step' : undefined}
                >
                  <span aria-hidden="true" />
                  {stage.title}
                </li>
              ))}
            </ol>
          </div>
          <p className="lpx-story-note">{copy.journey.imageNote}</p>
        </div>

        <div className="lpx-story-chapters">
          {copy.journey.stages.map((stage, index) => (
            <article
              className="lpx-story-chapter"
              id={stage.id}
              data-story-index={index}
              key={stage.id}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              <img
                className="lpx-story-thumbnail"
                src={stage.image}
                alt=""
                aria-hidden="true"
                width="960"
                height="640"
                loading="lazy"
                decoding="async"
              />
              <p className="lpx-story-step">{stage.status}</p>
              <h3>{stage.title}</h3>
              <p>{stage.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
