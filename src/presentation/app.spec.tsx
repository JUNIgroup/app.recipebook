// @vitest-environment happy-dom

import { Router } from '@solidjs/router'
import { render, screen } from '@solidjs/testing-library'
import { AuthContextProvider, UserData } from '../business/auth'
import { MockAuthService } from '../business/auth/service/mock-auth-service'
import { FirestoreDatabase } from '../business/database/firestore/firestore-database'
import { FirestoreMockService } from '../business/database/firestore/firestore-mock-service'
import { memoryPersistence } from '../infrastructure/firebase/persistence'
import { createFakeLogger } from '../utilities/logger/fake-logger.test-helper'
import { LandingPage } from './landing/landing-page'

describe('button', () => {
  let button: HTMLButtonElement

  beforeEach(() => {
    const logger = createFakeLogger()
    const authService = new MockAuthService()
    authService.setMockUser({ id: 'foo', name: 'bar' } as UserData)
    const emailPersistence = memoryPersistence()

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const database = new FirestoreDatabase(logger, new FirestoreMockService())

    render(() => (
      <div id="root">
        <AuthContextProvider authService={authService} emailPersistence={emailPersistence}>
          <Router>
            <LandingPage />
          </Router>
        </AuthContextProvider>
      </div>
    ))
    button = screen.getByRole('button', { name: 'Sign In' })
  })

  it('should exist', () => {
    expect(button).toBeTruthy()
  })
})
