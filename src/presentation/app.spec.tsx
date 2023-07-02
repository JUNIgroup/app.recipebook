// @vitest-environment happy-dom

import { render, screen } from '@testing-library/react'
import { Provider as StoreProvider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { createStore } from '../business/app.store'
import { UserData } from '../business/auth/service/auth-service'
import { MockAuthService } from '../business/auth/service/mock-auth-service'
import { FirestoreDatabase } from '../business/recipe-books/database/firestore/firestore-database'
import { FirestoreMockService } from '../business/recipe-books/database/firestore/firestore-mock-service'
import { MockRdbService } from '../infrastructure/database/mock-rdb/mock-rdb.service'
import { createFakeLogger } from '../utilities/logger/fake-logger.test-helper'
import { App } from './app'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    const logger = createFakeLogger()
    const authService = new MockAuthService()
    authService.setMockUser({ id: 'foo', name: 'bar' } as UserData)
    const dbService = new MockRdbService()
    const database = new FirestoreDatabase(logger, new FirestoreMockService())
    const store = createStore({
      storage: localStorage,
      authService,
      dbService,
      database,
      logger,
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
