import { fireEvent, screen } from '@testing-library/react'

/** Types a value into both language inputs of a `LocalizedTextInput` found by its label. */
export function fillLocalized(label: string, vi: string, en: string = vi) {
  fireEvent.change(screen.getByLabelText(`${label} (Tiếng Việt)`), {
    target: { value: vi },
  })
  fireEvent.change(screen.getByLabelText(`${label} (English)`), {
    target: { value: en },
  })
}
