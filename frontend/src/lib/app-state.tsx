import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'

import { currentMonth } from '@/lib/format'

interface AppState {
  month: string
  setMonth: (month: string) => void
  dark: boolean
  setDark: (dark: boolean) => void
}

const AppStateContext = createContext<AppState | null>(null)
const THEME_KEY = 'yapi.theme'

function initialDark(): boolean {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) return saved === 'dark'
  } catch {
    // Storage blocked: fall through to the device preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [month, setMonth] = useState(currentMonth)
  const [dark, setDarkState] = useState(initialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const value = useMemo<AppState>(
    () => ({
      month,
      setMonth,
      dark,
      setDark: (next) => {
        setDarkState(next)
        try {
          localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
        } catch {
          // The choice just won't be remembered.
        }
      },
    }),
    [month, dark],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext)
  if (!state) throw new Error('useAppState must be used inside AppStateProvider')
  return state
}
