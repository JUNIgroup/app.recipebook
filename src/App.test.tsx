// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    render(<App />)
    button = screen.getByTestId('counter')
  })

  it('should exist', () => {
    expect(button).toBeTruthy()
  })

  it('should have initial count 0', () => {
    expect(button.textContent).toBe('Count is 0')
  })

  it('should have count 1 after click', () => {
    fireEvent.click(button)
    expect(button.textContent).toBe('Count is 1')
  })
})
