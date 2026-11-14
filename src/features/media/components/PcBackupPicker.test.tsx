import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setLanguage } from '../../../shared/i18n'
import { PcBackupPicker } from './PcBackupPicker'
afterEach(() => setLanguage('vi'))
it('localizes the backup picker without native browser-language text and only selects after a user change', () => {
  setLanguage('en')
  const select = vi.fn()
  const view = render(
    <PcBackupPicker
      contentType="image/jpeg"
      disabled={false}
      onSelect={select}
    />,
  )
  expect(
    screen.getByRole('button', { name: 'Choose backup file' }),
  ).toBeEnabled()
  expect(select).not.toHaveBeenCalled()
  const input =
    view.container.querySelector<HTMLInputElement>('input[type=file]')!
  expect(input).toHaveAttribute('hidden')
  act(() => setLanguage('vi'))
  expect(screen.getByRole('button', { name: 'Chọn tệp sao lưu' })).toBeEnabled()
  const file = new File(['original'], 'Ảnh của khách.jpg', {
    type: 'image/jpeg',
  })
  fireEvent.change(input, { target: { files: [file] } })
  expect(select).toHaveBeenCalledExactlyOnceWith(file)
})
