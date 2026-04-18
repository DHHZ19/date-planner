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
    <div className="mb-6">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNum = index + 1
          const isCompleted = pageNum < currentPage
          const isCurrent = pageNum === currentPage

          return (
            <div key={pageNum} className="flex items-center">
              {/* Step circle */}
              <div
                className={`
                  flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                  transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-[#a33a4a] text-white'
                      : isCurrent
                        ? 'border-2 border-[#a33a4a] bg-[var(--ui-surface)] text-[#a33a4a]'
                        : 'border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-text-muted)]'
                  }
                `}
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
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--ui-text-muted)]">
          Step {currentPage} of {totalPages}
        </p>
        <p className="text-lg font-semibold text-[var(--ui-text)]">
          {currentSection.page === 1 ? 'Date Basics' : 'Mood & Activities'}
        </p>
      </div>
    </div>
  )
}

export default StepIndicator
