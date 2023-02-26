import ShortUniqueId from 'short-unique-id'
import { FirebaseError } from './firebase-error'
import { isEmulatorAvailable } from './helpers/emulator-utils'
import { ProfileUpdateParams } from './helpers/rest-types'
import { memoryPersistence } from './persistence'
import { AuthUser, OnUserChanged, RestAuthService, Unsubscribe } from './rest-auth-service'

const uid = new ShortUniqueId()
const emulatorIsAvailable = await isEmulatorAvailable()

describe('RestAuthService.forRemote', () => {
  it('should return a service', () => {
    // act
    const service = RestAuthService.forRemote('apiKey')

    // assert
    expect(service).toBeTruthy()
  })
})

describe('RestAuthService.forEmulator', () => {
  it.runIf(emulatorIsAvailable)('should return a service', () => {
    // act
    const service = RestAuthService.forEmulator()

    // assert
    expect(service).toBeTruthy()
  })
})

describe('RestAuthService', () => {
  const sampleUserData = Object.freeze({
    user: {
      id: 'id1234',
      email: 'test@example.com',
      displayName: 'John Doe',
      verified: false,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    },
    token: {
      secureToken: 'secureToken',
      refreshToken: 'refreshToken',
      expiresAt: 1000,
    },
  })

  describe.runIf(emulatorIsAvailable)('if emulator is available', () => {
    let service: RestAuthService

    beforeEach(() => {
      service = RestAuthService.forEmulator()
    })

    describe('.signUpWithEmailAndPassword', () => {
      it('should sign up a new user', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`

        // act
        const user = await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(user).toMatchObject({
          id: expect.any(String),
          email: email.toLowerCase(),
          displayName: undefined,
          verified: false,
          createdAt: expect.any(Number),
          lastLoginAt: user.createdAt,
        })
      })

      it('should update current user', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`

        // act
        const user = await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(service.currentUser).toEqual(user)
      })

      it('should inform subscription onUserChanged', async () => {
        // arrange
        const onUserChanged = vi.fn()
        service.onUserChanged(onUserChanged)
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`

        // act
        const user = await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(user)
      })

      it('should persist current user', async () => {
        // arrange
        const persistence = memoryPersistence()
        service.setPersistence(persistence)
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`

        // act
        const user = await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(persistence.memory).toMatchObject({ user })
      })

      it('should throw Firebase error if sign up failed', async () => {
        // arrange
        const email = `no-email`
        const password = `short`

        // act
        const action = service.signUpWithEmailAndPassword({ email, password })

        // assert
        await expect(action).rejects.toBeInstanceOf(FirebaseError)
        await expect(action).rejects.toThrowError('INVALID_EMAIL')
      })
    })

    describe('.signInWithEmailAndPassword', () => {
      let userCreatedAt: number
      let existingUser: AuthUser
      let usedPassword: string

      beforeEach(async () => {
        const anotherService = RestAuthService.forEmulator()
        userCreatedAt = Date.now()
        const id = uid()
        const email = `test.signin.${id}@example.com`
        const displayName = `John Doe (signin ${id})`
        usedPassword = `secret-${id}`
        await anotherService.signUpWithEmailAndPassword({ email, password: usedPassword })
        existingUser = await anotherService.updateProfile({ displayName })
      })

      it('should sign in an existing user', async () => {
        // arrange
        const { email } = existingUser
        const password = usedPassword

        // act
        const user = await service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(user).toMatchObject({
          ...existingUser,
          createdAt: expect.any(Number),
          lastLoginAt: expect.any(Number),
        })
        expect(user.createdAt).toBeGreaterThanOrEqual(userCreatedAt)
        expect(user.createdAt).toBeLessThanOrEqual(existingUser.createdAt)
        expect(user.lastLoginAt).toBeGreaterThan(existingUser.lastLoginAt)
      })

      it('should update current user', async () => {
        // arrange
        const { email } = existingUser
        const password = usedPassword

        // act
        const user = await service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(service.currentUser).toEqual(user)
      })

      it('should inform subscription onUserChanged', async () => {
        // arrange
        const onUserChanged = vi.fn()
        service.onUserChanged(onUserChanged)
        const { email } = existingUser
        const password = usedPassword

        // act
        const user = await service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(user)
      })

      it('should persist current user', async () => {
        // arrange
        const persistence = memoryPersistence()
        service.setPersistence(persistence)
        const { email } = existingUser
        const password = usedPassword

        // act
        const user = await service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(persistence.memory).toMatchObject({ user })
      })

      it('should throw FirebaseError if try to sign in an not-existing user', async () => {
        // arrange
        const email = 'unknown-email@example.com'
        const password = 'any-password'

        // act
        const action = service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(action).rejects.toBeInstanceOf(FirebaseError)
        expect(action).rejects.toThrowError('EMAIL_NOT_FOUND')
      })

      it('should throw FirebaseError if try to sign in with invalid password', async () => {
        // arrange
        const { email } = existingUser
        const password = 'invalid-password'

        // act
        const action = service.signInWithEmailAndPassword({ email, password })

        // assert
        expect(action).rejects.toBeInstanceOf(FirebaseError)
        expect(action).rejects.toThrowError('INVALID_PASSWORD')
      })
    })

    describe('.signOut', () => {
      it('should sign out current user', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        await service.signUpWithEmailAndPassword({ email, password })

        // act
        await service.signOut()

        // assert
        expect(service.currentUser).toBe(null)
      })

      it('should inform subscription onUserChanged', async () => {
        // arrange
        const onUserChanged = vi.fn()
        service.onUserChanged(onUserChanged)
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        await service.signUpWithEmailAndPassword({ email, password })
        onUserChanged.mockClear()

        // act
        await service.signOut()

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(null)
      })

      it('should delete persisted user', async () => {
        // arrange
        const persistence = memoryPersistence()
        service.setPersistence(persistence)
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        await service.signUpWithEmailAndPassword({ email, password })

        // act
        await service.signOut()

        // assert
        expect(persistence.memory).toBe(null)
      })

      it('should allow to sign out if not sign in', async () => {
        // act
        await service.signOut()

        // assert
        expect(service.currentUser).toBe(null)
      })
    })

    describe('.updateProfile', () => {
      let user: AuthUser
      let displayName: string

      beforeEach(async () => {
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        displayName = `John Doe (profile ${id})`
        user = await service.signUpWithEmailAndPassword({ email, password })
      })

      it('should update the profile', async () => {
        // act
        const updated = await service.updateProfile({ displayName })

        // assert
        expect(updated).toMatchObject({
          id: user.id,
          email: user.email,
          displayName,
          verified: false,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        })
      })

      it('should update current user', async () => {
        // act
        const updated = await service.updateProfile({ displayName })

        // assert
        expect(service.currentUser).toEqual(updated)
      })

      it('should inform subscription onUserChanged', async () => {
        // arrange
        const onUserChanged = vi.fn()
        service.onUserChanged(onUserChanged)
        onUserChanged.mockClear()

        // act
        const updated = await service.updateProfile({ displayName })

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(updated)
      })

      it('should update persistence', async () => {
        // arrange
        const persistence = memoryPersistence()
        service.setPersistence(persistence)

        // act
        const updated = await service.updateProfile({ displayName })

        // assert
        expect(persistence.memory).toMatchObject({ user: updated })
      })

      it('should throw Firebase error if sign out before', async () => {
        // arrange
        service.signOut()

        // act
        const action = service.updateProfile({ displayName })

        // assert
        await expect(action).rejects.toBeInstanceOf(FirebaseError)
        await expect(action).rejects.toThrowError('NOT_AUTHORIZED')
      })

      it('should throw Firebase error if sign up failed', async () => {
        // arrange
        const invalidProfile = { displayName: { foo: 'bar' } } as unknown as ProfileUpdateParams

        // act
        const action = service.updateProfile(invalidProfile)

        // assert
        await expect(action).rejects.toBeInstanceOf(FirebaseError)
        await expect(action).rejects.toThrowError(/Invalid JSON/)
      })
    })

    describe('.autoSignIn', () => {
      let persistence: ReturnType<typeof memoryPersistence>
      let onUserChanged: OnUserChanged

      beforeEach(async () => {
        service = RestAuthService.forEmulator()
        persistence = memoryPersistence()
        service.setPersistence(persistence)
        onUserChanged = vi.fn()
        service.onUserChanged(onUserChanged)
      })

      describe('no user is stored', () => {
        it('should not update current user', async () => {
          // arrange
          persistence.memory = null

          // act
          await service.autoSignIn()

          // assert
          expect(service.currentUser).toBe(null)
        })

        it('should inform subscription onUserChanged', async () => {
          // arrange
          persistence.memory = null

          // act
          await service.autoSignIn()

          // assert
          expect(onUserChanged).toHaveBeenCalledTimes(1)
          expect(onUserChanged).toHaveBeenCalledWith(null)
        })

        it('should not change persistence', async () => {
          // arrange
          persistence.memory = null

          // act
          await service.autoSignIn()

          // assert
          expect(persistence.memory).toBe(null)
        })
      })

      describe('invalid user data is stored', () => {
        it('should not update current user', async () => {
          // arrange
          persistence.memory = { invalid: 'user data' }

          // act
          await service.autoSignIn()

          // assert
          expect(service.currentUser).toBe(null)
        })

        it('should inform subscription onUserChanged', async () => {
          // arrange
          persistence.memory = { invalid: 'user data' }

          // act
          await service.autoSignIn()

          // assert
          expect(onUserChanged).toHaveBeenCalledTimes(1)
          expect(onUserChanged).toHaveBeenCalledWith(null)
        })

        it('should delete persistence', async () => {
          // arrange
          persistence.memory = { invalid: 'user data' }

          // act
          await service.autoSignIn()

          // assert
          expect(persistence.memory).toBe(null)
        })
      })

      describe('valid user data is stored', () => {
        it('should set current user to stored user', async () => {
          // arrange
          persistence.memory = sampleUserData

          // act
          await service.autoSignIn()

          // assert
          expect(service.currentUser).toBe(sampleUserData.user)
        })

        it('should inform subscription onUserChanged', async () => {
          // arrange
          persistence.memory = sampleUserData

          // act
          await service.autoSignIn()

          // assert
          expect(onUserChanged).toHaveBeenCalledTimes(1)
          expect(onUserChanged).toHaveBeenCalledWith(sampleUserData.user)
        })

        it('should not change persistence', async () => {
          // arrange
          persistence.memory = sampleUserData

          // act
          await service.autoSignIn()

          // assert
          expect(persistence.memory).toBe(sampleUserData)
        })
      })
    })

    describe('.onUserChanged', () => {
      let onUserChanged: OnUserChanged
      let unsubscribe: Unsubscribe

      beforeEach(() => {
        onUserChanged = vi.fn()
        unsubscribe = service.onUserChanged(onUserChanged)
      })

      it('should initial not inform onUserChanged onUserChanged', async () => {
        // assert
        expect(onUserChanged).not.toHaveBeenCalled()
      })

      it('should inform subscription onUserChanged after auto sign up', async () => {
        // act
        const user = await service.autoSignIn()

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(user)
      })

      it('should inform subscription onUserChanged after sign up', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`

        // act
        const user = await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(1)
        expect(onUserChanged).toHaveBeenCalledWith(user)
      })

      it('should inform subscription onUserChanged after updateProfile', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        const displayName = `John Doe (subscribe ${id})`

        // act
        const user1 = await service.signUpWithEmailAndPassword({ email, password })
        const user2 = await service.updateProfile({ displayName })

        // assert
        expect(onUserChanged).toHaveBeenCalledTimes(2)
        expect(onUserChanged).toHaveBeenNthCalledWith(1, user1)
        expect(onUserChanged).toHaveBeenNthCalledWith(2, user2)
      })

      it('should inform subscription onUserChanged with current user', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        const user = await service.signUpWithEmailAndPassword({ email, password })
        const newOnUserChanged = vi.fn()

        // act
        service.onUserChanged(newOnUserChanged)

        // assert
        expect(newOnUserChanged).toHaveBeenCalledTimes(1)
        expect(newOnUserChanged).toHaveBeenCalledWith(user)
      })

      it('should not inform onUserChanged onUserChanged after it was unsubscribed', async () => {
        // arrange
        const id = uid()
        const email = `test.signup.${id}@example.com`
        const password = `secret-${id}`
        unsubscribe()

        // act
        await service.signUpWithEmailAndPassword({ email, password })

        // assert
        expect(onUserChanged).not.toHaveBeenCalled()
      })
    })

    describe('.setPersistence', () => {
      it('should not persist data, if never logged in (nothing persisted)', async () => {
        // arrange
        const newPersistence = memoryPersistence()

        // act
        await service.setPersistence(newPersistence)

        // assert
        expect(newPersistence.memory).toBe(null)
      })

      it('should not persist data, if never logged in (persisted data)', async () => {
        // arrange
        const newPersistence = memoryPersistence()
        newPersistence.memory = { foo: 'bar' }

        // act
        await service.setPersistence(newPersistence)

        // assert
        expect(newPersistence.memory).toEqual({ foo: 'bar' })
      })

      it('should delete old persistence', async () => {
        // arrange
        const oldPersistence = memoryPersistence()
        oldPersistence.memory = sampleUserData
        await service.setPersistence(oldPersistence)

        const newPersistence = memoryPersistence()

        // act
        await service.setPersistence(newPersistence)

        // assert
        expect(oldPersistence.memory).toBe(null)
      })

      it('should delete persist data, after auto sign (no user)', async () => {
        // arrange
        const oldPersistence = memoryPersistence()
        oldPersistence.memory = null
        await service.setPersistence(oldPersistence)
        await service.autoSignIn()

        const newPersistence = memoryPersistence()
        newPersistence.memory = { foo: 'bar' }

        // act
        await service.setPersistence(newPersistence)

        // assert
        expect(newPersistence.memory).toBe(null)
      })

      it('should persist user, after auto sign (user)', async () => {
        // arrange
        const oldPersistence = memoryPersistence()
        oldPersistence.memory = sampleUserData
        await service.setPersistence(oldPersistence)
        await service.autoSignIn()

        const newPersistence = memoryPersistence()

        // act
        await service.setPersistence(newPersistence)

        // assert
        expect(newPersistence.memory).toEqual(sampleUserData)
      })
    })
  })
})
