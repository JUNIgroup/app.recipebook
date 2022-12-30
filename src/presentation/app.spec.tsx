// @vitest-environment happy-dom

import { fireEvent, render, screen } from '@testing-library/react'
import { Provider as StoreProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from '../business/app.store'
import { MockAuthService } from '../business/auth/service/mock-auth-service'
import { App } from './app'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    const authService = new MockAuthService()
    authService.setMockUser({ id: 'foo', name: 'bar' })
    const store = createStore({
      storage: localStorage,
      authService,
    })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <StoreProvider store={store}>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    )
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
