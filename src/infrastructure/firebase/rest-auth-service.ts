import axios from 'axios'
import { ServiceLogger } from '../logger/logger'
import { FirebaseError } from './firebase-error'
import { extractResponseData, requestErrorHandler } from './helpers/data-request'
import { AccountEndpoints, createEmulatorEndpoints, createRemoteEndpoints } from './helpers/endpoints'
import {
  AuthData,
  AuthToken,
  AuthUser,
  isAuthData,
  isProfileUpdateResponse,
  isSignUpResponse,
  ProfileUpdateParams,
  ProfileUpdateResponse,
  SignUpResponse,
} from './helpers/rest-types'
import { deepEqual, expiresAt } from './helpers/utilities'
import { AuthPersistence, nonePersistence } from './persistence'

export type { AuthUser } from './helpers/rest-types'

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

      if (!isAuthData(authData)) {
        logger.log('Persisted user is invalid.')
        await this.setAuthData(null)
        return null
      }

      logger.log('Persisted user found: %o', authData.user)
      await this.setAuthData(authData)
      return authData.user
    } finally {
      logger.end()
    }
  }

  get currentUser(): AuthUser | null {
    return this.authData ? Object.freeze(this.authData.user) : null
  }

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
   * @param persistence the persistence to use to persist the user
   * @returns the user that was created and logged in
   */
  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUser> {
    const logger = createLogger('signUp', email)
    const { signUp: signUpUrl } = await this.endpoints
    const payload = { email, password, returnSecureToken: true }

    try {
      const response = await axios
        .post<SignUpResponse>(signUpUrl, payload)
        .then(extractResponseData(logger, isSignUpResponse))
        .catch(requestErrorHandler(logger))

      const authData = RestAuthService.convertSignUpResponse(response)
      await this.setAuthData(authData)
      return authData.user
    } finally {
      logger.end()
    }
  }

  private static convertSignUpResponse(response: SignUpResponse): AuthData {
    const { localId: id, email, idToken, refreshToken, expiresIn } = response
    const now = Date.now()
    const user: AuthUser = { id, email, displayName: undefined, verified: false, createdAt: now, lastLoginAt: now }
    const token: AuthToken = { secureToken: idToken, refreshToken, expiresAt: expiresAt(now, expiresIn) }
    return { user, token }
  }

  async updateProfile(profileChange: ProfileUpdateParams): Promise<AuthUser> {
    const authData = this.enforceAuthorized()
    const logger = createLogger('updateProfile', authData.user.email)
    const { updateProfile: updateProfileUrl } = await this.endpoints
    const payload = { ...profileChange, idToken: authData.token.secureToken, returnSecureToken: true }

    try {
      const response = await axios
        .post<ProfileUpdateResponse>(updateProfileUrl, payload)
        .then(extractResponseData(logger, isProfileUpdateResponse))
        .catch(requestErrorHandler(logger))

      const newAuthData = RestAuthService.convertProfileUpdateResponse(authData, response)
      await this.updateAuthData(newAuthData)
      return newAuthData.user
    } finally {
      logger.end()
    }
  }

  private static convertProfileUpdateResponse(authData: AuthData, response: ProfileUpdateResponse): AuthData {
    const { email, displayName } = response
    const user: AuthUser = { ...authData.user, email, displayName }
    return { ...authData, user }
  }
}
