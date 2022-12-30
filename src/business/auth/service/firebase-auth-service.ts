import {
  Auth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  indexedDBLocalPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateEmail,
  updatePassword,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth'
import { FirebaseService } from '../../../infrastructure/firebase/firebase-service'
import { ServiceLogger } from '../../logger/logger'
import { AuthService, LoginOptions, Subscription, UserData } from './auth-service'
import { toAuthError, toUserData } from './firebase-auth-helper'

const serviceName = 'FirebaseAuthService'

const createLogger = ServiceLogger(serviceName)

export class FirebaseAuthService implements AuthService {
  private auth: Auth

  private userData: UserData | null = null

  private subscriptions: Subscription<UserData | null>[] = []

  constructor(private firebase: FirebaseService) {
    this.auth = firebase.getAuth()
    onAuthStateChanged(this.auth, (user) => this.updateUser(user))
  }

  private updateUser(user: User | null) {
    const logger = createLogger('change user', user ? user.email : '-')
    this.userData = user ? toUserData(user) : null

    logger.log('user: %o', this.userData)
    this.subscriptions.forEach((subscription) => subscription(this.userData))
    logger.end()
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
      const auth = this.firebase.getAuth()

      await setPersistence(auth, options.rememberLogin ? browserLocalPersistence : inMemoryPersistence)
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })
      this.updateUser(userCredential.user)
      logger.log('logged in as user: %o', userCredential.user)
    } catch (error) {
      logger.error('login failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  async signInWithEmailAndPassword(email: string, password: string, options: LoginOptions = {}): Promise<void> {
    const logger = createLogger('signInWithEmailAndPassword', email)
    logger.log('options: %o', options)
    try {
      const auth = this.firebase.getAuth()

      await setPersistence(auth, options.rememberLogin ? indexedDBLocalPersistence : inMemoryPersistence)
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password)
      logger.log('logged in as user: %o', userCredential.user)
    } catch (error) {
      logger.error('login failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  isLogin(): boolean {
    return this.auth.currentUser !== null
  }

  get currentUser() {
    return this.userData
  }

  observeUser(subscription: Subscription<UserData | null>) {
    this.subscriptions.push(subscription)
    return () => this.subscriptions.splice(this.subscriptions.indexOf(subscription))
  }

  async logout(): Promise<void> {
    const logger = createLogger('logout')
    try {
      const auth = this.firebase.getAuth()
      await signOut(auth)
    } catch (error) {
      logger.error('logout failed: %o', error)
    } finally {
      logger.end()
    }
  }

  async deleteAccount() {
    const user = this.auth.currentUser
    if (!user?.email) return

    const logger = createLogger('delete Account', user.email)
    try {
      await deleteUser(user)
    } catch (error) {
      logger.error('delete account failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  async changeName(newName: string) {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changeName', newName)
    try {
      await updateProfile(user, { displayName: newName })
      this.updateUser(this.auth.currentUser)
    } catch (error) {
      logger.error('update failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  async changeEmail(newEmail: string) {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changeEmail', newEmail)
    try {
      await updateEmail(user, newEmail)
      this.updateUser(this.auth.currentUser)
    } catch (error) {
      logger.error('update failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  async changePassword(newPassword: string) {
    const user = this.auth.currentUser
    if (!user) return

    const logger = createLogger('changePassword', '...')
    try {
      await updatePassword(user, newPassword)
    } catch (error) {
      logger.error('update failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }

  async resetPassword(email: string) {
    const logger = createLogger('resetPassword', email)
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      logger.error('send reset email failed: %o', error)
      throw toAuthError(serviceName, error)
    } finally {
      logger.end()
    }
  }
}
