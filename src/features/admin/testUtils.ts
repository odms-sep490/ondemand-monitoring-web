import { fireEvent, screen } from '@testing-library/react'

/** Opens an antd Select by its accessible name and picks the option with the given visible label. */
export async function chooseSelectOption(name: string | RegExp, label: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name }))
  fireEvent.click(await screen.findByTitle(label))
}
