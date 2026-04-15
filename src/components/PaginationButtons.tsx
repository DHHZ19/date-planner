import { Link, useSearch } from '@tanstack/react-router'

const PaginationButtons = ({ lastPage }: { lastPage: number }) => {
  const search = useSearch({ from: '/' })
  const paginationButtonClassName =
    'inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-800 bg-rose-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white! no-underline shadow-[0_14px_32px_-16px_rgba(159,18,57,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-rose-600 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700'

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
          className={paginationButtonClassName}
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
          className={`mt-4 cursor-pointer ${paginationButtonClassName}`}
        >
          Submit
        </button>
      )}
    </>
  )
}
export default PaginationButtons
