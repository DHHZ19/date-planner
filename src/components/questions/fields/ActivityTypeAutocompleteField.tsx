import AutocompleteMultiSelectField from './AutocompleteMultiSelectField'
import { ACTIVITY_PHRASE_MAX } from '#/lib/typesafe'
import { typesafeFixtureRequested } from '#/lib/typesafe-fixture'
import { ACTIVITY_SUGGESTIONS } from '../../../constants/activity-suggestions'
import { checkActivityText } from '#/server-functions/check-activity-text'

function rejectionMessage(text: string) {
  return `${text.trim()} is not an activity choice.`
}

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
      rootClassName="activity-field"
      onChange={onChange}
      onCommitText={async (text, signal) => {
        const trimmed = text.trim()
        const message = rejectionMessage(trimmed)
        if (
          !trimmed ||
          trimmed.length > ACTIVITY_PHRASE_MAX ||
          trimmed.includes(',')
        ) {
          return { ok: false, message }
        }

        try {
          const result = await checkActivityText({
            data: { text: trimmed, fixture: typesafeFixtureRequested() },
            signal,
          })
          if (!result.ok || result.phrase !== trimmed) {
            return { ok: false, message }
          }
          return { ok: true, value: trimmed }
        } catch (error) {
          if (signal.aborted) throw error
          return { ok: false, message }
        }
      }}
    />
  )
}
