import AutocompleteMultiSelectField from './AutocompleteMultiSelectField'
import { FOOD_SUGGESTIONS } from '../../../constants/food-suggestions'

export default function FoodAutocompleteField({
  id,
  name,
  defaultValue,
  describedBy,
  placeholder,
  onChange,
  resetKey,
  className,
}: {
  id: string
  name: string
  defaultValue: string | undefined
  describedBy?: string
  placeholder: string
  onChange: (value: string | undefined) => void
  resetKey: number | string
  className?: string
}) {
  return (
    <AutocompleteMultiSelectField
      id={id}
      name={name}
      defaultValue={defaultValue}
      describedBy={describedBy}
      placeholder={placeholder}
      suggestions={FOOD_SUGGESTIONS}
      maxSelections={4}
      ariaLabel="Food and cuisine suggestions"
      resetKey={resetKey}
      onChange={onChange}
      className={className}
    />
  )
}
