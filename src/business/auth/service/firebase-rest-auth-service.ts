import { AuthPersistence } from '../../../infrastructure/firebase/persistence'
import { AuthUser, RestAuthService } from '../../../infrastructure/firebase/rest-auth-service'
import { ServiceLogger } from '../../../infrastructure/logger/logger'
import { AuthService, LoginOptions, Subscription, UserData } from './auth-service'

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
      const persistence = options.rememberLogin ? this.persistence.permanent : this.persistence.temporary
      await this.auth.setPersistence(persistence)
      let user = await this.auth.createUserWithEmailAndPassword(email, password)
      user = await this.updateProfileSilently(user, { displayName: name })
      this.updateUser(user)
      logger.log('logged in as user: %o', user)
    } catch (error) {
      logger.error('login failed: %o', error)
      // throw toAuthError(serviceName, error)
      throw error
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
  signInWithEmailAndPassword(email: string, password: string, options?: LoginOptions | undefined): Promise<void> {
    throw new Error('Method not implemented.')
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
  deleteAccount(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  changeName(newName: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  changeEmail(newEmail: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  changePassword(newPassword: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  resetPassword(email: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
