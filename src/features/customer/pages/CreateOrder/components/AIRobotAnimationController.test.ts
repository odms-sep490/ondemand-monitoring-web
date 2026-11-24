import { describe, expect, it } from 'vitest'
import {
  mascotStateForEvent,
  pickNextIdleAction,
  pickSuccessVariation,
  resolveDirectorSnapshot,
  resolveMascotState,
  resolveRobotPersonality,
} from './AIRobotAnimationController'
import { resolveServiceMicroWorldTheme } from './ServiceMicroWorld'

describe('AIRobotAnimationController', () => {
  it('resolves a single primary animation state with strict priority', () => {
    expect(
      resolveMascotState({
        hasError: true,
        recording: true,
        thinking: true,
        speaking: true,
        pointing: true,
        reaction: 'welcome',
      }),
    ).toBe('error')

    expect(
      resolveMascotState({
        hasError: false,
        recording: true,
        thinking: true,
        speaking: true,
        pointing: true,
        reaction: 'welcome',
      }),
    ).toBe('listening')

    expect(
      resolveMascotState({
        hasError: false,
        recording: false,
        thinking: true,
        speaking: true,
        pointing: true,
        reaction: 'welcome',
      }),
    ).toBe('thinking')

    expect(
      resolveMascotState({
        hasError: false,
        recording: false,
        thinking: false,
        speaking: true,
        pointing: true,
        reaction: 'welcome',
      }),
    ).toBe('speaking')

    expect(
      resolveMascotState({
        hasError: false,
        recording: false,
        thinking: false,
        speaking: false,
        pointing: true,
        reaction: 'welcome',
      }),
    ).toBe('pointing')
  })

  it('resolves deterministic personality snapshot with expression and gesture', () => {
    const thinking = resolveRobotPersonality({
      hasError: false,
      recording: false,
      thinking: true,
      speaking: false,
      pointing: false,
      reaction: 'idle',
    })
    expect(thinking.state).toBe('thinking')
    expect(thinking.expression).toBe('curious')
    expect(thinking.gesture).toBe('head_tilt')

    const pointingLeft = resolveRobotPersonality({
      hasError: false,
      recording: false,
      thinking: false,
      speaking: false,
      pointing: true,
      pointDirection: 'left',
      reaction: 'idle',
    })
    expect(pointingLeft.state).toBe('pointing')
    expect(pointingLeft.expression).toBe('focused')
    expect(pointingLeft.gesture).toBe('point_left')
  })

  it('maps typed backend and UI events to mascot states', () => {
    expect(mascotStateForEvent('SESSION_STARTED')).toBe('welcome')
    expect(mascotStateForEvent('MICROPHONE_STARTED')).toBe('listening')
    expect(mascotStateForEvent('AGENT_REQUEST_STARTED')).toBe('thinking')
    expect(mascotStateForEvent('TTS_PLAYBACK_STARTED')).toBe('speaking')
    expect(mascotStateForEvent('SERVICE_RECOMMENDED')).toBe('pointing')
    expect(mascotStateForEvent('REQUIREMENT_CONFIRMED')).toBe('confirming')
    expect(mascotStateForEvent('DESCRIPTION_READY')).toBe('success')
    expect(mascotStateForEvent('REVIEW_READY')).toBe('success')
    expect(mascotStateForEvent('VALIDATION_FAILED')).toBe('error')
    expect(mascotStateForEvent('SESSION_CLOSED')).toBe('goodbye')
  })

  it('cycles success variations deterministically and never repeats consecutive idle actions', () => {
    const variations = [0, 1, 2, 3, 4].map((i) => pickSuccessVariation(i))
    expect(new Set(variations).size).toBe(5)

    const nextAfterLeft = pickNextIdleAction('look_left', 1)
    expect(nextAfterLeft).not.toBe('look_left')
  })

  it('suppresses decorative idle actions during calmFocus', () => {
    const calm = resolveDirectorSnapshot(
      {
        hasError: false,
        recording: false,
        thinking: false,
        speaking: false,
        pointing: false,
        reaction: 'idle',
      },
      { idleAction: 'gentle_wave', calmFocus: true },
    )
    expect(calm.idleAction).toBe('none')
    expect(calm.gesture).toBe('none')
  })

  it('derives service micro-world themes from real service metadata', () => {
    expect(resolveServiceMicroWorldTheme({ name: 'Kiểm tra mái nhà xưởng' })).toBe('factory')
    expect(resolveServiceMicroWorldTheme({ name: 'Giám sát rừng phòng hộ' })).toBe('forest')
    expect(resolveServiceMicroWorldTheme({ name: 'Theo dõi tiến độ công trình xây dựng' })).toBe('construction')
    expect(resolveServiceMicroWorldTheme({ name: 'Giám sát khu vực tổng quan' })).toBe('area')
  })
})
