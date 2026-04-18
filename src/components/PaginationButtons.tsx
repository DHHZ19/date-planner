import { Link, useSearch } from '@tanstack/react-router'

const PaginationButtons = ({ lastPage }: { lastPage: number }) => {
  const search = useSearch({ from: '/' })
  const paginationButtonClassName =
    'inline-flex cursor-pointer min-h-11 items-center justify-center rounded-md border border-[var(--ui-border)] bg-[var(--ui-surface)] px-5 py-2.5 text-sm font-semibold tracking-wide text-[var(--ui-text)]! no-underline shadow-[0_14px_24px_-22px_rgba(126,31,61,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)] active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--love-300)]'
  const primaryButtonClassName =
    'inline-flex cursor-pointer min-h-11 items-center justify-center rounded-md border border-[#6c1834] bg-gradient-to-r from-[#a33a4a] to-[#7e1f3d] px-5 py-2.5 text-sm font-semibold tracking-wide text-white! shadow-[0_18px_30px_-18px_rgba(126,31,61,0.62)] transition duration-200 hover:-translate-y-0.5 hover:from-[#8e2f43] hover:to-[#6c1834] active:translate-y-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#6c1834]'

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link
          className={paginationButtonClassName}
          to="."
          search={(prev) => ({
            ...prev,
            step: Math.max((prev.step ?? 1) - 1, 1),
          })}
        >
          Back
        </Link>

        <Link
          className={primaryButtonClassName}
          to="."
          search={(prev) => ({
            ...prev,
            step: Math.min((prev.step ?? 1) + 1, lastPage),
          })}
        >
          Next
        </Link>
      </div>

      {search.step === lastPage && (
        <button
          type="submit"
          className={`mt-4 w-full cursor-pointer ${primaryButtonClassName}`}
        >
          Submit
        </button>
      )}
    </>
  )
}
export default PaginationButtons
