import { useTheme } from '../context/ThemeContext.jsx'

const options = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export function ThemeSwitcher({ compact = false }) {
  const { mode, setMode } = useTheme()

  return (
    <div className="inline-flex shrink-0 rounded-full border border-[var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface-soft)_48%,var(--surface)))] p-1 shadow-[var(--surface-highlight)]">
      {options.map(({ value, label }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-label={`Switch theme to ${label}`}
            className={`inline-flex items-center justify-center rounded-full px-3.5 py-2 text-xs font-semibold transition ${
              active
                ? 'bg-[var(--text)] text-[var(--surface)] shadow-[0_8px_20px_rgba(15,23,42,0.18)]'
                : 'text-[var(--muted-text)] hover:text-[var(--text)]'
            } ${compact ? 'min-w-[4rem] px-3 min-[420px]:min-w-[4.25rem] xl:min-w-[4.5rem]' : 'min-w-[4.75rem]'}`}
          >
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
