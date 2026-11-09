import { createContext } from 'react'

/**
 * Lets stage-level action bars render inside the sticky sidebar of the review
 * layout. `undefined` = no layout around us, render inline. `null` = layout
 * exists but the sidebar slot has not mounted yet.
 */
export const ReviewActionsSlot = createContext<HTMLElement | null | undefined>(undefined)
