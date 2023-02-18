// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react'
import { Provider as StoreProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from '../business/app.store'
import { MockAuthService } from '../business/auth/service/mock-auth-service'
import { App } from './app'
import { MockRdbService } from '../infrastructure/database/mock-rdb/mock-rdb.service'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    const authService = new MockAuthService()
    authService.setMockUser({ id: 'foo', name: 'bar' })
    const dbService = new MockRdbService()
    const store = createStore({
      storage: localStorage,
      authService,
      dbService,
    })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <StoreProvider store={store}>
          <App />
        </StoreProvider>
      </MemoryRouter>,
    )
    button = screen.getByTestId('random')
  })

  it('should exist', () => {
    expect(button).toBeTruthy()
  })
})
