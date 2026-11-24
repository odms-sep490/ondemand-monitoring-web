import { motion, type TargetAndTransition } from 'motion/react'
import { useId } from 'react'
import { AI_MOTION } from './aiMotionTokens'
import type {
  AIMascotPointDirection,
  AIMascotState,
  AIRobotExpression,
  AIRobotGesture,
  RobotGazeVector,
  RobotIdleAction,
} from './AIRobotAnimationController'

type Props = {
  state: AIMascotState
  expression: AIRobotExpression
  gesture: AIRobotGesture
  idleAction?: RobotIdleAction
  gaze?: RobotGazeVector
  pointDirection?: AIMascotPointDirection
  audioLevel?: number
  mouthOpen?: number
  blinking?: boolean
  shouldAnimate: boolean
  portalSpin?: boolean
  pointerSparkle?: boolean
}

/**
 * Faithful 2.5D articulated SVG character rig matching the white-and-blue glossy OnDemand mascot.
 * Independently animates antenna (delayed wobble), head, eyes (tracking + blink + 7 expressions),
 * reactive mouth, left/right arms, floating body, thruster glow, cyan orbit rings, and sparkles.
 */
export function RobotCharacterRig({
  state,
  expression,
  gesture,
  idleAction = 'none',
  gaze = { x: 0, y: 0 },
  pointDirection = 'down',
  audioLevel = 0,
  mouthOpen = 0,
  blinking = false,
  shouldAnimate,
  portalSpin = false,
  pointerSparkle = false,
}: Props) {
  const uid = useId().replace(/:/g, '')

  const eyeShiftX = Math.max(-5, Math.min(5, gaze.x * 4.5))
  const eyeShiftY = Math.max(-3.2, Math.min(3.2, gaze.y * 3))
  const headLeanRotate = Math.max(-8, Math.min(8, gaze.x * 6))

  // Secondary physics: body float & reaction
  const bodyAnim: TargetAndTransition = !shouldAnimate
    ? { y: 0, rotate: 0, scale: 1 }
    : portalSpin
      ? {
          y: [18, -8, 0],
          rotate: [0, 360],
          scale: [0.68, 1.08, 1],
          transition: { duration: 0.68, ease: AI_MOTION.ease.cinematic },
        }
      : state === 'welcome'
        ? {
            y: [10, -7, 0, -3, 0],
            rotate: [0, -5, 4, -2, 0],
            scale: [0.92, 1.06, 1],
            transition: { duration: 0.95, ease: AI_MOTION.ease.out },
          }
        : state === 'goodbye'
          ? {
              y: [0, -4, 6],
              rotate: [0, 5, -3, 0],
              scale: [1, 1.02, 0.94],
              transition: { duration: 0.55, ease: AI_MOTION.ease.inOut },
            }
          : state === 'success'
            ? {
                y: [0, -9, 0, -4, 0],
                scale: [1, 1.07, 0.98, 1.03, 1],
                transition: { duration: 0.8, ease: AI_MOTION.ease.out },
              }
            : state === 'confirming'
              ? {
                  y: [0, -5, 0],
                  scale: [1, 1.04, 1],
                  transition: { duration: 0.52, ease: AI_MOTION.ease.out },
                }
              : state === 'listening'
                ? {
                    y: [0, -3, 0],
                    scale: [1.02, 1.04, 1.02],
                    transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
                  }
                : state === 'thinking'
                  ? {
                      y: [0, -4, 0],
                      rotate: [-2.5, 2.5, -2.5],
                      transition: { duration: 2.1, ease: 'easeInOut', repeat: Infinity },
                    }
                  : state === 'speaking'
                    ? {
                        y: [0, -2.5 - audioLevel * 3, 0],
                        scale: 1 + audioLevel * 0.025,
                        transition: { duration: 0.35, ease: 'easeOut' },
                      }
                    : state === 'error'
                      ? {
                          x: [0, -3, 3, -2, 0],
                          transition: { duration: 0.45, ease: 'easeInOut' },
                        }
                      : idleAction === 'hover_adjust'
                        ? {
                            y: [0, -7, -2, -5, 0],
                            rotate: [0, -3, 3, 0],
                            transition: { duration: 1.4, ease: 'easeInOut' },
                          }
                        : {
                            y: [0, -5, 0, -2.5, 0],
                            rotate: [0, -1, 0, 1, 0],
                            transition: { duration: 4.4, ease: 'easeInOut', repeat: Infinity },
                          }

  // Independent head motion (tilt, nod, curious lean, pointer turn)
  const headAnim: TargetAndTransition = !shouldAnimate
    ? { rotate: 0, y: 0 }
    : gesture === 'nod'
      ? {
          rotate: [0, 3, -2, 0],
          y: [0, 4, -1, 3, 0],
          transition: { duration: 0.58, ease: 'easeInOut' },
        }
      : gesture === 'head_tilt' || state === 'thinking'
        ? {
            rotate: [0, -9, -6, -9, 0],
            y: [0, -1, 0],
            transition: { duration: 1.9, ease: 'easeInOut', repeat: state === 'thinking' ? Infinity : 0 },
          }
        : state === 'listening'
          ? {
              rotate: 4 + headLeanRotate * 0.5,
              y: 2,
              transition: AI_MOTION.ease.softSpring,
            }
          : state === 'speaking'
            ? {
                rotate: headLeanRotate * 0.5 + (audioLevel > 0.25 ? 2.5 : -1.5),
                y: -audioLevel * 1.8,
                transition: { duration: 0.22, ease: 'easeOut' },
              }
            : {
                rotate: headLeanRotate + (gesture === 'wave' ? -4 : 0),
                y: gaze.y * 1.5,
                transition: AI_MOTION.ease.softSpring,
              }

  // Delayed secondary physics for antenna wobble
  const antennaAnim: TargetAndTransition = !shouldAnimate
    ? { rotate: 0 }
    : gesture === 'wave' || state === 'welcome' || state === 'goodbye'
      ? {
          rotate: [0, 14, -12, 9, -5, 0],
          transition: { duration: 0.95, delay: 0.08, ease: 'easeInOut' },
        }
      : state === 'success'
        ? {
            rotate: [0, -16, 15, -10, 6, 0],
            transition: { duration: 0.85, delay: 0.06, ease: 'easeInOut' },
          }
        : state === 'thinking' || state === 'listening'
          ? {
              rotate: [-6, 6, -6],
              transition: { duration: 1.5, ease: 'easeInOut', repeat: Infinity },
            }
          : {
              rotate: headLeanRotate * 1.35,
              transition: AI_MOTION.ease.antennaSpring,
            }

  // Viewer's-left arm (robot's primary waving arm matching original mascot)
  const leftArmAnim: TargetAndTransition = !shouldAnimate
    ? { rotate: 0, y: 0 }
    : gesture === 'wave'
      ? {
          rotate: [-16, 18, -14, 16, -8, 0],
          y: [-3, -5, -3, -5, -2, 0],
          transition: { duration: 0.95, ease: 'easeInOut', repeat: state === 'welcome' ? 1 : 0 },
        }
      : gesture === 'celebrate'
        ? {
            rotate: [-22, -32, -18, -28, -20],
            y: [-6, -9, -5, -8, -6],
            transition: { duration: 0.78, ease: 'easeInOut' },
          }
        : gesture === 'open_hands' || state === 'speaking'
          ? {
              rotate: [-6 - audioLevel * 12, 4, -8 - audioLevel * 10],
              y: [-2, 1, -2],
              transition: { duration: 0.85, ease: 'easeInOut', repeat: Infinity },
            }
          : gesture === 'point_left'
            ? {
                rotate: [0, 26, 20, 24],
                y: [0, -4, -3, -4],
                transition: { duration: 0.75, ease: AI_MOTION.ease.out },
              }
            : gesture === 'hand_flourish'
              ? {
                  rotate: [0, -24, 10, -14, 0],
                  y: [0, -6, -2, -4, 0],
                  transition: { duration: 0.75, ease: 'easeInOut' },
                }
              : {
                  rotate: [0, -3, 0, 2, 0],
                  y: [0, -1.5, 0],
                  transition: { duration: 4.2, ease: 'easeInOut', repeat: Infinity },
                }

  // Viewer's-right arm (stabilizing / pointing right / celebrating / inspecting holo hand)
  const rightArmAnim: TargetAndTransition = !shouldAnimate
    ? { rotate: 0, y: 0 }
    : gesture === 'celebrate'
      ? {
          rotate: [22, 34, 20, 30, 22],
          y: [-6, -9, -5, -8, -6],
          transition: { duration: 0.78, ease: 'easeInOut' },
        }
      : gesture === 'open_hands' || state === 'speaking'
        ? {
            rotate: [6 + audioLevel * 10, -4, 8 + audioLevel * 10],
            y: [-1, 2, -1],
            transition: { duration: 0.92, ease: 'easeInOut', repeat: Infinity },
          }
        : gesture === 'point_right' || gesture === 'present_card'
          ? {
              rotate: pointDirection === 'right' ? [0, -30, -24, -28] : [0, -16, -12, -14],
              y: [0, -4, -2, -3],
              transition: { duration: 0.75, ease: AI_MOTION.ease.out },
            }
          : gesture === 'inspect_holo'
            ? {
                rotate: [0, -26, -22, -26, 0],
                y: [0, -5, -4, -5, 0],
                transition: { duration: 2.0, ease: 'easeInOut' },
              }
            : gesture === 'hand_flourish'
              ? {
                  rotate: [0, 22, -8, 12, 0],
                  y: [0, -5, -1, -3, 0],
                  transition: { duration: 0.75, ease: 'easeInOut' },
                }
              : {
                  rotate: [0, 3, 0, -2, 0],
                  y: [0, -1, 0],
                  transition: { duration: 4.5, ease: 'easeInOut', repeat: Infinity },
                }

  const antennaColor =
    state === 'error'
      ? '#f59e0b'
      : state === 'success' || state === 'confirming'
        ? '#34d399'
        : '#38f2ff'

  const showWaveArcs = gesture === 'wave' || state === 'welcome' || state === 'goodbye'
  const showSparkles =
    state === 'welcome' ||
    state === 'success' ||
    state === 'confirming' ||
    pointerSparkle
  const showHoloCube = gesture === 'inspect_holo' || state === 'thinking'

  // Mouth path adapts to expression and live audioLevel
  const effectiveMouthOpen = state === 'speaking' ? Math.max(0.18, mouthOpen) : 0
  const mouthHeight = 4 + effectiveMouthOpen * 9

  return (
    <svg
      className="ai-robot-rig"
      viewBox="0 0 200 200"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${uid}-shell`} cx="35%" cy="25%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="58%" stopColor="#eef5ff" />
          <stop offset="100%" stopColor="#c9dcf7" />
        </radialGradient>
        <linearGradient id={`${uid}-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="55%" stopColor="#1d5be8" />
          <stop offset="100%" stopColor="#123fb5" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#1e2948" />
          <stop offset="45%" stopColor="#0b132b" />
          <stop offset="100%" stopColor="#091a3d" />
        </linearGradient>
        <radialGradient id={`${uid}-cyan-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#80f8ff" />
          <stop offset="55%" stopColor="#00c4ff" />
          <stop offset="100%" stopColor="#0284c7" />
        </radialGradient>
        <linearGradient id={`${uid}-orbit`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#7dd3fc" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.15" />
        </linearGradient>
        <filter id={`${uid}-soft-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Back half of cyan orbital energy ring */}
      <motion.g
        style={{ transformOrigin: '100px 146px' }}
        animate={
          shouldAnimate
            ? {
                rotate: state === 'thinking' ? [0, 360] : [-4, 4, -4],
                transition:
                  state === 'thinking'
                    ? { duration: 4.5, ease: 'linear', repeat: Infinity }
                    : { duration: 5.5, ease: 'easeInOut', repeat: Infinity },
              }
            : undefined
        }
      >
        <ellipse
          cx="100"
          cy="148"
          rx="66"
          ry="24"
          fill="none"
          stroke={`url(#${uid}-orbit)`}
          strokeWidth="3.5"
          transform="rotate(-11 100 148)"
          opacity="0.7"
        />
      </motion.g>

      {/* Main floating character body */}
      <motion.g style={{ transformOrigin: '100px 112px' }} animate={bodyAnim}>
        {/* Soft hover shadow glow beneath thruster */}
        <ellipse
          cx="100"
          cy="184"
          rx="26"
          ry="6"
          fill="#0ea5e9"
          opacity={state === 'speaking' ? 0.36 + audioLevel * 0.25 : 0.24}
        />

        {/* Viewer's-left arm (primary waving arm) */}
        <motion.g
          data-rig-part="left-arm"
          style={{ transformOrigin: '68px 128px' }}
          animate={leftArmAnim}
        >
          {/* Shoulder cuff */}
          <ellipse cx="64" cy="127" rx="10" ry="12" fill={`url(#${uid}-blue)`} />
          {/* Upper arm + raised forearm */}
          <path
            d="M 62 126 C 48 124, 38 112, 36 96"
            fill="none"
            stroke={`url(#${uid}-shell)`}
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Cyan wrist ring */}
          <path
            d="M 32 97 L 43 94"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Blue glossy hand / waving palm */}
          <g transform="translate(34 86) rotate(-18)">
            <ellipse cx="0" cy="0" rx="11" ry="10" fill={`url(#${uid}-blue)`} />
            <rect x="-10" y="-16" width="4.5" height="12" rx="2.2" fill={`url(#${uid}-blue)`} transform="rotate(-16 -8 -10)" />
            <rect x="-4" y="-19" width="4.5" height="14" rx="2.2" fill={`url(#${uid}-blue)`} transform="rotate(-4 -2 -12)" />
            <rect x="2" y="-18" width="4.5" height="13" rx="2.2" fill={`url(#${uid}-blue)`} transform="rotate(8 4 -11)" />
            <rect x="8" y="-13" width="4.2" height="10" rx="2.1" fill={`url(#${uid}-blue)`} transform="rotate(24 10 -8)" />
          </g>
          {/* Cyan wave motion arcs when waving */}
          {showWaveArcs && (
            <motion.g
              stroke="#0ea5e9"
              strokeWidth="3.2"
              strokeLinecap="round"
              fill="none"
              animate={
                shouldAnimate
                  ? { opacity: [0.35, 1, 0.35], scale: [0.95, 1.08, 0.95] }
                  : { opacity: 0.8 }
              }
              transition={{ duration: 0.7, repeat: Infinity }}
              style={{ transformOrigin: '24px 72px' }}
            >
              <path d="M 16 74 C 18 64, 26 57, 36 55" />
              <path d="M 22 79 C 24 72, 30 67, 37 66" opacity="0.7" />
            </motion.g>
          )}
        </motion.g>

        {/* Viewer's-right arm */}
        <motion.g
          data-rig-part="right-arm"
          style={{ transformOrigin: '132px 128px' }}
          animate={rightArmAnim}
        >
          <ellipse cx="136" cy="127" rx="10" ry="12" fill={`url(#${uid}-blue)`} />
          <path
            d="M 138 128 C 150 132, 154 144, 144 152"
            fill="none"
            stroke={`url(#${uid}-shell)`}
            strokeWidth="15"
            strokeLinecap="round"
          />
          <path
            d="M 140 147 L 149 155"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle cx="138" cy="153" r="10.5" fill={`url(#${uid}-blue)`} />
          <circle cx="135" cy="150" r="3" fill="#60a5fa" opacity="0.45" />

          {/* Tiny holographic data cube when inspecting hand or thinking */}
          {showHoloCube && (
            <motion.g
              transform="translate(154 128)"
              animate={
                shouldAnimate
                  ? { y: [0, -4, 0], opacity: [0.75, 1, 0.75] }
                  : { opacity: 0.9 }
              }
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <polygon
                points="0,-10 10,-4 10,8 0,14 -10,8 -10,-4"
                fill="rgba(56, 189, 248, 0.22)"
                stroke="#38bdf8"
                strokeWidth="1.6"
              />
              <polyline points="-10,-4 0,2 10,-4" fill="none" stroke="#7dd3fc" strokeWidth="1.2" />
              <line x1="0" y1="2" x2="0" y2="14" stroke="#7dd3fc" strokeWidth="1.2" />
            </motion.g>
          )}
        </motion.g>

        {/* Floating egg/teardrop torso */}
        <g data-rig-part="torso">
          {/* Neck ring with cyan glow */}
          <ellipse cx="100" cy="116" rx="18" ry="6" fill="#1e40af" />
          <ellipse cx="100" cy="117" rx="15" ry="3.5" fill="#38bdf8" opacity="0.85" />
          {/* White glossy torso shell */}
          <path
            d="M 68 134 C 68 118, 132 118, 132 134 C 132 162, 118 176, 100 178 C 82 176, 68 162, 68 134 Z"
            fill={`url(#${uid}-shell)`}
            stroke="#c6dcf8"
            strokeWidth="1.2"
          />
          {/* Blue lower hover base */}
          <path
            d="M 75 158 C 85 166, 115 166, 125 158 C 119 172, 110 177, 100 178 C 90 177, 81 172, 75 158 Z"
            fill={`url(#${uid}-blue)`}
          />
          {/* Cyan thruster rim */}
          <path
            d="M 86 174 Q 100 181 114 174"
            fill="none"
            stroke="#38f2ff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          {/* Blue rounded chest badge + white 4-point star */}
          <rect
            x="84"
            y="128"
            width="32"
            height="28"
            rx="9"
            fill={`url(#${uid}-blue)`}
            stroke="#93c5fd"
            strokeWidth="1.2"
          />
          <path
            d="M 100 133 L 103 140 L 110 142 L 103 144 L 100 151 L 97 144 L 90 142 L 97 140 Z"
            fill="#ffffff"
          />
        </g>

        {/* Articulated Head + Visor + Delayed-Wobble Antenna */}
        <motion.g
          data-rig-part="head"
          style={{ transformOrigin: '100px 104px' }}
          animate={headAnim}
        >
          {/* Antenna with delayed spring follow-through */}
          <motion.g
            data-rig-part="antenna"
            style={{ transformOrigin: '100px 44px' }}
            animate={antennaAnim}
          >
            <ellipse cx="100" cy="44" rx="11" ry="4.5" fill={`url(#${uid}-blue)`} />
            <path d="M 97 43 L 99 25 L 104 25 L 104 43 Z" fill={`url(#${uid}-blue)`} />
            <motion.circle
              cx="102"
              cy="20"
              r="9.5"
              fill={antennaColor}
              filter={`url(#${uid}-soft-glow)`}
              animate={
                shouldAnimate && (state === 'listening' || state === 'thinking' || state === 'speaking')
                  ? { scale: [1, 1.18 + audioLevel * 0.15, 1], opacity: [0.88, 1, 0.88] }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: '102px 20px' }}
            />
            <circle cx="99" cy="17" r="3" fill="#ffffff" opacity="0.7" />
          </motion.g>

          {/* Left & Right glowing ear pods */}
          <g>
            <ellipse cx="47" cy="84" rx="8" ry="15" fill={`url(#${uid}-blue)`} stroke="#93c5fd" strokeWidth="1.5" />
            <ellipse cx="46" cy="84" rx="4" ry="10" fill="#38f2ff" opacity="0.75" />
            <ellipse cx="153" cy="84" rx="8" ry="15" fill={`url(#${uid}-blue)`} stroke="#93c5fd" strokeWidth="1.5" />
            <ellipse cx="154" cy="84" rx="4.5" ry="10.5" fill="#1d4ed8" stroke="#38f2ff" strokeWidth="1.8" />
            <path d="M 154 79 L 155.4 83 L 158 84 L 155.4 85 L 154 89 L 152.6 85 L 150 84 L 152.6 83 Z" fill="#e0f9ff" />
          </g>

          {/* White glossy helmet shell */}
          <rect
            x="50"
            y="43"
            width="100"
            height="73"
            rx="36"
            fill={`url(#${uid}-shell)`}
            stroke="#c6dcf8"
            strokeWidth="1.4"
          />
          {/* Top glossy specular reflection */}
          <ellipse cx="86" cy="52" rx="22" ry="6" fill="#ffffff" opacity="0.82" />

          {/* Dark glossy visor bezel & screen */}
          <rect
            x="60"
            y="55"
            width="80"
            height="51"
            rx="22"
            fill={`url(#${uid}-visor)`}
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Subtle glass reflection streak */}
          <path
            d="M 68 62 Q 86 58 104 61"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.22"
          />

          {/* Tracked Eyes + Blink + Expressions */}
          <motion.g
            data-rig-part="eyes"
            animate={{ x: eyeShiftX, y: eyeShiftY }}
            transition={AI_MOTION.ease.softSpring}
          >
            {/* Cheek blush dashes */}
            <g stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
              <line x1="70" y1="88" x2="73" y2="85" />
              <line x1="74" y1="89" x2="77" y2="86" />
              <line x1="123" y1="86" x2="126" y2="89" />
              <line x1="127" y1="85" x2="130" y2="88" />
            </g>

            {blinking ? (
              <g stroke="#5ceeff" strokeWidth="3.8" strokeLinecap="round" filter={`url(#${uid}-soft-glow)`}>
                <line x1="76" y1="77" x2="91" y2="77" />
                <line x1="109" y1="77" x2="124" y2="77" />
              </g>
            ) : expression === 'happy' || expression === 'excited' || expression === 'encouraging' ? (
              <g
                fill="none"
                stroke="#5ceeff"
                strokeWidth="4.4"
                strokeLinecap="round"
                filter={`url(#${uid}-soft-glow)`}
              >
                <path d="M 76 80 Q 83.5 68 91 80" />
                <path d="M 109 80 Q 116.5 68 124 80" />
              </g>
            ) : expression === 'curious' ? (
              <g filter={`url(#${uid}-soft-glow)`}>
                <circle cx="83.5" cy="76" r="6.2" fill="#5ceeff" />
                <circle cx="85.5" cy="74" r="2.2" fill="#ffffff" />
                <ellipse cx="116.5" cy="74" rx="6.6" ry="7.6" fill="#5ceeff" />
                <circle cx="118.5" cy="72" r="2.4" fill="#ffffff" />
              </g>
            ) : expression === 'confused' ? (
              <g filter={`url(#${uid}-soft-glow)`}>
                <circle cx="83.5" cy="77" r="5.6" fill="#fbbf24" />
                <circle cx="116.5" cy="77" r="5.6" fill="#fbbf24" />
                <circle cx="85" cy="75.5" r="1.8" fill="#ffffff" />
                <circle cx="118" cy="75.5" r="1.8" fill="#ffffff" />
              </g>
            ) : (
              /* calm / focused */
              <g filter={`url(#${uid}-soft-glow)`}>
                <rect x="77" y="70" width="13" height="14" rx="6.5" fill="#5ceeff" />
                <rect x="110" y="70" width="13" height="14" rx="6.5" fill="#5ceeff" />
                <circle cx="86" cy="74" r="2.4" fill="#ffffff" />
                <circle cx="119" cy="74" r="2.4" fill="#ffffff" />
              </g>
            )}

            {/* Reactive Mouth */}
            {state === 'speaking' ? (
              <ellipse
                data-rig-part="mouth"
                cx="100"
                cy={91 + effectiveMouthOpen * 1.5}
                rx={6.5 + effectiveMouthOpen * 3}
                ry={mouthHeight * 0.55}
                fill="#fbcfe8"
                stroke="#f9a8d4"
                strokeWidth="1.2"
              />
            ) : expression === 'confused' ? (
              <path
                data-rig-part="mouth"
                d="M 94 94 Q 100 90 106 94"
                fill="none"
                stroke="#fde68a"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
            ) : expression === 'curious' ? (
              <circle data-rig-part="mouth" cx="100" cy="92" r="3.6" fill="#fbcfe8" />
            ) : (
              <path
                data-rig-part="mouth"
                d={
                  expression === 'excited' || expression === 'happy'
                    ? 'M 91 88 Q 100 101 109 88 Z'
                    : 'M 93 89 Q 100 96 107 89'
                }
                fill={expression === 'excited' || expression === 'happy' ? '#fbcfe8' : 'none'}
                stroke="#fbcfe8"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </motion.g>
        </motion.g>
      </motion.g>

      {/* Front cyan orbital ribbon sweep */}
      <path
        d="M 38 152 C 58 176, 142 178, 164 148"
        fill="none"
        stroke={`url(#${uid}-orbit)`}
        strokeWidth="3.8"
        strokeLinecap="round"
        opacity="0.82"
      />

      {/* Reactive golden 4-point sparkles */}
      {showSparkles && (
        <motion.g
          fill="#fef08a"
          stroke="#f59e0b"
          strokeWidth="1"
          animate={
            shouldAnimate
              ? { scale: [0.82, 1.14, 0.88], opacity: [0.7, 1, 0.7] }
              : { opacity: 0.9 }
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '100px 100px' }}
        >
          <path d="M 164 38 L 167 46 L 175 49 L 167 52 L 164 60 L 161 52 L 153 49 L 161 46 Z" />
          <path d="M 30 116 L 32.5 122 L 38.5 124.5 L 32.5 127 L 30 133 L 27.5 127 L 21.5 124.5 L 27.5 122 Z" />
        </motion.g>
      )}
    </svg>
  )
}
