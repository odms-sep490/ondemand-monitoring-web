import { useEffect, useRef, useState } from 'react'
import { Lottie } from 'lottie-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

import droneAnimation from '../assets/drone-animation.json'
import { CinematicDroneSequence } from './CinematicDroneSequence'
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
  disclosure: string
  chapters: Chapter[]
}

const copyByLanguage: Record<'vi' | 'en', Copy> = {
  vi: {
    stateLabel: 'Tình trạng nhiệm vụ',
    disclosure:
      'Hành trình và trạng thái chỉ mang tính minh họa; hình ảnh có thể thuộc các địa điểm khác nhau.',
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
        id: 'mission-facility-detail',
        eyebrow: 'Rà soát khu vực xa',
        title: 'Mở rộng vùng|quan sát hiện trường.',
        body: 'Drone tiếp cận khu vực địa hình xa để bổ sung góc nhìn cho hồ sơ khảo sát.',
        state: 'Đang rà soát khu vực xa',
        image: '/images/landing/highland-overview.webp',
        position: 'center 46%',
      },
      {
        id: 'mission-solar-pass',
        eyebrow: 'Khảo sát bổ sung',
        title: 'Gom thêm góc nhìn|toàn khu vực.',
        body: 'Một lượt bay rộng giúp đối chiếu các điểm đã ghi nhận trong cùng hành trình.',
        state: 'Đang mở rộng khảo sát',
        image: '/images/landing/landscape-1280.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-overview',
        eyebrow: 'Kiểm tra trang trại gió',
        title: 'Theo từng turbine|trên dải gió.',
        body: 'Drone rà soát các turbine và tuyến tiếp cận trên khu vực rộng.',
        state: 'Đang kiểm tra turbine gió',
        image: '/images/landing/wind-farm.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-site-pass',
        eyebrow: 'Kiểm tra cầu',
        title: 'Theo dõi nhịp cầu|từ đầu đến cuối.',
        body: 'Drone rà soát mặt cầu và các nhịp kết cấu để ghi nhận điểm cần bảo trì.',
        state: 'Đang kiểm tra cầu',
        image: '/images/landing/bridge-inspection.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-network-route',
        eyebrow: 'Theo tuyến hạ tầng',
        title: 'Bám dọc hành lang|đường ống dài.',
        body: 'Drone theo tuyến ống và đường dịch vụ để kiểm tra liên tục qua nhiều vị trí.',
        state: 'Đang kiểm tra đường ống',
        image: '/images/landing/pipeline-corridor.webp',
        position: 'center 48%',
      },
      {
        id: 'mission-remote-area',
        eyebrow: 'Kiểm tra đập và hồ chứa',
        title: 'Rà soát thân đập|và tuyến tràn.',
        body: 'Ghi nhận thân đập, cửa xả và lối tiếp cận quanh hồ chứa.',
        state: 'Đang kiểm tra công trình thủy điện',
        image: '/images/landing/hydroelectric-dam.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-final-sweep',
        eyebrow: 'Lượt quét cuối',
        title: 'Rà soát tầng khai thác|và đường nội bộ.',
        body: 'Đội bay kiểm tra các tầng mỏ và tuyến vận hành trước khi kết thúc khảo sát.',
        state: 'Đang rà soát khu mỏ',
        image: '/images/landing/open-pit-quarry.webp',
        position: 'center 55%',
      },
      {
        id: 'mission-return-route',
        eyebrow: 'Rời khu công nghiệp',
        title: 'Khép tuyến kiểm tra|tại cảng hàng hóa.',
        body: 'Drone hoàn tất lượt ghi hình tại cầu cảng và chuyển sang tuyến trở về.',
        state: 'Đang hoàn tất kiểm tra cảng',
        image: '/images/landing/industrial-port.webp',
        position: 'center 48%',
      },
      {
        id: 'mission-results',
        eyebrow: 'Đối chiếu kết quả',
        title: 'Đối chiếu từng đoạn|kè ven biển.',
        body: 'Ảnh và checklist được rà soát theo từng đoạn đê chắn sóng trước khi bàn giao.',
        state: 'Đang đối chiếu kết quả',
        image: '/images/landing/coastal-flood-barrier.webp',
        position: 'center 54%',
      },
      {
        id: 'mission-return',
        eyebrow: 'Trở về và bàn giao',
        title: 'Hạ cánh an toàn.|Sẵn sàng cho lần bay tiếp.',
        body: 'Drone hạ cánh an toàn. Kết quả được gửi để đội ngũ tiếp tục rà soát và bàn giao.',
        state: 'Nhiệm vụ sẵn sàng bàn giao',
        image: '/images/landing/landing-apron.webp',
        position: 'center 48%',
      },
    ],
  },
  en: {
    stateLabel: 'Mission status',
    disclosure:
      'Illustrative journey and status. Images may show different locations.',
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
        id: 'mission-facility-detail',
        eyebrow: 'Remote area review',
        title: 'Expand the view|across remote terrain.',
        body: 'The drone reaches a remote landscape to add context to the inspection record.',
        state: 'Reviewing a remote area',
        image: '/images/landing/highland-overview.webp',
        position: 'center 46%',
      },
      {
        id: 'mission-solar-pass',
        eyebrow: 'Additional survey',
        title: 'Capture another view|of the full area.',
        body: 'A broad pass adds context for comparing the locations already recorded.',
        state: 'Expanding the survey',
        image: '/images/landing/landscape-1280.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-overview',
        eyebrow: 'Wind farm inspection',
        title: 'Trace each turbine|across the ridge.',
        body: 'The drone reviews the turbines and access lanes across the wide site.',
        state: 'Inspecting wind turbines',
        image: '/images/landing/wind-farm.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-site-pass',
        eyebrow: 'Bridge inspection',
        title: 'Trace the bridge|from end to end.',
        body: 'The drone reviews the deck and structural spans to flag maintenance points.',
        state: 'Inspecting the bridge',
        image: '/images/landing/bridge-inspection.webp',
        position: 'center 50%',
      },
      {
        id: 'mission-network-route',
        eyebrow: 'Infrastructure route',
        title: 'Track the long|pipeline corridor.',
        body: 'The drone follows the pipeline and service road to inspect multiple locations.',
        state: 'Inspecting the pipeline',
        image: '/images/landing/pipeline-corridor.webp',
        position: 'center 48%',
      },
      {
        id: 'mission-remote-area',
        eyebrow: 'Dam and reservoir review',
        title: 'Inspect the dam|and spillway route.',
        body: 'Record the dam face, spillway, and access points around the reservoir.',
        state: 'Inspecting the hydro facility',
        image: '/images/landing/hydroelectric-dam.webp',
        position: 'center 52%',
      },
      {
        id: 'mission-final-sweep',
        eyebrow: 'Final survey pass',
        title: 'Review the quarry|benches and access roads.',
        body: 'The crew checks the working levels and internal roads before the survey ends.',
        state: 'Reviewing the quarry',
        image: '/images/landing/open-pit-quarry.webp',
        position: 'center 55%',
      },
      {
        id: 'mission-return-route',
        eyebrow: 'Industrial port',
        title: 'Close the port survey|before returning.',
        body: 'The drone completes its dockside pass and starts the route back to base.',
        state: 'Wrapping up the port review',
        image: '/images/landing/industrial-port.webp',
        position: 'center 48%',
      },
      {
        id: 'mission-results',
        eyebrow: 'Result review',
        title: 'Review each section|of the coastal barrier.',
        body: 'Photos and checklist items are reviewed by seawall section before handoff.',
        state: 'Cross-checking results',
        image: '/images/landing/coastal-flood-barrier.webp',
        position: 'center 54%',
      },
      {
        id: 'mission-return',
        eyebrow: 'Return and handoff',
        title: 'Land safely.|Ready for the next flight.',
        body: 'The drone lands safely. Results are sent for review and handoff.',
        state: 'Mission ready for handoff',
        image: '/images/landing/landing-apron.webp',
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
  const cinematicVideoRef = useRef<HTMLVideoElement | null>(null)
  const flightProgressRef = useRef(0)
  const [activeChapter, setActiveChapter] = useState(0)
  const [cinematicReady, setCinematicReady] = useState(false)
  const english = lang === 'en'
  const copy = copyByLanguage[english ? 'en' : 'vi']

  const syncCinematicVideo = (progress: number) => {
    flightProgressRef.current = progress
    const video = cinematicVideoRef.current
    if (!video || video.readyState < 2 || !Number.isFinite(video.duration)) return

    const time = Math.min(
      progress * video.duration,
      Math.max(0, video.duration - 1 / 24),
    )
    if (Math.abs(video.currentTime - time) > 0.015) video.currentTime = time
  }

  const handleCinematicReady = (ready: boolean) => {
    setCinematicReady(ready)
    if (ready) syncCinematicVideo(flightProgressRef.current)
  }

  useGSAP(
    () => {
      const root = journeyRef.current
      const drone = droneRef.current
      const scene = root?.querySelector<HTMLElement>('.lp-flight-scene-stage')
      if (!root || !drone || !scene) return

      const path = routeRef.current
      const reducedMotion = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches
      const mobile = window.matchMedia?.('(max-width: 700px)').matches ?? false
      const pathLength = path?.getTotalLength() ?? 0

      const positionDrone = (progress: number) => {
        if (!path || !pathLength) return
        const svg = path.ownerSVGElement
        const viewBox = svg?.viewBox.baseVal
        const svgBounds = svg?.getBoundingClientRect()
        if (
          !svg ||
          !viewBox?.width ||
          !viewBox.height ||
          !svgBounds?.width ||
          !svgBounds.height
        ) {
          return
        }

        const point = path.getPointAtLength(
          pathLength * gsap.utils.clamp(0, 1, progress),
        )
        const stageBounds = scene.getBoundingClientRect()

        gsap.set(drone, {
          x:
            svgBounds.left +
            ((point.x - viewBox.x) / viewBox.width) * svgBounds.width -
            stageBounds.left,
          y:
            svgBounds.top +
            ((point.y - viewBox.y) / viewBox.height) * svgBounds.height -
            stageBounds.top,
        })
      }

      const updateFlight = (progress: number) => {
        positionDrone(progress)
        syncCinematicVideo(progress)
      }

      if (path) {
        gsap.set(path, {
          strokeDasharray: pathLength,
          strokeDashoffset: reducedMotion ? 0 : pathLength,
        })
        updateFlight(0)
      }
      if (reducedMotion) updateFlight(1 / copy.chapters.length)

      root
        .querySelectorAll<HTMLElement>('.lp-journey-chapter')
        .forEach((chapter, index) => {
          ScrollTrigger.create({
            trigger: chapter,
            start: mobile ? 'top 60%' : 'top 62%',
            end: mobile ? 'bottom 60%' : 'bottom 85%',
            onEnter: () => {
              setActiveChapter(index)
              if (reducedMotion)
                updateFlight((index + 1) / copy.chapters.length)
            },
            onEnterBack: () => {
              setActiveChapter(index)
              if (reducedMotion)
                updateFlight((index + 1) / copy.chapters.length)
            },
          })
        })

      if (reducedMotion || !path) return

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.7,
          invalidateOnRefresh: true,
        },
      })

      timeline.to(
        path,
        {
          strokeDashoffset: 0,
          duration: 1,
          ease: 'none',
          onUpdate: () => {
            const offset = Number(gsap.getProperty(path, 'strokeDashoffset'))
            const progress = 1 - gsap.utils.clamp(0, pathLength, offset) / pathLength
            updateFlight(progress)
          },
        },
        0,
      )

      return () => timeline.scrollTrigger?.kill()
    },
    { scope: journeyRef },
  )

  const pointerFollowEnabled = activeChapter >= 2

  useEffect(() => {
    if (
      !pointerFollowEnabled ||
      window.matchMedia?.('(max-width: 700px)').matches ||
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

  return (
    <section
      className="lp-scroll-journey"
      id="how-it-works"
      ref={journeyRef}
      data-testid="flight-mission-experience"
      data-active-chapter={activeChapter}
      aria-label={
        english ? 'Drone mission journey' : 'Hành trình nhiệm vụ drone'
      }
    >
      <div
        className={`lp-journey-stage${cinematicReady ? ' has-cinematic-video' : ''}`}
        aria-hidden="true"
      >
        <div className="lp-journey-backdrops">
          {copy.chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`lp-journey-backdrop${index === activeChapter ? ' is-active' : ''}`}
              aria-hidden="true"
            >
              <img
                src={chapter.image}
                alt=""
                loading={index < 2 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                width="1920"
                height="1080"
                style={{ objectPosition: chapter.position }}
              />
            </div>
          ))}
        </div>

        <CinematicDroneSequence
          videoRef={cinematicVideoRef}
          onReady={handleCinematicReady}
        />

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
        <div className="lp-journey-chapter-index">
          {String(activeChapter + 1).padStart(2, '0')} /{' '}
          {String(copy.chapters.length).padStart(2, '0')}
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
                    <p className="lp-journey-disclosure">{copy.disclosure}</p>
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
                    {index === 1 && (
                      <p className="lp-journey-attribution">
                        {english ? 'Image credit: ' : 'Ảnh: '}
                        <a
                          href="https://commons.wikimedia.org/w/index.php?curid=130663927"
                          target="_blank"
                          rel="noreferrer"
                          tabIndex={activeChapter === index ? 0 : -1}
                        >
                          “Giant Magellan Telescope Construction Site” —
                          NOIRLab/NSF/AURA, CC BY 4.0
                        </a>
                      </p>
                    )}
                    {index === copy.chapters.length - 1 && (
                      <a className="lp-journey-cta" href={createRequestTarget}>
                        {createRequestCta}
                        <Icon name="arrow-right" />
                      </a>
                    )}
                  </>
                )}
              </div>
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
