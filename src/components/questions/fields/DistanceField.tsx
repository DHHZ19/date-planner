export default function DistanceField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (value: string | undefined) => void
}) {
  return (
    <input
      className="ml-2 rounded-lg border-2 border-(--line) bg-(--chip-bg) px-3 py-1.5 text-(--sea-ink) outline-none transition placeholder:text-(--sea-ink-soft) focus:border-(--lagoon) focus:ring-2 focus:ring-(--lagoon)"
      type="number"
      placeholder="distance"
      value={value ?? ''}
      onChange={(event) => {
        const nextValue = event.target.value
        onChange(nextValue.length > 0 ? nextValue : undefined)
      }}
    />
  )
}
