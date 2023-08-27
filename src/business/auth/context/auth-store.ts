import { batch, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import { AuthPersistence } from '../../../infrastructure/firebase/persistence'
import { ServiceErrorDto, toServiceErrorDto } from '../../error/service-error'
import { AuthError, AuthService, LoginOptions, UserData } from '../service/auth-service'

export type AuthErrorDto = ServiceErrorDto<AuthError>

export type AuthState = {
  authInProgress: boolean
  authEmail: string | null
  authUser: UserData | null
  authError: AuthErrorDto | null
}

export interface AuthStore {
  authState: AuthState

  isAuthorized(): boolean
  selectUserId(): string | null

  signIn(email: string, password: string, options?: LoginOptions): Promise<void>
  signUp(name: string, email: string, password: string, options?: LoginOptions): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
}

export function createAuthStore(authService: AuthService, emailPersistence: AuthPersistence): AuthStore {
  const [authState, updateState] = createStore<AuthState>({
    authInProgress: false,
    authEmail: emailPersistence.load(),
    authUser: null,
    authError: null,
  })

  authService.observeUser((user) => {
    updateState('authUser', user)
  })

  createEffect(() => {
    emailPersistence.save(authState.authEmail)
  })

  const isAuthorized: AuthStore['isAuthorized'] = () => !!authState.authUser

  const selectUserId: AuthStore['selectUserId'] = () => authState.authUser?.id ?? null

  async function processAuth(action: () => Promise<void>) {
    updateState('authInProgress', true)
    try {
      await action()
      batch(() => {
        updateState('authError', null)
        updateState('authInProgress', false)
      })
    } catch (error) {
      batch(() => {
        updateState('authError', toServiceErrorDto(error as AuthError))
        updateState('authInProgress', false)
      })
      throw error
    }
  }

  const signIn: AuthStore['signIn'] = async (email, password, options) => {
    await processAuth(async () => {
      await authService.signInWithEmailAndPassword(email, password, options)
      updateState('authEmail', options?.rememberMe ? email : null)
    })
  }

  const signUp: AuthStore['signUp'] = async (name, email, password, options) => {
    await processAuth(async () => {
      await authService.signUpWithEmailAndPassword(name, email, password, options)
      updateState('authEmail', options?.rememberMe ? email : null)
    })
  }

  const signOut: AuthStore['signOut'] = async () => {
    await processAuth(async () => {
      await authService.logout()
    })
  }

  const resetPassword: AuthStore['resetPassword'] = async (email) => {
    await processAuth(async () => {
      await authService.resetPassword(email)
    })
  }

  return {
    authState,

    isAuthorized,
    selectUserId,

    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
