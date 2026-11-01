import { fireEvent, screen, waitFor } from '@testing-library/react'

/** Opens an antd Select by its accessible name and clicks the option with the given text. */
export async function pickOption(label: RegExp | string, optionText: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: label }))
  const option = await waitFor(() => {
    const el = Array.from(
      document.querySelectorAll<HTMLElement>('.ant-select-item-option-content'),
    ).find((n) => n.textContent === optionText)
    if (!el) throw new Error(`option ${optionText} not found`)
    return el
  })
  fireEvent.click(option)
}
