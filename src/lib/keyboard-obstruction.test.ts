import { describe, expect, it } from 'vitest'

import { keyboardObstructsForm } from '#/lib/keyboard-obstruction'

describe('keyboardObstructsForm', () => {
  it('hides the bottom bar on a narrow screen while editing or while the keyboard is open', () => {
    expect(
      keyboardObstructsForm({
        narrow: true,
        editing: true,
        keyboardInset: 0,
      }),
    ).toBe(true)
    expect(
      keyboardObstructsForm({
        narrow: true,
        editing: false,
        keyboardInset: 280,
      }),
    ).toBe(true)
    expect(
      keyboardObstructsForm({
        narrow: true,
        editing: false,
        keyboardInset: 0,
      }),
    ).toBe(false)
    expect(
      keyboardObstructsForm({
        narrow: false,
        editing: true,
        keyboardInset: 280,
      }),
    ).toBe(false)
  })
})
