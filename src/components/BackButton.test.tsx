// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BackButton } from '#/components/BackButton'

afterEach(() => {
  cleanup()
})

function renderButton(onClick = vi.fn()) {
  render(<BackButton onClick={onClick} />)
  return {
    onClick,
    button: screen.getByRole('button', { name: 'Back to Welcome Screen' }),
  }
}

describe('BackButton', () => {
  it('keeps a real button with a 44px target and the existing click', () => {
    const { button, onClick } = renderButton()

    expect(button.getAttribute('type')).toBe('button')
    expect(button.className).toContain('min-h-11')
    expect(button.className).toContain('min-w-11')
    expect(button.getAttribute('data-held')).toBe('false')
    expect(button.className).toContain('back-hold-button')
    expect(button.className).not.toContain('scale-100')
    expect(button.className).not.toContain('scale-[1.34]')

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('grows on press and springs back on release, cancel, and leave', () => {
    const { button } = renderButton()

    fireEvent.pointerDown(button, { button: 0 })
    expect(button.getAttribute('data-held')).toBe('true')

    fireEvent.pointerUp(button)
    expect(button.getAttribute('data-held')).toBe('false')

    fireEvent.pointerDown(button, { button: 0 })
    fireEvent.pointerCancel(button)
    expect(button.getAttribute('data-held')).toBe('false')

    fireEvent.pointerDown(button, { button: 0 })
    fireEvent.pointerLeave(button)
    expect(button.getAttribute('data-held')).toBe('false')
  })

  it('does not grow for a non-primary pointer', () => {
    const { button } = renderButton()

    fireEvent.pointerDown(button, { button: 2 })
    expect(button.getAttribute('data-held')).toBe('false')
  })
})
