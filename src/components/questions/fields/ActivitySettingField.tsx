import { fieldLabelClassName } from './field-classes'

export type ActivitySettingOption = 'indoor' | 'outdoor' | 'mix'

export const ACTIVITY_SETTING_OPTIONS: {
  value: ActivitySettingOption
  label: string
}[] = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'mix', label: 'Mix of both' },
]

const unselectedChipClassName = `
  cursor-pointer select-none rounded-md border border-[var(--ui-border)]
  bg-[var(--ui-surface)] px-3 py-2.5 text-sm font-medium text-[var(--ui-text)]
  transition duration-200
  hover:-translate-y-0.5 hover:border-[var(--love-300)] hover:bg-[var(--ui-surface-soft)]
`

const selectedChipClassName = `
  cursor-pointer select-none rounded-md border border-[#6c1834]
  bg-gradient-to-b from-[#a33a4a] to-[#7e1f3d] px-3 py-2.5
  text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(126,31,61,0.62)]
  transition duration-200 hover:-translate-y-0.5
`

export default function ActivitySettingField({
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
  const handleSelect = (optionValue: ActivitySettingOption) => {
    // Toggle: if already selected, clear it; otherwise select it
    if (value === optionValue) {
      onChange(undefined)
    } else {
      onChange(optionValue)
    }
  }

  return (
    <div className="space-y-2">
      <div className={fieldLabelClassName} id={`${id}-label`}>
        Setting preference
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
      >
        {ACTIVITY_SETTING_OPTIONS.map((option) => {
          const isSelected = value === option.value
          return (
            <label
              key={option.value}
              className={`${isSelected ? selectedChipClassName : unselectedChipClassName} focus-within:ring-2 focus-within:ring-[var(--love-300)] focus-within:ring-offset-2 focus-within:ring-offset-[var(--ui-surface)]/70`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => handleSelect(option.value)}
                className="sr-only"
                aria-label={option.label}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </div>
  )
}
