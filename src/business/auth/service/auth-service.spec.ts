import ShortUniqueId from 'short-unique-id'
import { memoryPersistence, nonePersistence } from '../../../infrastructure/firebase/persistence'
import { RestAuthService } from '../../../infrastructure/firebase/rest-auth-service'
import { isEmulatorAvailable } from '../../../utilities/firebase/emulator-utils'
import { createFakeLogger } from '../../../utilities/logger/fake-logger.test-helper'
import { defineGlobalFetchForTesting } from '../../../utilities/query/fetch.test-helper'
import { AuthError, AuthService, UserData } from './auth-service'
import { FirebaseRestAuthService } from './firebase-rest-auth-service'
import { MockAuthService } from './mock-auth-service'

defineGlobalFetchForTesting()

const uid = new ShortUniqueId()

interface TestContext {
  testArePossible: boolean
  supportsErrors: boolean
  authService: () => Promise<AuthService> | AuthService
}

const emulatorAvailable = await isEmulatorAvailable()

function createMockAuthServiceContext(): TestContext {
  return {
    testArePossible: true,
    supportsErrors: false,
    authService: () => new MockAuthService(),
  }
}

function createFirebaseRestAuthServiceContext(): TestContext {
  return {
    testArePossible: !!emulatorAvailable,
    supportsErrors: true,
    authService: () => {
      const logger = createFakeLogger()
      const auth = RestAuthService.forEmulator(logger)
      const persistence = {
        permanent: memoryPersistence(),
        temporary: nonePersistence(),
      }
      return new FirebaseRestAuthService(auth, logger, persistence)
    },
  }
}

describe.each`
  serviceName                  | context
  ${'MockAuthService'}         | ${createMockAuthServiceContext()}
  ${'FirebaseRestAuthService'} | ${createFirebaseRestAuthServiceContext()}
`('AuthService $serviceName', ({ serviceName, context }: { serviceName: string; context: TestContext }) => {
  describe.runIf(context.testArePossible)('is testable', () => {
    let authService: AuthService

    beforeEach(async () => {
      authService = await context.authService()
    })

    describe('initial', () => {
      it('should no user be logged in', () => {
        // assert
        expect(authService.isLogin()).toBe(false)
      })

      it('should have no current user', () => {
        // assert
        expect(authService.currentUser).toBeNull()
      })
    })

    describe('create account', () => {
      let name: string
      let email: string
      let password: string

      beforeEach(async () => {
        const id = uid()
        name = `Test User ${id}`
        email = `test.create.account.${Date.now()}@example.com`
        password = `secret-${id}`
      })

      it('should create a new account', async () => {
        // act
        const before = Date.now()
        await authService.signUpWithEmailAndPassword(name, email, password)
        const after = Date.now()

        // assert
        expect(authService.isLogin()).toBe(true)
        expect(authService.currentUser).toMatchObject({
          id: expect.any(String),
          name,
          email,
          createdAt: expect.toBeWithin(before, after + 1),
          lastLoginAt: expect.any(Number),
        })
      })

      it.runIf(context.supportsErrors)('should fail with invalid email', async () => {
        // arrange
        const invalidEmail = '@example.com'

        // act
        const login = authService.signUpWithEmailAndPassword(name, invalidEmail, password)

        // assert
        const error = await login.catch((e) => e)
        expect(error).toBeInstanceOf(AuthError)
        expect({ ...error }).toEqual({
          service: serviceName,
          plainMessage: expect.any(String),
          code: 'auth/invalid-credential',
        })
      })

      describe('logout new account', () => {
        beforeEach(async () => {
          await authService.signUpWithEmailAndPassword(name, email, password)
        })

        it('should logout the user', async () => {
          // act
          await authService.logout()

          // assert
          expect(authService.isLogin()).toBe(false)
          expect(authService.currentUser).toBeNull()
        })

        it('should logout the twice', async () => {
          // act
          await authService.logout()
          await authService.logout()

          // assert
          expect(authService.isLogin()).toBe(false)
          expect(authService.currentUser).toBeNull()
        })
      })
    })

    describe('existing account', () => {
      let existingUser: UserData
      let password: string

      beforeEach(async () => {
        const id = uid()
        const name = `Test User ${id}`
        const email = `test.create.account.${Date.now()}@example.com`
        password = `secret-${id}`
        await authService.signUpWithEmailAndPassword(name, email, password)
        assert(authService.currentUser)
        existingUser = authService.currentUser
        await authService.logout()
      })

      it('should sign in the user', async () => {
        // act
        const before = Date.now()
        await authService.signInWithEmailAndPassword(existingUser.email, password)
        const after = Date.now()

        // assert
        expect(authService.isLogin()).toBe(true)
        expect(authService.currentUser).toMatchObject({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          createdAt: existingUser.createdAt,
          lastLoginAt: expect.toBeWithin(before, after + 1),
        })
      })

      it.runIf(context.supportsErrors)('should fail with unknown email', async () => {
        // act
        const login = authService.signInWithEmailAndPassword('unknown-email@example.com', password)

        // assert
        const error = await login.catch((e) => e)
        expect(error).toBeInstanceOf(AuthError)
        expect({ ...error }).toEqual({
          service: serviceName,
          plainMessage: expect.any(String),
          code: 'auth/user-not-found',
        })
      })

      it.runIf(context.supportsErrors)('should fail with password mismatch', async () => {
        // act
        const login = authService.signInWithEmailAndPassword(existingUser.email, 'invalid password')

        // assert
        const error = await login.catch((e) => e)
        expect(error).toBeInstanceOf(AuthError)
        expect({ ...error }).toEqual({
          service: serviceName,
          plainMessage: expect.any(String),
          code: 'auth/invalid-credential',
        })
      })

      describe('and logged in', () => {
        let user: UserData

        beforeEach(async () => {
          await authService.signInWithEmailAndPassword(existingUser.email, password)
          assert(authService.currentUser)
          user = authService.currentUser
        })

        it('should logout the user', async () => {
          // act
          await authService.logout()

          // assert
          expect(authService.isLogin()).toBe(false)
          expect(authService.currentUser).toBeNull()
        })

        it('should logout the twice', async () => {
          // act
          await authService.logout()
          await authService.logout()

          // assert
          expect(authService.isLogin()).toBe(false)
          expect(authService.currentUser).toBeNull()
        })

        it('should allow to change the name', async () => {
          // arrange
          const newName = `New Name ${uid()}`

          // act
          await authService.changeName(newName)

          // assert
          expect(authService.isLogin()).toBe(true)
          expect(authService.currentUser).toMatchObject({
            id: user.id,
            name: newName,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          })
        })

        it.runIf(context.supportsErrors)('should fail with invalid new name', async () => {
          // arrange
          const newName = { invalid: 'json payload' } as unknown as string

          // act
          const action = authService.changeName(newName)

          // assert
          const error = await action.catch((e) => e)
          expect(error).toBeInstanceOf(AuthError)
          expect({ ...error }).toEqual({
            service: serviceName,
            plainMessage: expect.any(String),
            code: 'auth/service-not-available',
          })
        })

        it('should login with new name after change', async () => {
          // arrange
          const newName = `New Name ${uid()}`
          await authService.changeName(newName)
          await authService.logout()

          // act
          await authService.signInWithEmailAndPassword(user.email, password)

          // assert
          expect(authService.isLogin()).toBe(true)
          expect(authService.currentUser).toMatchObject({
            id: user.id,
            name: newName,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: expect.any(Number),
          })
        })

        it('should allow to change the password', async () => {
          // arrange
          const newPassword = `New Password ${uid()}`

          // act
          await authService.changePassword(newPassword)

          // assert
          expect(authService.isLogin()).toBe(true)
          expect(authService.currentUser).toMatchObject({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          })
        })

        it.runIf(context.supportsErrors)('should fail with invalid new password', async () => {
          // arrange
          const newPassword = { invalid: 'json payload' } as unknown as string

          // act
          const action = authService.changePassword(newPassword)

          // assert
          const error = await action.catch((e) => e)
          expect(error).toBeInstanceOf(AuthError)
          expect({ ...error }).toEqual({
            service: serviceName,
            plainMessage: expect.any(String),
            code: 'auth/service-not-available',
          })
        })

        it('should allow login with new password', async () => {
          // arrange
          const newPassword = `New Password ${uid()}`
          await authService.changePassword(newPassword)
          await authService.logout()

          // act
          await authService.signInWithEmailAndPassword(user.email, newPassword)

          // assert
          expect(authService.isLogin()).toBe(true)
          expect(authService.currentUser).toMatchObject({
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
            lastLoginAt: expect.any(Number),
          })
        })

        it('should allow to delete account', async () => {
          // act
          await authService.deleteAccount()

          // assert
          expect(authService.isLogin()).toBe(false)
          expect(authService.currentUser).toBeNull()
        })

        it.runIf(context.supportsErrors)('should not be able to login in deleted account', async () => {
          // arrange
          await authService.deleteAccount()

          // act
          const login = authService.signInWithEmailAndPassword(user.email, password)

          // assert
          const error = await login.catch((e) => e)
          expect(error).toBeInstanceOf(AuthError)
          expect({ ...error }).toEqual({
            service: serviceName,
            plainMessage: expect.any(String),
            code: 'auth/user-not-found',
          })
        })
      })
    })
  })
})
