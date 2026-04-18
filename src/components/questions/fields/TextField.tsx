import { useEffect, useState } from 'react'

import { baseFieldClassName } from './field-classes'

export default function TextField({
  id,
  name,
  value,
  placeholder,
  autoComplete,
  describedBy,
  onChange,
}: {
  id: string
  name: string
  value: string | undefined
  placeholder: string
  autoComplete?: string
  describedBy?: string
  onChange: (value: string | undefined) => void
}) {
  const [localValue, setLocalValue] = useState(() => value ?? '')

  useEffect(() => {
    const nextValue = value ?? ''

    setLocalValue((currentValue) => {
      return currentValue === nextValue ? currentValue : nextValue
    })
  }, [value])

  return (
    <input
      id={id}
      name={name}
      className={baseFieldClassName}
      type="text"
      placeholder={placeholder}
      autoComplete={autoComplete}
      aria-describedby={describedBy}
      value={localValue}
      onChange={(event) => {
        const nextValue = event.target.value
        setLocalValue(nextValue)
        onChange(nextValue.length > 0 ? nextValue : undefined)
      }}
    />
  )
}
