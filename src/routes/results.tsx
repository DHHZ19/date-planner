import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DatePlanResults } from '#/components/DatePlanResults'
import {
  clearLatestPlanStorage,
  readLatestPlanFromStorage,
} from '#/lib/date-plan'
import type { ShareAttempt } from '#/lib/date-plan'
import type { DatePlanResponse } from '#/types/index-route.types'

export const Route = createFileRoute('/results')({
  component: ResultsPage,
})

function ResultsPage() {
  const navigate = useNavigate()
  const [storedPlan, setStoredPlan] = useState<{
    plan: DatePlanResponse
    attempt: ShareAttempt | null
  } | null>(null)

  useEffect(() => {
    const stored = readLatestPlanFromStorage()
    if (!stored) {
      try {
        clearLatestPlanStorage()
      } catch {
        // Ignore storage failures while leaving an unusable cache behind.
      }
      navigate({ to: '/' })
      return
    }

    setStoredPlan(stored)
  }, [navigate])

  if (!storedPlan) {
    return null
  }

  return (
    <DatePlanResults
      datePlan={storedPlan.plan}
      variant="local"
      shareAttempt={storedPlan.attempt}
    />
  )
}
