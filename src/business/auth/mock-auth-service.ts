import { AuthService, Subscription, UserData } from './auth-service'

export class MockAuthService implements AuthService {
  private user: UserData | null = null

  private subscriptions: Subscription<UserData | null>[] = []

  setMockUser(user: UserData | null) {
    this.user = user
    this.subscriptions.forEach((subscription) => subscription(this.user))
  }

  async signUpWithEmailAndPassword(name: string, email: string): Promise<void> {
    const user: UserData = {
      id: email,
      name,
      email,
    }
    this.setMockUser(user)
  }

  async signInWithEmailAndPassword(email: string): Promise<void> {
    const user: UserData = {
      id: email,
      name: email,
      email,
    }
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
      const user: UserData = {
        ...this.user,
        [key]: value,
      }
      this.setMockUser(user)
      // return user
    }
  }
}
