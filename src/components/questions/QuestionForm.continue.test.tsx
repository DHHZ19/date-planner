// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import QuestionForm from '#/components/questions/QuestionForm'
import { QUESTION_SECTIONS } from '#/components/questions/question-config'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const friday = new Date(2026, 9, 2, 15, 0, 0)
const timeStep = QUESTION_SECTIONS.find((section) => section.page === 2)!

function matchesNarrow(query: string) {
  return query.includes('max-width: 639px')
}

function StepHarness({
  onPlanDateChange,
}: {
  onPlanDateChange: (value: string) => void
}) {
  const [dateTime, setDateTime] = useState<string | undefined>('Now')
  const [planDate, setPlanDate] = useState<string | undefined>()

  return (
    <QuestionForm
      currentSection={timeStep}
      lastPage={QUESTION_SECTIONS.length}
      isFirstStep={false}
      getFieldValue={(key) => (key === 'dateTime' ? dateTime : undefined)}
      getCsvFieldValues={() => []}
      onFieldChange={(key, value) => {
        if (key === 'dateTime') setDateTime(value)
      }}
      onToggleCsvFieldValue={() => {}}
      onSubmit={(event) => event.preventDefault()}
      isSubmitting={false}
      isSubmitArmed={false}
      onLocationErrorChange={() => {}}
      onValidationErrorChange={() => {}}
      planDate={planDate}
      onPlanDateChange={(value) => {
        onPlanDateChange(value)
        setPlanDate(value)
      }}
    />
  )
}

async function flushFrame() {
  await act(async () => {
    await new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve(undefined))
    })
  })
}

describe('step 2 footer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(friday)
    window.matchMedia = (query: string) =>
      ({
        matches: matchesNarrow(query),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('keeps Continue rendered and enabled after Evening with no day tapped', async () => {
    const onPlanDateChange = vi.fn()
    render(<StepHarness onPlanDateChange={onPlanDateChange} />)
    await flushFrame()

    const evening = screen.getByRole('radio', { name: 'Evening' })
    fireEvent.click(evening)
    evening.focus()
    await flushFrame()

    const continueButton = screen.getByRole('button', { name: 'Continue' })
    const backButton = screen.getByRole('button', { name: 'Back' })
    const footer = continueButton.parentElement?.parentElement

    expect(continueButton).toHaveProperty('disabled', false)
    expect(backButton).toBeTruthy()
    expect(footer?.className.split(/\s+/)).not.toContain('hidden')
    expect(screen.getByRole('button', { pressed: true }).textContent).toContain(
      'Eve',
    )
    expect(onPlanDateChange).toHaveBeenCalledWith('2026-10-02')
  })
})
