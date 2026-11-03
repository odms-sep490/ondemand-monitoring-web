import { useEffect, useRef, useState } from 'react'
import { Lottie } from 'lottie-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import droneAnimation from '../assets/drone-animation.json'
import { Icon } from '../../../shared/components/Icon'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Chapter = {
  id: string
  eyebrow: string
  title: string
  body: string
  state: string
  image: string
  position?: string
}

type Copy = {
  stateLabel: string
  chapters: Chapter[]
}

const copyByLanguage: Record<'vi' | 'en', Copy> = {
  vi: {
    stateLabel: 'Tình trạng nhiệm vụ',
    chapters: [
      {
        id: 'journey-launch',
        eyebrow: 'Giám sát hiện trường theo yêu cầu',
        title: 'Từ kế hoạch bay đến|kết quả bàn giao.',
        body: 'OnDemand Monitor kết nối yêu cầu hiện trường với khâu lập kế hoạch, chuẩn bị trước chuyến bay và rà soát kết quả sau chuyến bay.',
        state: 'Sẵn sàng triển khai',
        image: '/images/landing/rail-yard.jpg',
        position: 'center 48%',
      },
      {
        id: 'mission-deploy',
        eyebrow: 'Triển khai',
        title: 'Sẵn sàng. Bắt đầu hành trình.',
        body: 'Đội bay chuẩn bị thiết bị và tiếp cận khu vực cần kiểm tra theo kế hoạch.',
        state: 'Đang triển khai',
        image: '/images/landing/site-construction.jpg',
        position: 'center 50%',
      },
      {
        id: 'mission-solar',
        eyebrow: 'Khảo sát khu vực',
        title: 'Quét toàn cảnh|từng dãy pin.',
        body: 'Ghi nhận hiện trạng trên diện rộng, đồng bộ hình ảnh với từng nội dung giám sát.',
        state: 'Đang ghi nhận hiện trường',
        image: '/images/landing/solar-field.jpg',
        position: 'center 56%',
      },
      {
        id: 'mission-infrastructure',
        eyebrow: 'Theo tuyến',
        title: 'Bám sát tuyến|hạ tầng dài.',
        body: 'Theo dõi đường dây và các hạng mục ở nhiều vị trí trong cùng một chuyến bay.',
        state: 'Đang theo tuyến',
        image: '/images/landing/transmission-tower.jpg',
        position: 'center 45%',
      },
      {
        id: 'mission-site',
        eyebrow: 'Kiểm tra công trình',
        title: 'Quan sát an toàn|từ trên cao.',
        body: 'Đội vận hành rà soát công trình đang hoạt động và ghi nhận những điểm cần chú ý.',
        state: 'Đang kiểm tra công trình',
        image: '/images/landing/construction-1280.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-urban',
        eyebrow: 'Tiếp cận vị trí',
        title: 'Đến gần vị trí|khó tiếp cận.',
        body: 'Ghi hình các vị trí cao và khu vực khó tiếp cận mà không cần đưa đội ngũ vào vùng nguy hiểm.',
        state: 'Đang kiểm tra vị trí cao',
        image: '/images/landing/infrastructure-1280.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-results',
        eyebrow: 'Rà soát kết quả',
        title: 'Ảnh, video và checklist|cùng một hồ sơ.',
        body: 'Bằng chứng và đánh giá được tập hợp để người phụ trách kiểm tra trước khi nghiệm thu.',
        state: 'Đang gửi dữ liệu',
        image: '/images/landing/landscape-1280.webp',
        position: 'center 54%',
      },
      {
        id: 'mission-return',
        eyebrow: 'Trở về và bàn giao',
        title: 'Hạ cánh an toàn.|Sẵn sàng cho lần bay tiếp.',
        body: 'Drone hạ cánh an toàn. Kết quả được gửi để đội ngũ tiếp tục rà soát và bàn giao.',
        state: 'Nhiệm vụ sẵn sàng bàn giao',
        image: '/images/landing/rail-yard.jpg',
        position: 'center 48%',
      },
    ],
  },
  en: {
    stateLabel: 'Mission status',
    chapters: [
      {
        id: 'journey-launch',
        eyebrow: 'On-demand field monitoring',
        title: 'From flight plans to|clear handoffs.',
        body: 'OnDemand Monitor connects site requests with planning, pre-flight preparation, and post-flight review.',
        state: 'Mission ready',
        image: '/images/landing/rail-yard.jpg',
        position: 'center 48%',
      },
      {
        id: 'mission-deploy',
        eyebrow: 'Deployment',
        title: 'Ready for takeoff.|Begin the mission.',
        body: 'The crew prepares the aircraft and heads to the inspection area.',
        state: 'Deploying',
        image: '/images/landing/site-construction.jpg',
        position: 'center 50%',
      },
      {
        id: 'mission-solar',
        eyebrow: 'Area survey',
        title: 'Scan each row|from above.',
        body: 'Capture a wide site view and connect evidence to the requested inspection points.',
        state: 'Recording the site',
        image: '/images/landing/solar-field.jpg',
        position: 'center 56%',
      },
      {
        id: 'mission-infrastructure',
        eyebrow: 'Route inspection',
        title: 'Follow the|infrastructure line.',
        body: 'Inspect power lines and assets across multiple locations during one flight.',
        state: 'Following the route',
        image: '/images/landing/transmission-tower.jpg',
        position: 'center 45%',
      },
      {
        id: 'mission-site',
        eyebrow: 'Site inspection',
        title: 'Review the site|from a safe distance.',
        body: 'The crew records active worksites and flags areas that need attention.',
        state: 'Inspecting the site',
        image: '/images/landing/construction-1280.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-urban',
        eyebrow: 'Hard-to-reach areas',
        title: 'Reach the places|crews cannot.',
        body: 'Record elevated structures and difficult areas without sending people into harm’s way.',
        state: 'Checking elevated assets',
        image: '/images/landing/infrastructure-1280.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-results',
        eyebrow: 'Result review',
        title: 'Media and checklist|in one record.',
        body: 'Evidence and assessments are gathered for review before customer handoff.',
        state: 'Sending results',
        image: '/images/landing/landscape-1280.webp',
        position: 'center 54%',
      },
      {
        id: 'mission-return',
        eyebrow: 'Return and handoff',
        title: 'Land safely.|Ready for the next flight.',
        body: 'The drone lands safely. Results are sent for review and handoff.',
        state: 'Mission ready for handoff',
        image: '/images/landing/rail-yard.jpg',
        position: 'center 48%',
      },
    ],
  },
}

type FlightMissionExperienceProps = {
  lang: string
  createRequestTarget: string
  heroChip: string
  heroTitleLines: string[]
  heroLede: string
  createRequestCta: string
  seeHowItWorks: string
}

export function FlightMissionExperience({
  lang,
  createRequestTarget,
  heroChip,
  heroTitleLines,
  heroLede,
  createRequestCta,
  seeHowItWorks,
}: FlightMissionExperienceProps) {
  const journeyRef = useRef<HTMLElement>(null)
  const droneRef = useRef<HTMLDivElement>(null)
  const droneFollowRef = useRef<HTMLDivElement>(null)
  const routeRef = useRef<SVGPathElement>(null)
  const [activeChapter, setActiveChapter] = useState(0)
  const english = lang === 'en'
  const copy = copyByLanguage[english ? 'en' : 'vi']

  useGSAP(
    () => {
      const root = journeyRef.current
      const drone = droneRef.current
      const scene = root?.querySelector<HTMLElement>('.lp-flight-scene-stage')
      if (!root || !drone || !scene) return

      root
        .querySelectorAll<HTMLElement>('.lp-journey-chapter')
        .forEach((chapter, index) => {
          ScrollTrigger.create({
            trigger: chapter,
            start: 'top 62%',
            end: 'bottom 38%',
            onEnter: () => setActiveChapter(index),
            onEnterBack: () => setActiveChapter(index),
          })
        })

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
        return

      const mm = gsap.matchMedia()
      mm.add(
        {
          desktop: '(min-width: 701px)',
          mobile: '(max-width: 700px)',
        },
        (context) => {
          const conditions = context.conditions as {
            desktop: boolean
            mobile: boolean
          }
          const mobile = conditions.mobile
          const path = routeRef.current
          gsap.set(scene, {
            transformOrigin: mobile ? '58% 38%' : '64% 53%',
          })
          if (path) {
            const length = path.getTotalLength()
            gsap.set(path, {
              strokeDasharray: length,
              strokeDashoffset: length,
            })
          }

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          })

          timeline
            .to(
              scene,
              {
                rotationY: mobile ? 1.2 : 3,
                rotationX: mobile ? -0.6 : -1.2,
                scale: mobile ? 1.025 : 1.045,
                duration: 0.22,
                ease: 'none',
              },
              0.08,
            )
            .to(
              scene,
              {
                rotationY: mobile ? -1.5 : -4,
                rotationX: mobile ? 0.8 : 1.8,
                scale: mobile ? 0.98 : 0.955,
                x: mobile ? -4 : 18,
                duration: 0.4,
                ease: 'none',
              },
              0.38,
            )
            .to(
              scene,
              {
                rotationY: 0,
                rotationX: 0,
                scale: 1,
                x: 0,
                duration: 0.2,
                ease: 'none',
              },
              0.78,
            )
            .to(
              drone,
              {
                x: mobile ? 36 : 118,
                y: mobile ? -24 : -64,
                z: mobile ? 80 : 180,
                rotationY: 24,
                rotationZ: -9,
                scale: mobile ? 0.84 : 0.88,
                duration: 0.13,
                ease: 'none',
              },
              0.08,
            )
            .to(
              drone,
              {
                x: mobile ? -54 : -165,
                y: mobile ? -46 : -118,
                z: mobile ? 160 : 260,
                rotationY: -28,
                rotationZ: 12,
                scale: mobile ? 0.74 : 0.72,
                duration: 0.14,
                ease: 'none',
              },
              0.24,
            )
            .to(
              drone,
              {
                x: mobile ? 42 : 142,
                y: mobile ? 52 : 74,
                z: mobile ? 220 : 330,
                rotationY: 33,
                rotationZ: -14,
                scale: mobile ? 0.66 : 0.67,
                duration: 0.14,
                ease: 'none',
              },
              0.41,
            )
            .to(
              drone,
              {
                x: mobile ? -44 : -132,
                y: mobile ? -26 : -50,
                z: mobile ? 270 : 420,
                rotationY: -20,
                rotationZ: 8,
                scale: mobile ? 0.62 : 0.6,
                duration: 0.14,
                ease: 'none',
              },
              0.58,
            )
            .to(
              drone,
              {
                x: mobile ? 28 : 94,
                y: mobile ? -48 : -82,
                z: mobile ? 180 : 280,
                rotationY: 20,
                rotationZ: -6,
                scale: mobile ? 0.76 : 0.76,
                duration: 0.14,
                ease: 'none',
              },
              0.75,
            )
            .to(
              drone,
              {
                x: 0,
                y: 0,
                z: 0,
                rotationY: -10,
                rotationZ: 0,
                scale: mobile ? 0.9 : 0.95,
                duration: 0.1,
                ease: 'power1.inOut',
              },
              0.9,
            )
          if (path) {
            timeline.to(
              path,
              { strokeDashoffset: 0, duration: 0.72, ease: 'none' },
              0.12,
            )
          }

          return () => timeline.scrollTrigger?.kill()
        },
      )

      return () => mm.revert()
    },
    { scope: journeyRef },
  )

  const pointerFollowEnabled = activeChapter >= 2

  useEffect(() => {
    if (
      !pointerFollowEnabled ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const scene = journeyRef.current?.querySelector<HTMLElement>(
      '.lp-flight-scene-stage',
    )
    const drone = droneFollowRef.current
    if (!scene || !drone) return

    const followX = gsap.quickTo(drone, 'x', {
      duration: 0.5,
      ease: 'power3.out',
    })
    const followY = gsap.quickTo(drone, 'y', {
      duration: 0.5,
      ease: 'power3.out',
    })
    const tiltX = gsap.quickTo(drone, 'rotationX', {
      duration: 0.55,
      ease: 'power2.out',
    })
    const tiltY = gsap.quickTo(drone, 'rotationY', {
      duration: 0.55,
      ease: 'power2.out',
    })
    const bank = gsap.quickTo(drone, 'rotationZ', {
      duration: 0.65,
      ease: 'power2.out',
    })

    const resetFollow = () => {
      followX(0)
      followY(0)
      tiltX(0)
      tiltY(0)
      bank(0)
    }

    const followPointer = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        resetFollow()
        return
      }

      const rect = scene.getBoundingClientRect()
      if (!rect.width || !rect.height) return

      const pointerX = gsap.utils.clamp(
        0,
        1,
        (event.clientX - rect.left) / rect.width,
      )
      const pointerY = gsap.utils.clamp(
        0,
        1,
        (event.clientY - rect.top) / rect.height,
      )
      const horizontal = pointerX - 0.5
      const vertical = pointerY - 0.5

      followX(
        gsap.utils.clamp(
          -rect.width * 0.24,
          rect.width * 0.24,
          horizontal * rect.width * 0.54,
        ),
      )
      followY(
        gsap.utils.clamp(
          -rect.height * 0.2,
          rect.height * 0.2,
          vertical * rect.height * 0.48,
        ),
      )
      tiltX(gsap.utils.clamp(-11, 11, -vertical * 22))
      tiltY(gsap.utils.clamp(-16, 16, horizontal * 32))
      bank(gsap.utils.clamp(-8, 8, horizontal * 16))
    }

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) resetFollow()
    }

    window.addEventListener('pointermove', followPointer, { passive: true })
    window.addEventListener('pointerout', handlePointerOut)
    window.addEventListener('blur', resetFollow)

    return () => {
      window.removeEventListener('pointermove', followPointer)
      window.removeEventListener('pointerout', handlePointerOut)
      window.removeEventListener('blur', resetFollow)
      followX.tween.kill()
      followY.tween.kill()
      tiltX.tween.kill()
      tiltY.tween.kill()
      bank.tween.kill()
      gsap.set(drone, { clearProps: 'transform' })
    }
  }, [pointerFollowEnabled])

  const activeImage = copy.chapters[activeChapter]?.image

  return (
    <section
      className="lp-scroll-journey"
      id="how-it-works"
      ref={journeyRef}
      data-testid="flight-mission-experience"
      data-active-chapter={activeChapter}
      data-drone-visible={pointerFollowEnabled}
      aria-label={
        english ? 'Drone mission journey' : 'Hành trình nhiệm vụ drone'
      }
    >
      <div className="lp-journey-stage" aria-hidden="true">
        <div className="lp-journey-backdrops">
          {copy.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`lp-journey-backdrop${chapter.image === activeImage ? ' is-active' : ''}`}
              aria-hidden="true"
            >
              <img
                src={chapter.image}
                alt=""
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                width="1920"
                height="1080"
                style={{ objectPosition: chapter.position }}
              />
            </div>
          ))}
        </div>

        <div className="lp-flight-scene-stage">
          <svg
            className="lp-flight-route"
            viewBox="0 0 1000 620"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              ref={routeRef}
              d="M620 340 C750 165 835 190 750 320 C650 480 420 430 350 275 C300 165 475 125 590 245 C685 345 490 480 375 395 C260 315 470 240 620 340"
            />
          </svg>
          <div className="lp-flight-drone" ref={droneRef}>
            <div className="lp-flight-drone-follow" ref={droneFollowRef}>
              <Lottie
                src={droneAnimation}
                autoplay={
                  !window.matchMedia?.('(prefers-reduced-motion: reduce)')
                    .matches
                }
                loop={
                  !window.matchMedia?.('(prefers-reduced-motion: reduce)')
                    .matches
                }
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="lp-journey-atmosphere" />
        <div className="lp-journey-status">
          <span className="lp-journey-status-light" />
          <span>
            {
              copyByLanguage[english ? 'en' : 'vi'].chapters[activeChapter]
                ?.state
            }
          </span>
        </div>
        <div className="lp-journey-progress">
          {copy.chapters.map((chapter, index) => (
            <span
              key={chapter.id}
              className={index === activeChapter ? 'is-active' : ''}
            />
          ))}
        </div>
      </div>

      <div className="lp-journey-chapters">
        {copy.chapters.map((chapter, index) => {
          const titleParts = chapter.title.split('|')
          return (
            <article
              className={`lp-journey-chapter${index === 0 ? ' lp-journey-chapter--intro' : ''}${index === copy.chapters.length - 1 ? ' lp-journey-chapter--final' : ''}`}
              id={chapter.id}
              key={chapter.id}
              aria-labelledby={`lp-journey-title-${index}`}
              aria-current={index === activeChapter ? 'step' : undefined}
            >
              <div className="lp-journey-copy">
                {index === 0 ? (
                  <>
                    <p className="lp-journey-kicker">
                      <span className="lp-journey-kicker-dot" />
                      {heroChip}
                    </p>
                    <h1 id={`lp-journey-title-${index}`}>
                      <span>{heroTitleLines[0]}</span>{' '}
                      <span>{heroTitleLines[1]}</span>
                    </h1>
                    <p className="lp-journey-lede">{heroLede}</p>
                    <a className="lp-journey-scroll-cue" href="#mission-deploy">
                      <span>{seeHowItWorks}</span>
                      <Icon name="arrow-down" />
                    </a>
                  </>
                ) : (
                  <>
                    <p className="lp-journey-kicker">
                      <span className="lp-journey-kicker-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {chapter.eyebrow}
                    </p>
                    <h2
                      id={`lp-journey-title-${index}`}
                      aria-label={chapter.title.replace('|', ' ')}
                    >
                      {titleParts.map((part, partIndex) => (
                        <span key={`${chapter.id}-${partIndex}`}>{part}</span>
                      ))}
                    </h2>
                    <p className="lp-journey-lede">{chapter.body}</p>
                    {index === copy.chapters.length - 1 && (
                      <a className="lp-journey-cta" href={createRequestTarget}>
                        {createRequestCta}
                        <Icon name="arrow-right" />
                      </a>
                    )}
                  </>
                )}
              </div>
              <span className="lp-journey-chapter-index" aria-hidden="true">
                0{index + 1} / 0{copy.chapters.length}
              </span>
            </article>
          )
        })}
      </div>
      <p className="lp-sr-only" role="status" aria-live="polite">
        {copy.chapters[activeChapter]?.state}
      </p>
      <span className="lp-sr-only">{copy.stateLabel}</span>
    </section>
  )
}
