/** Mount antd Drawer/Modal inside the Manager layout so the --mgr-* tokens and .mgr-card skin apply. */
export function mgrPopupContainer(): HTMLElement {
  return document.querySelector<HTMLElement>('.mgr-layout') ?? document.body
}
