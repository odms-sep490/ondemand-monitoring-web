import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { resetMockDb } from '../../../../../mocks/db'

export const requestedUrls: string[] = []

/** Installs the mock transport (recording request URLs) for each test. */
export function useMockTransport() {
  beforeEach(() => {
    resetMockDb()
    requestedUrls.length = 0
    setHttpTransport((input, init) => {
      requestedUrls.push(String(input))
      return mockFetch(input, init)
    })
  })
  afterEach(() => {
    resetMockDb()
    resetHttpTransport()
  })
}

/** Opens an antd Select by its accessible name and clicks the option with the given text. */
export async function pickOption(label: string, optionText: string) {
  const box = screen.getByRole('combobox', { name: label })
  fireEvent.mouseDown(box)
  const option = await waitFor(() => {
    const el = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-select-item-option-content'),
    ).find((n) => n.textContent === optionText)
    if (!el) throw new Error(`option ${optionText} not found`)
    return el
  })
  fireEvent.click(option)
}
