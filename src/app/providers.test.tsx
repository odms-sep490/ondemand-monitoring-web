import { act, render, screen } from '@testing-library/react'
import { Modal } from 'antd'
import { afterEach, expect, it } from 'vitest'
import { AppProviders } from './providers'
import { setLanguage } from '../shared/i18n'
afterEach(() => setLanguage('vi'))
it('switches built-in dialog controls with the application language', () => {
  setLanguage('en')
  render(
    <AppProviders>
      <Modal open title="Test dialog">
        Content
      </Modal>
    </AppProviders>,
  )
  expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument()
  act(() => setLanguage('vi'))
  expect(screen.getByRole('button', { name: 'Đồng ý' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Hủy' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull()
})
