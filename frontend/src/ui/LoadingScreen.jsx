export function LoadingScreen({ label }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel flex w-full max-w-md flex-col items-center gap-4 rounded-[28px] px-8 py-10 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--primary-soft)] border-t-[var(--primary)]" />
        <div className="space-y-1">
          <p className="font-display text-2xl font-semibold">Smart Campus Operations Hub</p>
          <p className="text-sm text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  )
}
