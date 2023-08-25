// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react'
import { Provider as StoreProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from '../business/app.store'
import { UserData } from '../business/auth/service/auth-service'
import { MockAuthService } from '../business/auth/service/mock-auth-service'
import { FirestoreDatabase } from '../business/database/firestore/firestore-database'
import { FirestoreMockService } from '../business/database/firestore/firestore-mock-service'
import { createFakeLogger } from '../utilities/logger/fake-logger.test-helper'
import { LandingPage } from './landing/landing-page'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    const logger = createFakeLogger()
    const authService = new MockAuthService()
    authService.setMockUser({ id: 'foo', name: 'bar' } as UserData)
    const database = new FirestoreDatabase(logger, new FirestoreMockService())
    const store = createStore({
      storage: localStorage,
      authService,
      database,
      logger,
    })
    render(
      <div id="root">
        <MemoryRouter initialEntries={['/protected']}>
          <StoreProvider store={store}>
            <LandingPage />
          </StoreProvider>
        </MemoryRouter>
      </div>,
    )
    button = screen.getByRole('button', { name: 'Sign In' })
  })

  it('should exist', () => {
    expect(button).toBeTruthy()
  })
})
