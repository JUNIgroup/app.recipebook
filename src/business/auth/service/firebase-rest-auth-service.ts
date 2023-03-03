import { AuthPersistence } from '../../../infrastructure/firebase/persistence'
import { AuthUser, RestAuthService } from '../../../infrastructure/firebase/rest-auth-service'
import { ServiceLogger } from '../../../infrastructure/logger/logger'
import { AuthService, LoginOptions, Subscription, UserData } from './auth-service'
import { toAuthError } from './firebase-rest-auth-errors'

const createLogger = ServiceLogger('FirebaseRestAuthService')

export class FirebaseRestAuthService implements AuthService {
  private userData: UserData | null | undefined

  private subscriptions: Subscription<UserData | null>[] = []

  constructor(
    private auth: RestAuthService,
    private persistence: { permanent: AuthPersistence; temporary: AuthPersistence },
  ) {
    this.auth.onUserChanged((user) => this.updateUser(user))
    this.autoSignIn()
  }

  private updateUser(user: AuthUser | null) {
    const logger = createLogger('change user', user ? user.email : '-')
    const userData =
      user === null
        ? null
        : {
            id: user.id,
            email: user.email,
            name: user.displayName ?? user.email,
            verified: user.verified,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
          }
    logger.log('user: %o', userData)
    this.userData = userData
    this.subscriptions.forEach((subscription) => subscription(userData))
    logger.end()
  }

  private async autoSignIn() {
    await this.auth.setPersistence(this.persistence.permanent)
    await this.auth.autoSignIn()
  }

  async signUpWithEmailAndPassword(
    name: string,
    email: string,
    password: string,
    options: LoginOptions = {},
  ): Promise<void> {
    const logger = createLogger('signUpWithEmailAndPassword', email)
    logger.log('name: %o', name)
    logger.log('options: %o', options)
    try {
      const persistence = options.rememberMe ? this.persistence.permanent : this.persistence.temporary
      await this.auth.setPersistence(persistence)
      let user = await this.auth.signUpWithEmailAndPassword({ email, password })
      user = await this.updateProfileSilently(user, { displayName: name })
      logger.log('logged in as user: %o', user)
    } catch (error) {
      logger.error('login failed: %o', error)
      throw toAuthError(error)
    } finally {
      logger.end()
    }
  }

  private async updateProfileSilently(user: AuthUser, profileChange: { displayName?: string }): Promise<AuthUser> {
    const logger = createLogger('updateProfile', user.email)
    try {
      const updatedUser = await this.auth.updateProfile(profileChange)
      logger.log('updated profile: %o', updatedUser)
      return updatedUser
    } catch (error) {
      logger.error('update profile failed: %o', error)
      return user
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async signInWithEmailAndPassword(email: string, password: string, options: LoginOptions = {}): Promise<void> {
    const logger = createLogger('signInWithEmailAndPassword', email)
    logger.log('options: %o', options)
    try {
      const persistence = options.rememberMe ? this.persistence.permanent : this.persistence.temporary
      await this.auth.setPersistence(persistence)
      const user = await this.auth.signInWithEmailAndPassword({ email, password })
      logger.log('logged in as user: %o', user)
    } catch (error) {
      logger.error('login failed: %o', error)
      throw toAuthError(error)
    } finally {
      logger.end()
    }
  }

  isLogin(): boolean {
    return this.auth.currentUser !== null
  }

  get currentUser(): UserData | null {
    return this.userData ?? null
  }

  observeUser(subscription: Subscription<UserData | null>) {
    this.subscriptions.push(subscription)
    if (this.userData !== undefined) subscription(this.userData)
    return () => this.subscriptions.splice(this.subscriptions.indexOf(subscription))
  }

  async logout(): Promise<void> {
    const logger = createLogger('logout')
    try {
      await this.auth.signOut()
    } catch (error) {
      logger.error('logout failed: %o', error)
    } finally {
      logger.end()
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async deleteAccount(): Promise<void> {
    const logger = createLogger('deleteAccount')
    try {
      await this.auth.deleteAccountPermanently()
    } catch (error) {
      logger.error('delete account failed: %o', error)
      // throw toAuthError(serviceName, error)
      throw error
    } finally {
      logger.end()
    }
  }

  async changeName(newName: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changeName', newName)
    try {
      await this.auth.updateProfile({ displayName: newName })
    } catch (error) {
      logger.error('update failed: %o', error)
      throw toAuthError(error)
    } finally {
      logger.end()
    }
  }

  async changeEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changeEmail', newEmail)
    try {
      await this.auth.updateProfile({ email: newEmail })
    } catch (error) {
      logger.error('update failed: %o', error)
      // throw toAuthError(serviceName, error)
      throw error
    } finally {
      logger.end()
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changePassword', '...')
    try {
      await this.auth.updateProfile({ password: newPassword })
    } catch (error) {
      logger.error('update failed: %o', error)
      throw toAuthError(error)
    } finally {
      logger.end()
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  resetPassword(email: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
