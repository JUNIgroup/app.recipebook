/* eslint-disable @typescript-eslint/no-shadow */
import { Owner, createEffect, createRoot, getOwner, runWithOwner } from 'solid-js'
import { memoryPersistence } from '../../../infrastructure/firebase/persistence'
import { UserData } from '../service/auth-service'
import { MockAuthService } from '../service/mock-auth-service'
import { AuthState, createAuthStore } from './auth-store'
import { ServiceError } from '../../error/service-error'

describe('AuthStore', () => {
  const user1: UserData = Object.freeze({
    id: 'user-id-001',
    name: 'user-name',
    email: 'user-email',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  })

  const user2: UserData = Object.freeze({
    id: 'user-id-002',
    name: 'user-name',
    email: 'user-email',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  })

  let authService: MockAuthService
  let emailPersistance: ReturnType<typeof memoryPersistence>
  let root: { owner: Owner | null; dispose: () => void }

  beforeEach(() => {
    authService = new MockAuthService()
    emailPersistance = memoryPersistence()
  })

  beforeEach(() => {
    root = createRoot((dispose) => ({ owner: getOwner(), dispose }))
  })

  afterEach(() => {
    root?.dispose?.()
  })

  function runInRoot<T>(action: () => T) {
    let result!: T
    runWithOwner(root.owner, () => {
      result = action()
    })
    return result
  }

  it('should create an instance of AuthStore', () => {
    // act
    const authStore = runInRoot(() => createAuthStore(authService, emailPersistance))

    // assert
    expect(authStore).toBeTruthy()
  })

  it('should initial state with no user', () => {
    // arrange
    authService.setMockUser(null)
    emailPersistance.memory = null

    // act
    const { authState } = runInRoot(() => createAuthStore(authService, emailPersistance))

    // assert
    expect(authState).toEqual({
      authInProgress: false,
      authEmail: null,
      authUser: null,
      authError: null,
    })
  })

  it('should initial state with user', () => {
    // arrange
    authService.setMockUser(user1)
    emailPersistance.memory = 'persistance-email'

    // act
    const { authState } = runInRoot(() => createAuthStore(authService, emailPersistance))

    // assert
    expect(authState).toEqual({
      authInProgress: false,
      authEmail: 'persistance-email',
      authUser: user1,
      authError: null,
    })
  })

  describe('isAuthorized', () => {
    it('should return true, if user is set', () => {
      // arrange
      authService.setMockUser(user1)
      const { isAuthorized } = runInRoot(() => createAuthStore(authService, emailPersistance))

      // act
      const result = isAuthorized()

      // assert
      expect(result).toBe(true)
    })

    it('should return false, if user is null', () => {
      // arrange
      authService.setMockUser(null)
      const { isAuthorized } = runInRoot(() => createAuthStore(authService, emailPersistance))

      // act
      const result = isAuthorized()

      // assert
      expect(result).toBe(false)
    })

    it('should switch on user changes', () => {
      // arrange
      authService.setMockUser(null)
      const { isAuthorized } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const authorized: boolean[] = []
      runInRoot(() => createEffect(() => authorized.push(isAuthorized())))

      // act
      authService.setMockUser(null)
      authService.setMockUser(user1)
      authService.setMockUser(user2)
      authService.setMockUser(null)

      // assert
      expect(authorized).toEqual([false, true, false])
    })
  })

  describe('selectUserId', () => {
    it('should return user ID, if user is set', () => {
      // arrange
      authService.setMockUser(user1)
      const { selectUserId } = runInRoot(() => createAuthStore(authService, emailPersistance))

      // act
      const result = selectUserId()

      // assert
      expect(result).toBe(user1.id)
    })

    it('should return null, if user is null', () => {
      // arrange
      authService.setMockUser(null)
      const { selectUserId } = runInRoot(() => createAuthStore(authService, emailPersistance))

      // act
      const result = selectUserId()

      // assert
      expect(result).toBe(null)
    })

    it('should switch on user changes', () => {
      // arrange
      authService.setMockUser(null)
      const { selectUserId } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const userIds: (string | null)[] = []
      runInRoot(() => createEffect(() => userIds.push(selectUserId())))

      // act
      authService.setMockUser(null)
      authService.setMockUser(user1)
      authService.setMockUser(user2)
      authService.setMockUser(null)

      // assert
      expect(userIds).toEqual([null, user1.id, user2.id, null])
    })
  })

  describe('signIn', () => {
    it.each`
      rememberMe
      ${true}
      ${false}
    `('should update state, if rememberMe is $rememberMe and signIn succeeds', async ({ rememberMe }) => {
      // arrange
      emailPersistance.memory = 'anything'
      const { authState, signIn } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const emailAddress = 'email@example.com'
      const expectedUser = expect.objectContaining({
        id: emailAddress,
        email: emailAddress,
        name: emailAddress,
      })

      // act
      await signIn(emailAddress, 'password', { rememberMe })

      // assert
      expect(states).toHaveLength(5)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: expectedUser,
        authError: null,
      })
      expect(states[3]).toEqual({
        authInProgress: true,
        authEmail: rememberMe ? emailAddress : null,
        authUser: expectedUser,
        authError: null,
      })
      expect(states[4]).toEqual({
        authInProgress: false,
        authEmail: rememberMe ? emailAddress : null,
        authUser: expectedUser,
        authError: null,
      })
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should set persisted email, if rememberMe is $rememberMe and signIn succeeds', async ({ rememberMe }) => {
      // arrange
      emailPersistance.memory = 'anything'
      const { signIn } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const emailAddress = 'email@example.com'

      // act
      await signIn(emailAddress, 'password', { rememberMe })

      // assert
      expect(emailPersistance.memory).toBe(rememberMe ? emailAddress : null)
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should update state, if rememberMe is $rememberMe and signIn fails', async ({ rememberMe }) => {
      // arrange
      const { authState, signIn } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const emailAddress = 'email@example.com'
      const error = new ServiceError('auth-service', 'sign-in failed')
      vi.spyOn(authService, 'signInWithEmailAndPassword').mockRejectedValue(error)

      // act
      const result = signIn(emailAddress, 'password', { rememberMe })

      // assert
      await expect(result).rejects.toThrow('sign-in failed')
      expect(states).toHaveLength(3)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: expect.objectContaining({
          service: error.service,
          plainMessage: error.plainMessage,
        }),
      })
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should not set persisted email, if rememberMe is $rememberMe and signIn fails', async ({ rememberMe }) => {
      // arrange
      const { signIn } = runInRoot(() => createAuthStore(authService, emailPersistance))
      emailPersistance.memory = 'anything'
      const emailAddress = 'email@example.com'
      const error = new ServiceError('auth-service', 'sign-in failed')
      vi.spyOn(authService, 'signInWithEmailAndPassword').mockRejectedValue(error)

      // act
      const result = signIn(emailAddress, 'password', { rememberMe })

      // assert
      await expect(result).rejects.toThrow('sign-in failed')
      expect(emailPersistance.memory).toBe('anything')
    })
  })

  describe('signUp', () => {
    it.each`
      rememberMe
      ${true}
      ${false}
    `('should update state, if rememberMe is $rememberMe and signUp succeeds', async ({ rememberMe }) => {
      // arrange
      emailPersistance.memory = 'anything'
      const { authState, signUp } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const emailAddress = 'email@example.com'
      const expectedUser = expect.objectContaining({
        id: emailAddress,
        email: emailAddress,
        name: 'my name',
      })

      // act
      await signUp('my name', emailAddress, 'password', { rememberMe })

      // assert
      expect(states).toHaveLength(5)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: expectedUser,
        authError: null,
      })
      expect(states[3]).toEqual({
        authInProgress: true,
        authEmail: rememberMe ? emailAddress : null,
        authUser: expectedUser,
        authError: null,
      })
      expect(states[4]).toEqual({
        authInProgress: false,
        authEmail: rememberMe ? emailAddress : null,
        authUser: expectedUser,
        authError: null,
      })
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should set persisted email, if rememberMe is $rememberMe and signUp succeeds', async ({ rememberMe }) => {
      // arrange
      emailPersistance.memory = 'anything'
      const { signUp } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const emailAddress = 'email@example.com'

      // act
      await signUp('my name', emailAddress, 'password', { rememberMe })

      // assert
      expect(emailPersistance.memory).toBe(rememberMe ? emailAddress : null)
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should update state, if rememberMe is $rememberMe and signUp fails', async ({ rememberMe }) => {
      // arrange
      const { authState, signUp } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const emailAddress = 'email@example.com'
      const error = new ServiceError('auth-service', 'sign-up failed')
      vi.spyOn(authService, 'signUpWithEmailAndPassword').mockRejectedValue(error)

      // act
      const result = signUp('my name', emailAddress, 'password', { rememberMe })

      // assert
      await expect(result).rejects.toThrow('sign-up failed')
      expect(states).toHaveLength(3)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: expect.objectContaining({
          service: error.service,
          plainMessage: error.plainMessage,
        }),
      })
    })

    it.each`
      rememberMe
      ${true}
      ${false}
    `('should not set persisted email, if rememberMe is $rememberMe and signUp fails', async ({ rememberMe }) => {
      // arrange
      const { signUp } = runInRoot(() => createAuthStore(authService, emailPersistance))
      emailPersistance.memory = 'anything'
      const emailAddress = 'email@example.com'
      const error = new ServiceError('auth-service', 'sign-up failed')
      vi.spyOn(authService, 'signUpWithEmailAndPassword').mockRejectedValue(error)

      // act
      const result = signUp('my name', emailAddress, 'password', { rememberMe })

      // assert
      await expect(result).rejects.toThrow('sign-up failed')
      expect(emailPersistance.memory).toBe('anything')
    })
  })

  describe('signOut', () => {
    it('should update state, if signOut succeeds', async () => {
      // arrange
      emailPersistance.memory = 'anything'
      authService.setMockUser(user1)
      const { authState, signOut } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))

      // act
      await signOut()

      // assert
      expect(states).toHaveLength(4)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: expect.objectContaining(user1),
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: expect.objectContaining(user1),
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
      expect(states[3]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: null,
        authError: null,
      })
    })

    it('should not set persisted email, if signOut succeeds', async () => {
      // arrange
      emailPersistance.memory = 'anything'
      const { signOut } = runInRoot(() => createAuthStore(authService, emailPersistance))

      // act
      await signOut()

      // assert
      expect(emailPersistance.memory).toBe('anything')
    })

    it('should update state, if signOut fails', async () => {
      // arrange
      emailPersistance.memory = 'anything'
      authService.setMockUser(user1)
      const { authState, signOut } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const error = new ServiceError('auth-service', 'sign-out failed')
      vi.spyOn(authService, 'logout').mockRejectedValue(error)

      // act
      const result = signOut()

      // assert
      await expect(result).rejects.toThrow('sign-out failed')
      expect(states).toHaveLength(3)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: expect.objectContaining(user1),
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: 'anything',
        authUser: expect.objectContaining(user1),
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: false,
        authEmail: 'anything',
        authUser: expect.objectContaining(user1),
        authError: expect.objectContaining({
          service: error.service,
          plainMessage: error.plainMessage,
        }),
      })
    })
  })

  describe('resetPassword', () => {
    it('should update state, if resetPassword succeeds', async () => {
      // arrange
      const { authState, resetPassword } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const emailAddress = 'email@example.com'

      // act
      await resetPassword(emailAddress)

      // assert
      expect(states).toHaveLength(3)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: null,
      })
    })

    it('should update state, if resetPassword fails', async () => {
      // arrange
      const { authState, resetPassword } = runInRoot(() => createAuthStore(authService, emailPersistance))
      const states: AuthState[] = []
      runInRoot(() => createEffect(() => states.push({ ...authState })))
      const error = new ServiceError('auth-service', 'reset password failed')
      vi.spyOn(authService, 'resetPassword').mockRejectedValue(error)
      const emailAddress = 'email@example.com'

      // act
      const result = resetPassword(emailAddress)

      // assert
      await expect(result).rejects.toThrow('reset password failed')
      expect(states).toHaveLength(3)
      expect(states[0]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[1]).toEqual({
        authInProgress: true,
        authEmail: null,
        authUser: null,
        authError: null,
      })
      expect(states[2]).toEqual({
        authInProgress: false,
        authEmail: null,
        authUser: null,
        authError: expect.objectContaining({
          service: error.service,
          plainMessage: error.plainMessage,
        }),
      })
    })
  })
})
