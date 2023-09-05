import { ServiceError } from '../../error/service-error'

export type LoginOptions = {
  /** if set to `true`, persist login state (some time) and email */
  rememberMe?: boolean
}

export type UserData = {
  id: string
  name: string
  email: string
  verified?: boolean
  createdAt: number
  lastLoginAt: number
}

export type AuthErrorCode =
  /** Sign-in with an non existing or deleted user */
  | 'auth/user-not-found'
  /** Sign-in existing user with invalid credentials / password */
  | 'auth/invalid-credential'
  /** Sign-in too many tries, try later */
  | 'auth/too-many-tries'
  /** Sign-up with email of an already existing user */
  | 'auth/user-already-exist'
  /** Service currently not available, e.g. no network access, auth server is down */
  | 'auth/service-not-available'

export type Subscription<T> = (value: T) => void
export type Unsubscribe = () => void

/**
 * An error thrown by an auth service.
 */
export class AuthError extends ServiceError {
  /**
   * @param service the name of the service
   * @param code a code to identify the kind of the auth problem
   * @param plainMessage the error message
   * @param options additional error options
   */
  constructor(
    service: string,
    public readonly code: AuthErrorCode,
    plainMessage: string,
    options?: ErrorOptions,
  ) {
    super(service, plainMessage, options)
  }
}

export interface AuthService {
  /**
   * Creates a new user account and login with this account
   *
   * @param name the name to display in the UI
   * @param email the email assigned to the account, used to verify the account
   * @param password the initial password for the account
   * @param options additional {@link LoginOptions}
   */
  signUpWithEmailAndPassword(
    name: string, //
    email: string,
    password: string,
    options?: LoginOptions,
  ): Promise<void>

  /**
   * Login to an existing user account
   *
   * @param email the email assigned to the account
   * @param password the current password for the account
   * @param options additional {@link LoginOptions}
   */
  signInWithEmailAndPassword(
    email: string, //
    password: string,
    options?: LoginOptions,
  ): Promise<void>

  /**
   * Check if the user is login
   *
   * @return true if used login
   */
  isLogin(): boolean

  /**
   * Get information to the user currently logged in.
   *
   * @return the user information or `null`
   */
  get currentUser(): UserData | null

  /**
   * Register a callback, called each time the user logged in or out or
   * the user information changed.
   *
   * @param subscription the callback to register
   * @return a function to unregister the callback
   */
  observeUser(subscription: Subscription<UserData | null>): Unsubscribe

  /**
   * Logout the user.
   */
  logout(): Promise<void>

  /**
   * Delete account if user is logged in with the given email
   */
  deleteAccount(): Promise<void>

  /**
   * Update the name of the user currently logged in.
   *
   * @param newName the new name
   */
  changeName(newName: string): Promise<void>

  /**
   * Update the email of the user currently logged in.
   *
   * @param newEmail the new email
   */
  changeEmail(newEmail: string): Promise<void>

  /**
   * Update the password of the user currently logged in.
   *
   * @param newPassword the new password
   */
  changePassword(newPassword: string): Promise<void>

  /**
   * Trigger to send an email to reset the password.
   *
   * @param email the email assigned to the account
   */
  resetPassword(email: string): Promise<void>
}
