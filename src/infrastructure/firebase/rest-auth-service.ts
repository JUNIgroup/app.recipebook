import axios from 'axios'
import { ServiceLogger } from '../logger/logger'
import { FirebaseError } from './firebase-error'
import { extractResponseData, requestErrorHandler } from './helpers/data-request'
import { AccountEndpoints, createEmulatorEndpoints, createRemoteEndpoints } from './helpers/endpoints'
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
  DeleteAccountResponse,
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

const createLogger = ServiceLogger('RestAuthService')

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
  private authData: AuthData | null | undefined

  private persistence: AuthPersistence = nonePersistence()

  private subscriptions: OnUserChanged[] = []

  /**
   * Creates a new instance of the RestAuthService, using the remote endpoints for the firebase auth service.
   *
   * @param apiKey the api key for the firebase project
   * @returns a new instance of the RestAuthService for the project.
   */
  public static forRemote(apiKey: string) {
    const endpoints = createRemoteEndpoints(apiKey)
    return new RestAuthService(endpoints)
  }

  /**
   * Creates a new instance of the RestAuthService, using the endpoints for the firebase auth emulator.
   *
   * @returns a new instance of the RestAuthService.
   * @throws an error if the firebase auth emulator is not running.
   */
  public static forEmulator() {
    const endpoints = createEmulatorEndpoints()
    return new RestAuthService(endpoints)
  }

  constructor(private endpoints: Promise<AccountEndpoints>) {}

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
    const logger = createLogger('setPersistence', persistence.name)
    try {
      await this.persistence.save(null) // clear the old persistence
      this.persistence = persistence
      if (this.authData !== undefined) {
        await this.persistence.save(this.authData)
      }
    } finally {
      logger.end()
    }
  }

  /**
   * Tries to login the user with the persisted user.
   *
   * @returns the user that was logged in or null if no user was persisted.
   */
  async autoSignIn(): Promise<AuthUser | null> {
    const logger = createLogger('autoSignIn')
    try {
      const authData = await this.persistence.load()
      if (!authData) {
        logger.log('No persisted user found.')
        await this.setAuthData(null)
        return null
      }

      assertAuthData(authData)
      logger.log('Persisted user found: %o', authData.user)
      await this.setAuthData(authData)
      return authData.user
    } catch (error) {
      logger.log('Persisted user is invalid.')
      await this.setAuthData(null)
      return null
    } finally {
      logger.end()
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
    const logger = createLogger('signOut', this.authData ? this.authData.user.email : '-')
    try {
      await this.setAuthData(null)
      return null
    } finally {
      logger.end()
    }
  }

  /**
   * Creates a new user with the given email and password and login this new user.
   *
   * @param email the email address of the new user
   * @param password the password of the new user
   * @returns the user that was created and logged in
   */
  async signUpWithEmailAndPassword({ email, password }: EmailAndPassword): Promise<AuthUser> {
    const logger = createLogger('signUp', email)
    const { signUpWithPassword: signUpUrl, lookupProfile: profileUrl } = await this.endpoints

    try {
      const signUpPayload = { email, password, returnSecureToken: true }
      const signUpResponse = await axios
        .post<SignupNewUserResponse>(signUpUrl, signUpPayload)
        .then(extractResponseData(logger, assertSignupNewUserResponse))
        .catch(requestErrorHandler(logger))

      const profilePayload = { idToken: signUpResponse.idToken }
      const profileResponse = await axios
        .post<GetAccountInfoResponse>(profileUrl, profilePayload)
        .then(extractResponseData(logger, assertGetAccountInfoResponse))
        .catch(requestErrorHandler(logger))
        .catch(() => null) // ignore errors

      const authData = RestAuthService.convertSignupNewUserResponse(signUpResponse, profileResponse)
      await this.setAuthData(authData)
      return authData.user
    } finally {
      logger.end()
    }
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

  async updateProfile(profileChange: ProfileUpdateParams): Promise<AuthUser> {
    const authData = this.enforceAuthorized()
    const logger = createLogger('updateProfile', authData.user.email)
    const { updateProfile: updateProfileUrl } = await this.endpoints

    try {
      const payload = { ...profileChange, idToken: authData.token.secureToken, returnSecureToken: true }
      const response = await axios
        .post<SetAccountInfoResponse>(updateProfileUrl, payload)
        .then(extractResponseData(logger, assertSetAccountInfoResponse))
        .catch(requestErrorHandler(logger))

      const newAuthData = RestAuthService.convertProfileUpdateResponse(authData, response)
      await this.updateAuthData(newAuthData)
      return newAuthData.user
    } finally {
      logger.end()
    }
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
   * @returns
   */
  async signInWithEmailAndPassword({ email, password }: EmailAndPassword): Promise<AuthUser> {
    const logger = createLogger('signUp', email)
    const { signInWithPassword: signInUrl, lookupProfile: profileUrl } = await this.endpoints

    try {
      const signInPayload = { email, password, returnSecureToken: true }
      const signInResponse = await axios
        .post<VerifyPasswordResponse>(signInUrl, signInPayload)
        .then(extractResponseData(logger, assertVerifyPasswordResponse))
        .catch(requestErrorHandler(logger))

      const profilePayload = { idToken: signInResponse.idToken }
      const profileResponse = await axios
        .post<GetAccountInfoResponse>(profileUrl, profilePayload)
        .then(extractResponseData(logger, assertGetAccountInfoResponse))
        .catch(requestErrorHandler(logger))

      const authData = RestAuthService.convertVerifyPasswordResponse(signInResponse, profileResponse)
      await this.setAuthData(authData)
      return authData.user
    } finally {
      logger.end()
    }
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
    const logger = createLogger('deleteAccount', authData.user.email)
    const { deleteAccount: deleteAccountUrl } = await this.endpoints

    try {
      const payload = { idToken: authData.token.secureToken }
      await axios
        .post<DeleteAccountResponse>(deleteAccountUrl, payload)
        .then(extractResponseData(logger, assertDeleteAccountResponse))
        .catch(requestErrorHandler(logger))

      await this.setAuthData(null)
    } finally {
      logger.end()
    }
  }
}
