import { useRef } from 'react'

import { baseFieldClassName } from './field-classes'

/**
 * Uncontrolled text input with debounced URL sync.
 *
 * Design: The input is uncontrolled (defaultValue) to avoid two-way binding issues.
 * The URL state is write-only — we don't sync URL → input during typing.
 * The input resets only when the key prop changes (page navigation).
 */
export default function TextField({
  id,
  name,
  defaultValue,
  placeholder,
  autoComplete,
  describedBy,
  onChange,
}: {
  id: string
  name: string
  defaultValue: string | undefined
  placeholder: string
  autoComplete?: string
  describedBy?: string
  onChange: (value: string | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    onChange(nextValue.length > 0 ? nextValue : undefined)
  }

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      className={baseFieldClassName}
      type="text"
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-describedby={describedBy}
      defaultValue={defaultValue ?? ''}
      onChange={handleChange}
    />
  )
}
