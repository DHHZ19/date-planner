import { PRICE_LEVEL_OPTIONS } from '#/components/questions/question-config'

export default function PriceLevelField({
  selectedValues,
  onToggle,
}: {
  selectedValues: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="ml-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PRICE_LEVEL_OPTIONS.map((option, index) => {
        const selected = selectedValues.includes(option.value)
        const hearts = index + 1

        return (
          <label
            key={option.value}
            className={[
              'cursor-pointer rounded-2xl border-2 px-3 py-2.5 transition duration-200',
              'focus-within:ring-2 focus-within:ring-rose-600/70 focus-within:ring-offset-2',
              selected
                ? 'border-rose-900 bg-rose-700 text-white shadow-[0_10px_24px_-14px_rgba(159,18,57,0.85)]'
                : 'border-rose-300 bg-white/80 text-rose-900 hover:-translate-y-0.5 hover:border-rose-500 hover:bg-rose-50',
            ].join(' ')}
          >
            <input
              type="checkbox"
              name="priceLevel"
              value={option.value}
              checked={selected}
              className="sr-only"
              onChange={() => onToggle(option.value)}
            />
            <span className="block text-lg leading-none">{'♥'.repeat(hearts)}</span>
            <span className="mt-1 block text-xs font-semibold tracking-wide">
              {option.dollars}
            </span>
          </label>
        )
      })}
    </div>
  )
}
