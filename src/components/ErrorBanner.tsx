type ErrorBannerProps = {
  message: string
  onDismiss?: () => void
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 px-4 sm:top-5 sm:px-6">
      <div
        role="alert"
        aria-live="assertive"
        className="pointer-events-auto mx-auto flex w-full max-w-2xl items-start gap-3 rounded-xl border border-[var(--love-300)] bg-[var(--love-050)]/96 px-4 py-3 text-sm text-[var(--ui-danger)] shadow-[0_20px_40px_-26px_rgba(126,31,61,0.4)] backdrop-blur-sm"
      >
        <p className="flex-1 font-medium">{message}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--love-300)]/70 bg-[var(--ui-surface)]/70 text-[var(--ui-danger)] transition hover:bg-[var(--ui-surface)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]"
          >
            <span aria-hidden>×</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
