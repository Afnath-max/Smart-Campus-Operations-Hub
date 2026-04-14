import { AlertCircle, X } from 'lucide-react'
import { useEffect } from 'react'

const toneClassNames = {
  danger: 'tone-danger',
  warning: 'tone-warning',
  success: 'tone-success',
  info: 'tone-info',
  default: 'tone-default',
}

export function AlertBanner({
  title,
  children,
  tone = 'danger',
  onClose,
  autoCloseMs,
  className = '',
}) {
  const toneClassName = toneClassNames[tone] || toneClassNames.danger
  const dismissAfter = onClose ? (autoCloseMs ?? 6000) : null

  useEffect(() => {
    if (!onClose || !dismissAfter || dismissAfter <= 0) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      onClose()
    }, dismissAfter)

    return () => window.clearTimeout(timeoutId)
  }, [dismissAfter, onClose])

  return (
    <div
      role="alert"
      className={`rounded-[20px] border px-4 py-3 shadow-[var(--surface-highlight)] ${toneClassName} ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--surface)_70%,transparent)]">
          <AlertCircle className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1 py-0.5">
          {title ? <p className="text-sm font-semibold">{title}</p> : null}
          <div className={`${title ? 'mt-1' : ''} text-sm leading-6`}>{children}</div>
        </div>

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss alert"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] text-[var(--muted-text)] transition hover:border-[color-mix(in_srgb,var(--border-strong)_78%,transparent)] hover:text-[var(--text)]"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
