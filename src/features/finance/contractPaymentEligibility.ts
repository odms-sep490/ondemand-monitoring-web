import type { Invoice } from './types'

/** Paying a deposit needs a signed submission; Mission deployment still needs confirmation. */
export function isContractDepositReady(
  invoice:
    | Pick<
        Invoice,
        'contractRequired' | 'contractSubmittedAt' | 'contractConfirmedAt'
      >
    | null
    | undefined,
): boolean {
  return Boolean(
    invoice &&
    (!invoice.contractRequired ||
      invoice.contractSubmittedAt ||
      invoice.contractConfirmedAt),
  )
}
