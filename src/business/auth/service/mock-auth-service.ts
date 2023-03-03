import { AuthService, Subscription, UserData } from './auth-service'

export class MockAuthService implements AuthService {
  private emailToUser: Record<string, UserData> = {}

  private user: UserData | null = null

  private subscriptions: Subscription<UserData | null>[] = []

  setMockUser(user: UserData | null) {
    this.user = user
    this.subscriptions.forEach((subscription) => subscription(this.user))
  }

  async signUpWithEmailAndPassword(name: string, email: string): Promise<void> {
    const now = Date.now()
    const user: UserData = {
      id: email,
      name,
      email,
      createdAt: now,
      lastLoginAt: now,
    }
    this.emailToUser[email] = user
    this.setMockUser(user)
  }

  async signInWithEmailAndPassword(email: string): Promise<void> {
    const now = Date.now()
    const user: UserData = this.emailToUser[email] ?? {
      id: email,
      name: email,
      email,
      createdAt: now,
      lastLoginAt: now,
    }
    user.lastLoginAt = now
    this.emailToUser[email] = user
    this.setMockUser(user)
  }

  isLogin(): boolean {
    return this.user !== null
  }

  get currentUser() {
    return this.user
  }

  observeUser(subscription: Subscription<UserData | null>) {
    this.subscriptions.push(subscription)
    subscription(this.user)
    return () => this.subscriptions.splice(this.subscriptions.indexOf(subscription))
  }

  async logout(): Promise<void> {
    this.setMockUser(null)
  }

  async deleteAccount() {
    if (this.user && this.user.email) {
      this.setMockUser(null)
    }
  }

  changeName(value: string) {
    return this.change('name', value)
  }

  changeEmail(value: string) {
    return this.change('email', value)
  }

  async changePassword() {
    this.setMockUser(this.user)
  }

  // eslint-disable-next-line class-methods-use-this
  async resetPassword() {
    // nothing to to in this mock.
  }

  private async change(key: keyof UserData, value: string) {
    if (this.user) {
      delete this.emailToUser[this.user.email]
      const user: UserData = {
        ...this.user,
        [key]: value,
      }
      this.emailToUser[this.user.email] = user
      this.setMockUser(user)
      // return user
    }
  }
}
