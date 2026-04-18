const DISTANCE_PRESETS = [
  { label: 'Nearby', value: '2' },
  { label: 'City-wide', value: '10' },
  { label: 'Road Trip', value: '25' },
] as const

const MIN_MILES = 1
const MAX_MILES = 50

export default function DistanceField({
  id,
  name,
  value,
  describedBy,
  onChange,
}: {
  id: string
  name: string
  value: string | undefined
  describedBy?: string
  onChange: (value: string | undefined) => void
}) {
  const numericValue = value ? Number(value) : undefined
  const displayValue = numericValue ?? MIN_MILES

  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {DISTANCE_PRESETS.map((preset) => {
          const selected = value === preset.value

          return (
            <button
              key={preset.value}
              type="button"
              className={[
                'rounded-md border px-3 py-2 text-center transition duration-200',
                'focus:ring-2 focus:ring-[#2d513f] focus:ring-offset-2 focus:ring-offset-[var(--ui-surface)]/70 focus:outline-none',
                selected
                  ? 'border-[#6c1834] bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] text-white shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)]'
                  : 'border-[#355e4a] bg-[#edf4ef] text-[#1f2d28] hover:-translate-y-0.5 hover:border-[#2d513f] hover:bg-[#dde9e2]',
              ].join(' ')}
              onClick={() => onChange(preset.value)}
            >
              <span className="block text-xs font-semibold tracking-wide">
                {preset.label}
              </span>
              <span
                className={`mt-0.5 block text-[11px] ${selected ? 'text-white/80' : 'text-[#1f2d28]/60'}`}
              >
                {preset.value} mi
              </span>
            </button>
          )
        })}
      </div>

      {/* Slider */}
      <div>
        <div className="flex items-center justify-between text-xs text-[var(--ui-text-muted)]">
          <span>{MIN_MILES} mi</span>
          <span className="font-semibold text-[var(--ui-text)]">
            {numericValue != null
              ? `Within ${numericValue} miles`
              : 'Choose a distance'}
          </span>
          <span>{MAX_MILES} mi</span>
        </div>
        <input
          id={id}
          name={name}
          type="range"
          min={MIN_MILES}
          max={MAX_MILES}
          step={1}
          aria-describedby={describedBy}
          aria-valuetext={
            numericValue != null ? `${numericValue} miles` : undefined
          }
          className="mt-1 w-full cursor-pointer accent-[#7e1f3d]"
          value={displayValue}
          onChange={(event) => {
            const next = event.target.value
            onChange(next)
          }}
        />
      </div>
    </div>
  )
}
