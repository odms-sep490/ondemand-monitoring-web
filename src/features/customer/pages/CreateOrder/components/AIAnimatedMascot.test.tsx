import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { AIAnimatedMascot } from './AIAnimatedMascot'

afterEach(cleanup)

it('uses the supplied mascot asset and exposes the active animation state', () => {
  const { container } = render(
    <AIAnimatedMascot state="thinking" size="avatar" />,
  )
  const mascot = container.querySelector('.ai-animated-mascot')
  const image = container.querySelector('img')

  expect(mascot?.getAttribute('data-state')).toBe('thinking')
  expect(image?.getAttribute('src')).toBe('/assets/ai/ondemand-ai-mascot.webp')
  expect(image?.getAttribute('loading')).toBe('lazy')
})

it('shows a usable fallback when the mascot image fails to load', () => {
  const { container } = render(<AIAnimatedMascot state="idle" />)
  const image = container.querySelector('img')

  if (!image) throw new Error('Mascot image was not rendered')
  fireEvent.error(image)

  expect(container.querySelector('.ai-animated-mascot__fallback')).not.toBeNull()
})

it('renders the hologram overlay only while thinking when enabled', () => {
  const { container, rerender } = render(
    <AIAnimatedMascot state="thinking" showHologram={true} size="hero" />,
  )
  expect(container.querySelector('.ai-animated-mascot__hologram')).not.toBeNull()
  expect(
    container.querySelector('.ai-animated-mascot')?.getAttribute('data-expression'),
  ).toBe('curious')

  rerender(<AIAnimatedMascot state="idle" showHologram={true} size="hero" />)
  expect(container.querySelector('.ai-animated-mascot__hologram')).toBeNull()
})

it('renders the articulated 2.5D SVG character rig with independent joints on hero and launcher sizes', () => {
  const { container } = render(
    <AIAnimatedMascot state="welcome" size="hero" portalSpin={true} />,
  )
  const mascot = container.querySelector('.ai-animated-mascot')
  expect(mascot?.getAttribute('data-rig-mode')).toBe('2.5d-rig')
  expect(container.querySelector('.ai-robot-rig')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="antenna"]')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="head"]')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="eyes"]')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="mouth"]')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="left-arm"]')).not.toBeNull()
  expect(container.querySelector('[data-rig-part="right-arm"]')).not.toBeNull()
})
