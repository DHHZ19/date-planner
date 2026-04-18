import { DATE_TIME_OPTIONS } from '#/components/questions/question-config'

export default function DateTimeField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <select
      className="ml-2 cursor-pointer rounded-lg border-2 border-(--line) bg-(--chip-bg) px-3 py-1.5 text-(--sea-ink) outline-none transition placeholder:text-(--sea-ink-soft) focus:border-(--lagoon) focus:ring-2 focus:ring-(--lagoon)"
      onChange={(event) => {
        const nextValue = event.target.value
        onChange(nextValue.length > 0 ? nextValue : undefined)
      }}
      value={value ?? ''}
    >
      <option value="">--Please choose a time of day--</option>
      {DATE_TIME_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
