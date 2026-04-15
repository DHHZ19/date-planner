import { Link, useSearch } from '@tanstack/react-router'

const PaginationButtons = ({ lastPage }: { lastPage: number }) => {
  const search = useSearch({ from: '/' })
  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-(--line) bg-(--surface-strong) px-5 py-2.5 text-sm font-semibold tracking-wide text-(--sea-ink)! no-underline shadow-[0_10px_26px_-18px_rgba(13,28,32,0.95)] transition duration-200 hover:-translate-y-0.5 hover:border-(--lagoon-deep) hover:bg-(--chip-bg) active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon) [&.active]:border-(--lagoon-deep) [&.active]:bg-(--chip-bg) [&.active]:text-(--sea-ink)!"
          to="."
          search={(prev) => ({
            ...prev,
            step: Math.max((prev.step ?? 1) - 1, 1),
          })}
        >
          Back
        </Link>

        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-rose-900/10 bg-linear-to-r from-rose-700 to-pink-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_-16px_rgba(159,18,57,0.9)] transition duration-200 hover:-translate-y-0.5 hover:from-rose-600 hover:to-pink-600 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
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
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-rose-900/10 bg-linear-to-r from-rose-700 to-pink-700 px-5 py-2.5 text-sm font-semibold tracking-wide text-white shadow-[0_14px_32px_-16px_rgba(159,18,57,0.9)] transition duration-200 hover:-translate-y-0.5 hover:from-rose-600 hover:to-pink-600 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        >
          Submit
        </button>
      )}
    </>
  )
}
export default PaginationButtons
