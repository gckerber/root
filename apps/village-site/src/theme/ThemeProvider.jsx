// apps/village-site/src/theme/ThemeProvider.jsx
import { createContext, useContext, useMemo } from 'react'
import { SEASONS, applyTheme, resolveSeasonId } from './seasons'

const ThemeContext = createContext(SEASONS.winter)

// Apply before first paint so there is no flash of the default colors.
const initialSeasonId = resolveSeasonId()
applyTheme(initialSeasonId)

export function ThemeProvider({ children }) {
  const season = useMemo(() => SEASONS[initialSeasonId], [])
  return <ThemeContext.Provider value={season}>{children}</ThemeContext.Provider>
}

export const useSeason = () => useContext(ThemeContext)