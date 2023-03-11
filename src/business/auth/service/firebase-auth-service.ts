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
import { Log, Logger } from '../../../utilities/logger'
import { AuthService, LoginOptions, Subscription, UserData } from './auth-service'
import { toAuthError, toUserData } from './firebase-auth-helper'

const serviceName = 'FirebaseAuthService'

export class FirebaseAuthService implements AuthService {
  private log: Log

  private auth: Auth

  private userData: UserData | null = null

  private subscriptions: Subscription<UserData | null>[] = []

  constructor(private firebase: FirebaseService, logger: Logger<'business'>) {
    this.auth = firebase.getAuth()
    this.log = logger('business:FirebaseAuthService')
    onAuthStateChanged(this.auth, (user) => this.updateUser(user))
  }

  private updateUser(user: User | null) {
    this.log.info('updateUser', user ? user.email : '-')
    this.userData = user ? toUserData(user) : null

    this.log.details('user', this.userData)
    this.subscriptions.forEach((subscription) => subscription(this.userData))
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
      const auth = this.firebase.getAuth()

      await setPersistence(auth, options.rememberMe ? browserLocalPersistence : inMemoryPersistence)
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })
      this.updateUser(userCredential.user)
      this.log.details('logged in as user', userCredential.user)
    } catch (error) {
      this.log.error('login failed', error)
      throw toAuthError(serviceName, error)
    }
  }

  async signInWithEmailAndPassword(email: string, password: string, options: LoginOptions = {}): Promise<void> {
    this.log.info('signIn', email)
    this.log.details('options', options)
    try {
      const auth = this.firebase.getAuth()

      await setPersistence(auth, options.rememberMe ? indexedDBLocalPersistence : inMemoryPersistence)
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password)
      this.log.details('logged in as user', userCredential.user)
    } catch (error) {
      this.log.error('login failed', error)
      throw toAuthError(serviceName, error)
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
    this.log.info('logout')
    try {
      const auth = this.firebase.getAuth()
      await signOut(auth)
    } catch (error) {
      this.log.error('logout failed', error)
    }
  }

  async deleteAccount() {
    const user = this.auth.currentUser
    if (!user?.email) return

    this.log.info('deleteAccount', user.email)
    try {
      await deleteUser(user)
    } catch (error) {
      this.log.error('delete account failed', error)
      throw toAuthError(serviceName, error)
    }
  }

  async changeName(newName: string) {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changeName', newName)
    try {
      await updateProfile(user, { displayName: newName })
      this.updateUser(this.auth.currentUser)
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(serviceName, error)
    }
  }

  async changeEmail(newEmail: string) {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changeEmail', newEmail)
    try {
      await updateEmail(user, newEmail)
      this.updateUser(this.auth.currentUser)
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(serviceName, error)
    }
  }

  async changePassword(newPassword: string) {
    const user = this.auth.currentUser
    if (!user) return

    this.log.info('changePassword', '...')
    try {
      await updatePassword(user, newPassword)
    } catch (error) {
      this.log.error('update failed', error)
      throw toAuthError(serviceName, error)
    }
  }

  async resetPassword(email: string) {
    this.log.info('resetPassword', email)
    try {
      await sendPasswordResetEmail(this.auth, email)
    } catch (error) {
      this.log.error('send reset email failed', error)
      throw toAuthError(serviceName, error)
    }
  }
}
