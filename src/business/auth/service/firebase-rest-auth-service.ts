import { AuthPersistence } from '../../../infrastructure/firebase/persistence'
import { AuthUser, RestAuthService } from '../../../infrastructure/firebase/rest-auth-service'
import { Log, Logger } from '../../../utilities/logger'
import { AuthService, LoginOptions, Subscription, UserData } from './auth-service'
import { toAuthError } from './firebase-rest-auth-errors'

export class FirebaseRestAuthService implements AuthService {
  private log: Log

  private userData: UserData | null | undefined

  private subscriptions: Subscription<UserData | null>[] = []

  constructor(
    private auth: RestAuthService,
    logger: Logger<'business'>,
    private persistence: { permanent: AuthPersistence; temporary: AuthPersistence },
  ) {
    this.log = logger('business:FirebaseRestAuthService')
    this.auth.onUserChanged((user) => this.updateUser(user))
    this.autoSignIn()
  }

  private updateUser(user: AuthUser | null) {
    this.log.info('updateUser', user ? user.email : '-')
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
    this.log.details('user', userData)
    this.userData = userData
    this.subscriptions.forEach((subscription) => subscription(userData))
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
    this.log.info('signUp', email)
    this.log.details('name', name)
    this.log.details('options', options)
    try {
      const persistence = options.rememberMe ? this.persistence.permanent : this.persistence.temporary
      await this.auth.setPersistence(persistence)
      let user = await this.auth.signUpWithEmailAndPassword({ email, password })
      user = await this.updateProfileSilently(user, { displayName: name })
      this.log.details('logged in as user', user)
    } catch (error) {
      this.log.error('login failed', error)
      throw toAuthError(error)
    }
  }

  private async updateProfileSilently(user: AuthUser, profileChange: { displayName?: string }): Promise<AuthUser> {
    this.log.details('update profile of', user.email)
    try {
      const updatedUser = await this.auth.updateProfile(profileChange)
      this.log.details('updated to: ', updatedUser)
      return updatedUser
    } catch (error) {
      this.log.error('update profile failed', error)
      return user
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async signInWithEmailAndPassword(email: string, password: string, options: LoginOptions = {}): Promise<void> {
    this.log.info('signIn', email)
    this.log.details('options', options)
    try {
      const persistence = options.rememberMe ? this.persistence.permanent : this.persistence.temporary
      await this.auth.setPersistence(persistence)
      const user = await this.auth.signInWithEmailAndPassword({ email, password })
      this.log.details('logged in as user', user)
    } catch (error) {
      this.log.error('login failed', error)
      throw toAuthError(error)
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
    this.log.info('logout')
    try {
      await this.auth.signOut()
    } catch (error) {
      this.log.error('logout failed', error)
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  async deleteAccount(): Promise<void> {
    this.log.info('deleteAccount')
    try {
      await this.auth.deleteAccountPermanently()
    } catch (error) {
      this.log.error('delete account failed', error)
      throw toAuthError(error)
    }
  }

  async changeName(newName: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changeName', newName)
    try {
      await this.auth.updateProfile({ displayName: newName })
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(error)
    }
  }

  async changeEmail(newEmail: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changeEmail', newEmail)
    try {
      await this.auth.updateProfile({ email: newEmail })
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(error)
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changePassword', '...')
    try {
      await this.auth.updateProfile({ password: newPassword })
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(error)
    }
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  resetPassword(email: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
