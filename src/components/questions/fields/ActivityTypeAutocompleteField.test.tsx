// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import ActivityTypeAutocompleteField from '#/components/questions/fields/ActivityTypeAutocompleteField'
import { checkActivityText } from '#/server-functions/check-activity-text'

vi.mock('#/server-functions/check-activity-text', () => ({
  checkActivityText: vi.fn(),
}))

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
  window.matchMedia = (query: string) =>
    ({
      matches: false,
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
  vi.clearAllMocks()
})

function renderField(defaultValue?: string) {
  const onChange = vi.fn()
  render(
    <>
      <label htmlFor="activity">Activity</label>
      <ActivityTypeAutocompleteField
        id="activity"
        name="activityTypes"
        defaultValue={defaultValue}
        placeholder="Activities"
        resetKey={0}
        onChange={onChange}
      />
    </>,
  )
  return onChange
}

function input() {
  return screen.getByRole('combobox', { name: 'Activity' })
}

describe('ActivityTypeAutocompleteField', () => {
  it('adds a known activity suggestion without calling the judge', () => {
    const onChange = renderField()
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})

    fireEvent.change(input(), { target: { value: 'Museum' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    const chip = screen.getByRole('button', { name: 'Remove Museum' })
    expect(chip.className).toContain('food-chip-join')
    expect(onChange).toHaveBeenCalledWith('museum')
    expect(vi.mocked(checkActivityText)).not.toHaveBeenCalled()
    expect(scrollBy).not.toHaveBeenCalled()
    expect(document.querySelector('.activity-field-shake')).toBeNull()
  })

  it('adds the trimmed phrase when the judge accepts it', async () => {
    const onChange = renderField()
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {})
    vi.mocked(checkActivityText).mockResolvedValue({
      ok: true,
      phrase: 'lantern walk',
    })

    fireEvent.change(input(), { target: { value: 'lantern walk' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    const chip = await screen.findByRole('button', {
      name: 'Remove lantern walk',
    })
    expect(chip.className).toContain('food-chip-join')
    expect(onChange).toHaveBeenCalledWith('lantern walk')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(scrollBy).not.toHaveBeenCalled()
    expect(document.querySelector('.activity-field-shake')).toBeNull()
  })

  it('does not add a chip when the judge rejects the phrase', async () => {
    const onChange = renderField('museum')
    vi.mocked(checkActivityText).mockResolvedValue({ ok: false })

    fireEvent.change(input(), { target: { value: 'zzzznotactivity' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'zzzznotactivity is not an activity choice.',
    )
    expect(
      screen.queryByRole('button', { name: 'Remove zzzznotactivity' }),
    ).toBeNull()
    expect(screen.getByRole('button', { name: 'Remove Museum' })).toBeTruthy()
    expect(
      document.querySelector('[data-rejected="true"]')?.innerHTML,
    ).toContain('border-[var(--ui-danger)]')
    expect(document.querySelector('.activity-field-shake')).toBeNull()
    expect(onChange).not.toHaveBeenLastCalledWith(
      expect.stringContaining('zzzznotactivity'),
    )
  })

  it('rejects a comma or a long phrase before the judge and keeps the cap', async () => {
    renderField()

    fireEvent.change(input(), { target: { value: 'park, picnic' } })
    fireEvent.keyDown(input(), { key: 'Enter' })

    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'park, picnic is not an activity choice.',
    )
    expect(vi.mocked(checkActivityText)).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Remove park, picnic' }),
    ).toBeNull()

    cleanup()
    renderField()
    const longPhrase = 'a'.repeat(41)
    fireEvent.change(input(), { target: { value: longPhrase } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      `${longPhrase} is not an activity choice.`,
    )
    expect(vi.mocked(checkActivityText)).not.toHaveBeenCalled()

    cleanup()
    renderField('museum,park,beach,zoo')
    fireEvent.change(input(), { target: { value: 'lantern walk' } })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(vi.mocked(checkActivityText)).not.toHaveBeenCalled()
    expect(
      screen.queryByRole('button', { name: 'Remove lantern walk' }),
    ).toBeNull()
  })
})
