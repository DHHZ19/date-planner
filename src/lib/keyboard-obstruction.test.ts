import { describe, expect, it } from 'vitest'

import {
  keyboardObstructsForm,
  scrollDeltaToVisualTop,
  suggestionListMaxPx,
} from '#/lib/keyboard-obstruction'

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

describe('scrollDeltaToVisualTop', () => {
  it('pins the field in one scroll and does not ask for another', () => {
    const offsetTop = 160
    const elementTop = 420
    const margin = 12
    const delta = scrollDeltaToVisualTop({ elementTop, offsetTop, margin })

    expect(delta).toBe(248)
    expect(
      scrollDeltaToVisualTop({
        elementTop: elementTop - delta,
        offsetTop,
        margin,
      }),
    ).toBe(0)
  })
})

describe('suggestionListMaxPx', () => {
  it('uses only the space above the keyboard, with no 120px floor', () => {
    expect(
      suggestionListMaxPx({
        visualHeight: 420,
        listTop: 360,
        offsetTop: 0,
        keyboardInset: 300,
      }),
    ).toBe(12)
  })

  it('reserves the accessory bar while the keyboard is open', () => {
    expect(
      suggestionListMaxPx({
        visualHeight: 400,
        listTop: 160,
        offsetTop: 0,
        keyboardInset: 280,
      }),
    ).toBe(192)
    expect(
      suggestionListMaxPx({
        visualHeight: 800,
        listTop: 160,
        offsetTop: 0,
        keyboardInset: 0,
      }),
    ).toBe(240)
  })

  it('measures from the visual viewport when the layout viewport is offset', () => {
    expect(
      suggestionListMaxPx({
        visualHeight: 380,
        listTop: 400,
        offsetTop: 100,
        keyboardInset: 200,
      }),
    ).toBe(32)
  })
})
