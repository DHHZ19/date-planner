import type { QuestionSection } from '#/types/index-route.types'

const StepIndicator = ({
  currentPage,
  totalPages,
  currentSection,
}: {
  currentPage: number
  totalPages: number
  currentSection: QuestionSection
}) => {
  return (
    <div className="mb-4 sm:mb-6">
      {/* Mobile Progress bar */}
      <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[var(--ui-border)] sm:hidden">
        <div
          className="h-full rounded-full bg-[#a33a4a] transition-all duration-300 ease-out"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>

      {/* Desktop Progress bar */}
      <div className="mb-4 hidden items-center gap-2 sm:flex">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNum = index + 1
          const isCompleted = pageNum < currentPage
          const isCurrent = pageNum === currentPage

          return (
            <div key={pageNum} className="flex items-center">
              {/* Step circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200 ${
                  isCompleted
                    ? 'bg-[#a33a4a] text-white'
                    : isCurrent
                      ? 'border-2 border-[#a33a4a] bg-[var(--ui-surface)] text-[#a33a4a]'
                      : 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-muted)]'
                } `}
              >
                {isCompleted ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  pageNum
                )}
              </div>

              {/* Connector line */}
              {pageNum < totalPages && (
                <div
                  className={`mx-2 h-0.5 w-8 rounded-full transition-all duration-200 ${
                    isCompleted ? 'bg-[#a33a4a]' : 'bg-[var(--ui-border)]'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step info */}
      <div className="flex flex-col gap-0.5 sm:gap-1">
        <p className="text-xs font-medium tracking-wider text-[var(--ui-text-muted)] uppercase">
          Step {currentPage} of {totalPages}
        </p>
        <p className="text-base font-semibold text-[var(--ui-text)] sm:text-lg">
          {currentSection.page === 1 ? 'Date Basics' : 'Mood & Activities'}
        </p>
      </div>
    </div>
  )
}

export default StepIndicator
