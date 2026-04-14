import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'smart-campus-theme'

function getSystemTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function readStoredTheme() {
  if (typeof window === 'undefined') {
    return 'system'
  }

  return window.localStorage.getItem(STORAGE_KEY) || 'system'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(readStoredTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  const handleSystemThemeChange = useEffectEvent((event) => {
    setSystemTheme(event.matches ? 'dark' : 'light')
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [handleSystemThemeChange])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  const resolvedTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.style.colorScheme = resolvedTheme
  }, [resolvedTheme])

  const value = {
    mode,
    resolvedTheme,
    setMode,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }

  return context
}
