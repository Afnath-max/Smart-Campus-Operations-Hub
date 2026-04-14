import { act, fireEvent, render, screen } from '@testing-library/react'
import { useTheme, ThemeProvider } from './ThemeContext.jsx'

const listeners = new Set()
let prefersDark = false

function emitSystemTheme(matches) {
  prefersDark = matches
  for (const listener of listeners) {
    listener({ matches })
  }
}

function ThemeProbe() {
  const { mode, resolvedTheme, setMode } = useTheme()

  return (
    <div>
      <p>Mode: {mode}</p>
      <p>Resolved: {resolvedTheme}</p>
      <button type="button" onClick={() => setMode('dark')}>
        Force dark
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    listeners.clear()
    prefersDark = false
    window.localStorage.clear()

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: () => ({
        get matches() {
          return prefersDark
        },
        media: '(prefers-color-scheme: dark)',
        addEventListener: (_type, listener) => listeners.add(listener),
        removeEventListener: (_type, listener) => listeners.delete(listener),
      }),
    })
  })

  it('applies the stored resolved theme to dataset and browser color scheme', () => {
    window.localStorage.setItem('smart-campus-theme', 'dark')

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Mode: dark')).toBeInTheDocument()
    expect(screen.getByText('Resolved: dark')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('follows OS preference changes when mode is system', () => {
    window.localStorage.setItem('smart-campus-theme', 'system')

    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    expect(screen.getByText('Mode: system')).toBeInTheDocument()
    expect(screen.getByText('Resolved: light')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')

    act(() => {
      emitSystemTheme(true)
    })

    expect(screen.getByText('Resolved: dark')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  it('persists explicit mode changes', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: /force dark/i }))

    expect(window.localStorage.getItem('smart-campus-theme')).toBe('dark')
    expect(screen.getByText('Mode: dark')).toBeInTheDocument()
    expect(screen.getByText('Resolved: dark')).toBeInTheDocument()
  })
})
