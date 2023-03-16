import { Log, Logger } from '../../utilities/logger'
import { FirebaseError } from './firebase-error'
import { fetchErrorHandler, requestJson } from './helpers/data-request'
import { AccountEndpoints, createEmulatorAccountEndpoints, createRemoteAccountEndpoints } from './helpers/endpoints'
import {
  assertAuthData,
  assertDeleteAccountResponse,
  assertGetAccountInfoResponse,
  assertSetAccountInfoResponse,
  assertSignupNewUserResponse,
  assertVerifyPasswordResponse,
  AuthData,
  AuthToken,
  AuthUser,
  GetAccountInfoResponse,
  ProfileUpdateParams,
  SetAccountInfoResponse,
  SignupNewUserResponse,
  VerifyPasswordResponse,
} from './helpers/rest-types'
import { deepEqual, expiresAt } from './helpers/utilities'
import { AuthPersistence, nonePersistence } from './persistence'

export type { AuthUser } from './helpers/rest-types'

interface EmailAndPassword {
  email: string
  password: string
}

export type OnUserChanged = (user: AuthUser | null) => void
export type Unsubscribe = () => void

type UserOf<T extends AuthData | null> = T extends AuthData ? AuthUser : null

function userOf(data: AuthData | null): UserOf<AuthData>
function userOf<T extends AuthData | null>(data: T) {
  return data?.user ?? null
}

/**
 * Using the REST api of firebase to implement authorization.
 *
 * @see https://firebase.google.com/docs/reference/rest/auth
 */
export class RestAuthService {
  private log: Log

  private authData: AuthData | null | undefined

  private persistence: AuthPersistence = nonePersistence()

  private subscriptions: OnUserChanged[] = []

  constructor(logger: Logger<'infra'>, private endpoints: Promise<AccountEndpoints>) {
    this.log = logger('infra:RestAuthService')
  }

  private enforceAuthorized(): AuthData {
    if (!this.authData) {
      throw new FirebaseError('NOT_AUTHORIZED')
    }
    return this.authData
  }

  onUserChanged(subscription: OnUserChanged): Unsubscribe {
    this.subscriptions.push(subscription)
    if (this.authData !== undefined) {
      subscription(userOf(this.authData))
    }
    return () => this.subscriptions.splice(this.subscriptions.lastIndexOf(subscription), 1)
  }

  private async setAuthData<T extends AuthData | null>(newAuthData: T): Promise<void> {
    const oldAuthData = this.authData

    this.authData = newAuthData
    await this.persistence.save(newAuthData)
    this.informSubscribers(oldAuthData, newAuthData)
  }

  private async updateAuthData(newAuthData: AuthData): Promise<void> {
    const oldAuthData = this.authData
    if (oldAuthData == null || oldAuthData.user.id !== newAuthData.user.id) throw new FirebaseError('NOT_AUTHORIZED')

    this.authData = newAuthData
    await this.persistence.save(newAuthData)
    this.informSubscribers(oldAuthData, newAuthData)
  }

  private informSubscribers(oldAuthData: AuthData | null | undefined, newAuthData: AuthData | null) {
    const newUser = userOf(newAuthData)
    if (oldAuthData === undefined || !deepEqual(userOf(oldAuthData), newUser)) {
      this.subscriptions.forEach((subscription) => subscription(newUser))
    }
  }

  /**
   * Change the persistence.
   *
   * Removes the user from the old persistence
   * and immediately saves the user to the new persistence.
   *
   * @param persistence the persistence to use to save the user
   */
  async setPersistence(persistence: AuthPersistence): Promise<void> {
    this.log.info('setPersistence', persistence.name)
    await this.persistence.save(null) // clear the old persistence
    this.persistence = persistence
    if (this.authData !== undefined) {
      await this.persistence.save(this.authData)
    }
  }

  /**
   * Tries to login the user with the persisted user.
   *
   * @returns the user that was logged in or null if no user was persisted.
   */
  async autoSignIn(): Promise<AuthUser | null> {
    this.log.info('autoSignIn')
    try {
      const authData = await this.persistence.load()
      if (!authData) {
        this.log.details('No persisted user found.')
        await this.setAuthData(null)
        return null
      }

      assertAuthData(authData)
      this.log.details('Persisted user found:', authData.user)
      await this.setAuthData(authData)
      return authData.user
    } catch (error) {
      this.log.error('Persisted user is invalid.')
      await this.setAuthData(null)
      return null
    }
  }

  /**
   * Get the logged in user or null if no user is logged in.
   *
   * @returns the logged in user or null if no user is logged in.
   */
  get currentUser(): AuthUser | null {
    return this.authData ? Object.freeze(this.authData.user) : null
  }

  /**
   * Log out the current user.
   */
  async signOut(): Promise<null> {
    this.log.info('signOut', this.authData ? this.authData.user.email : '-')
    await this.setAuthData(null)
    return null
  }

  /**
   * Creates a new user with the given email and password and login this new user.
   *
   * @param email the email address of the new user
   * @param password the password of the new user
   * @returns the user that was created and logged in
   */
  async signUpWithEmailAndPassword({ email, password }: EmailAndPassword): Promise<AuthUser> {
    this.log.info('signUp', email)
    const endpoints = await this.endpoints

    const signUpResponse = await requestJson({
      method: 'POST',
      url: endpoints.signUpWithPassword,
      body: { email, password, returnSecureToken: true },
      validate: assertSignupNewUserResponse,
    }).catch(fetchErrorHandler(this.log))

    const profileResponse = await requestJson({
      method: 'POST',
      url: endpoints.lookupProfile,
      body: { idToken: signUpResponse.idToken },
      validate: assertGetAccountInfoResponse,
    })
      .catch(fetchErrorHandler(this.log))
      .catch(() => null)

    const authData = RestAuthService.convertSignupNewUserResponse(signUpResponse, profileResponse)
    await this.setAuthData(authData)
    return authData.user
  }

  private static convertSignupNewUserResponse(
    response: SignupNewUserResponse,
    accountInfoResponse: GetAccountInfoResponse | null,
  ): AuthData {
    const now = Date.now()
    const { localId: id, email, idToken, refreshToken, expiresIn } = response
    const { createdAt = now, lastLoginAt = now } = accountInfoResponse?.users[0] ?? {}
    const user: AuthUser = {
      id,
      email,
      displayName: undefined,
      verified: false,
      createdAt: +createdAt,
      lastLoginAt: +lastLoginAt,
    }
    const token: AuthToken = {
      secureToken: idToken,
      refreshToken,
      expiresAt: expiresAt(+lastLoginAt, expiresIn),
    }
    return { user, token }
  }

  /**
   * Update the profile of the current user.
   *
   * @param profileChange the changes to apply to the profile
   * @returns the updated user
   * @throws FirebaseError if the user is not logged in
   */
  async updateProfile(profileChange: ProfileUpdateParams): Promise<AuthUser> {
    const authData = this.enforceAuthorized()
    this.log.info('updateProfile', authData.user.email)
    this.log.details('change:', profileChange)
    const endpoints = await this.endpoints

    const response = await requestJson({
      method: 'POST',
      url: endpoints.updateProfile,
      body: { ...profileChange, idToken: authData.token.secureToken, returnSecureToken: true },
      validate: assertSetAccountInfoResponse,
    }).catch(fetchErrorHandler(this.log))

    const newAuthData = RestAuthService.convertProfileUpdateResponse(authData, response)
    await this.updateAuthData(newAuthData)
    return newAuthData.user
  }

  private static convertProfileUpdateResponse(authData: AuthData, response: SetAccountInfoResponse): AuthData {
    const { email, displayName } = response
    const user: AuthUser = { ...authData.user, email, displayName }
    return { ...authData, user }
  }

  /**
   * Login an existing user with the given email and password.
   *
   * @param email the email address of the user
   * @param password the password of the user
   * @returns the logged in user
   */
  async signInWithEmailAndPassword({ email, password }: EmailAndPassword): Promise<AuthUser> {
    this.log.info('signIn', email)
    const endpoints = await this.endpoints

    const signInResponse = await requestJson({
      method: 'POST',
      url: endpoints.signInWithPassword,
      body: { email, password, returnSecureToken: true },
      validate: assertVerifyPasswordResponse,
    }).catch(fetchErrorHandler(this.log))

    const profileResponse = await requestJson({
      method: 'POST',
      url: endpoints.lookupProfile,
      body: { idToken: signInResponse.idToken },
      validate: assertGetAccountInfoResponse,
    }).catch(fetchErrorHandler(this.log))

    const authData = RestAuthService.convertVerifyPasswordResponse(signInResponse, profileResponse)
    await this.setAuthData(authData)
    return authData.user
  }

  private static convertVerifyPasswordResponse(
    verifyResponse: VerifyPasswordResponse,
    accountInfoResponse: GetAccountInfoResponse,
  ): AuthData {
    const { localId: id, email, idToken, refreshToken, expiresIn } = verifyResponse
    const { displayName, emailVerified: verified, createdAt, lastLoginAt } = accountInfoResponse.users[0]
    const user: AuthUser = {
      id,
      email,
      displayName,
      verified,
      createdAt: +createdAt,
      lastLoginAt: +lastLoginAt,
    }
    const token: AuthToken = {
      secureToken: idToken,
      refreshToken,
      expiresAt: expiresAt(+lastLoginAt, expiresIn),
    }
    return { user, token }
  }

  async deleteAccountPermanently(): Promise<void> {
    const authData = this.enforceAuthorized()
    this.log.info('deleteAccount', authData.user.email)
    const endpoints = await this.endpoints

    await requestJson({
      method: 'POST',
      url: endpoints.deleteAccount,
      body: { idToken: authData.token.secureToken },
      validate: assertDeleteAccountResponse,
    }).catch(fetchErrorHandler(this.log))

    await this.setAuthData(null)
  }
}

/**
 * Creates a new instance of the RestAuthService, using the remote endpoints for the firebase auth service.
 *
 * @param apiKey the api key for the firebase project
 * @returns a new instance of the RestAuthService for the project.
 */
export function createRestAuthServiceForRemote(logger: Logger<'infra'>, apiKey: string) {
  const endpoints = createRemoteAccountEndpoints(apiKey)
  return new RestAuthService(logger, endpoints)
}

/**
 * Creates a new instance of the RestAuthService, using the endpoints for the firebase auth emulator.
 *
 * @returns a new instance of the RestAuthService.
 * @throws an error if the firebase auth emulator is not running.
 */
export function createRestAuthServiceForEmulator(logger: Logger<'infra'>) {
  const endpoints = createEmulatorAccountEndpoints()
  return new RestAuthService(logger, endpoints)
}
