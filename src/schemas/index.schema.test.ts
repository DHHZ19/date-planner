import { describe, expect, it } from 'vitest'

import { searchStateSchema } from '#/schemas/index.schema'

describe('searchStateSchema', () => {
  it('ignores a leftover vibe search param', () => {
    const parsed = searchStateSchema.parse({
      mode: 'guided',
      step: '2',
      dateTime: 'Evening',
      planDate: '2026-10-03',
      vibe: 'rainy and close to home',
    })

    expect(parsed).not.toHaveProperty('vibe')
    expect(parsed.mode).toBe('guided')
    expect(parsed.step).toBe(2)
    expect(parsed.dateTime).toBe('Evening')
    expect(parsed.planDate).toBe('2026-10-03')
  })
})
