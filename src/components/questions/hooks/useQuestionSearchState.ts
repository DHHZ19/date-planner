import { useNavigate, useSearch } from '@tanstack/react-router'

import type { AnswerKey } from '#/types/index-route.types'

function parseCsvValue(value: string | undefined) {
  return (value ?? '').split(',').filter(Boolean)
}

export function useQuestionSearchState() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()

  const updateField = (key: AnswerKey, value: string | undefined) => {
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        [key]: value && value.length > 0 ? value : undefined,
      }),
      resetScroll: false,
    })
  }

  const getCsvFieldValues = (key: AnswerKey) => {
    return parseCsvValue(search[key])
  }

  const toggleCsvFieldValue = (key: AnswerKey, value: string, maxValues: number) => {
    const currentValues = getCsvFieldValues(key)
    const valueAlreadySelected = currentValues.includes(value)

    const nextValues = valueAlreadySelected
      ? currentValues.filter((currentValue) => currentValue !== value)
      : currentValues.length < maxValues
        ? [...currentValues, value]
        : currentValues

    updateField(key, nextValues.length > 0 ? nextValues.join(',') : undefined)
  }

  return {
    search,
    updateField,
    getCsvFieldValues,
    toggleCsvFieldValue,
  }
}
