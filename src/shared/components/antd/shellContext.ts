import { createContext } from 'react'

/** True inside a portal shell (Customer / Manager / Admin / Operator layouts). */
export const ShellContext = createContext(false)
