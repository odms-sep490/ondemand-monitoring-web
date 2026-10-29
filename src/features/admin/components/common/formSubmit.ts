import type { FormEvent } from 'react'

/**
 * Wires an antd `<Form>` to the page's own (synchronous) validation: native
 * submit is intercepted so Enter and the footer submit button both run it.
 */
export function onFormSubmit(handler: () => void | Promise<void>) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handler()
  }
}
