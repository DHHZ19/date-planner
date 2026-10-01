import AutocompleteMultiSelectField from './AutocompleteMultiSelectField'
import { ACTIVITY_SUGGESTIONS } from '../../../constants/activity-suggestions'

export default function ActivityTypeAutocompleteField({
  id,
  name,
  defaultValue,
  describedBy,
  placeholder,
  onChange,
  resetKey,
}: {
  id: string
  name: string
  defaultValue: string | undefined
  describedBy?: string
  placeholder: string
  onChange: (value: string | undefined) => void
  resetKey: number | string
}) {
  return (
    <AutocompleteMultiSelectField
      id={id}
      name={name}
      defaultValue={defaultValue}
      describedBy={describedBy}
      placeholder={placeholder}
      suggestions={ACTIVITY_SUGGESTIONS}
      maxSelections={4}
      ariaLabel="Activity type suggestions"
      uncategorizedSectionLabel="Activity"
      resetKey={resetKey}
      onChange={onChange}
    />
  )
}
