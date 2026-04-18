import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'

import type { AnswerKey } from '#/types/index-route.types'

const DEBOUNCED_QUERY_KEYS: ReadonlySet<AnswerKey> = new Set([
  'startingArea',
  'duration',
  'activityTypes',
  'activitySetting',
  'dateVibe',
  'food',
  'distance',
])

const URL_UPDATE_DEBOUNCE_MS = 200

function parseCsvValue(value: string | undefined) {
  return (value ?? '').split(',').filter(Boolean)
}

export function useQuestionSearchState() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingUpdateRef = useRef<
    | {
        key: AnswerKey
        value: string | undefined
      }
    | undefined
  >(undefined)

  const commitUpdate = (key: AnswerKey, value: string | undefined) => {
    navigate({
      to: '.',
      search: (prev) => ({
        ...prev,
        [key]: value && value.length > 0 ? value : undefined,
      }),
      resetScroll: false,
      replace: true,
    })
  }

  const flushPendingUpdate = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    const pendingUpdate = pendingUpdateRef.current
    pendingUpdateRef.current = undefined

    if (!pendingUpdate) {
      return
    }

    commitUpdate(pendingUpdate.key, pendingUpdate.value)
  }

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  const updateField = (key: AnswerKey, value: string | undefined) => {
    if (DEBOUNCED_QUERY_KEYS.has(key)) {
      pendingUpdateRef.current = { key, value }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      debounceTimeoutRef.current = setTimeout(() => {
        debounceTimeoutRef.current = null
        const pendingUpdate = pendingUpdateRef.current
        pendingUpdateRef.current = undefined

        if (!pendingUpdate) {
          return
        }

        commitUpdate(pendingUpdate.key, pendingUpdate.value)
      }, URL_UPDATE_DEBOUNCE_MS)

      return
    }

    flushPendingUpdate()
    commitUpdate(key, value)
  }

  const getCsvFieldValues = (key: AnswerKey) => {
    return parseCsvValue(search[key])
  }

  const toggleCsvFieldValue = (
    key: AnswerKey,
    value: string,
    maxValues: number,
  ) => {
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
