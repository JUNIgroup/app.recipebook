import { createEffect } from 'solid-js'
import { batchWithDevtools, createStoreWithDevtools } from '../../../devtools'
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
  const [authState, updateState] = createStoreWithDevtools<AuthState>(
    {
      authInProgress: false,
      authEmail: emailPersistence.load(),
      authUser: null,
      authError: null,
    },
    {
      name: 'AuthStore',
    },
  )

  authService.observeUser((user) => {
    updateState('authUser', user)
  })

  createEffect(() => {
    emailPersistence.save(authState.authEmail)
  })

  const isAuthorized: AuthStore['isAuthorized'] = () => !!authState.authUser

  const selectUserId: AuthStore['selectUserId'] = () => authState.authUser?.id ?? null

  async function processAuth(action: string, payload: unknown, actionFn: () => Promise<void>) {
    batchWithDevtools(action, payload, () => {
      updateState('authInProgress', true)
    })
    try {
      await actionFn()
      batchWithDevtools(`${action}:success`, {}, () => {
        updateState('authError', null)
        updateState('authInProgress', false)
      })
    } catch (error) {
      const authError = error as AuthError
      batchWithDevtools(`${action}:failed`, { code: authError.code, message: authError.message }, () => {
        updateState('authError', toServiceErrorDto(error as AuthError))
        updateState('authInProgress', false)
      })
      throw error
    }
  }

  const signIn: AuthStore['signIn'] = async (email, password, options) => {
    await processAuth('signIn', { email, options }, async () => {
      await authService.signInWithEmailAndPassword(email, password, options)
      updateState('authEmail', options?.rememberMe ? email : null)
    })
  }

  const signUp: AuthStore['signUp'] = async (name, email, password, options) => {
    await processAuth('signUp', { name, email, options }, async () => {
      await authService.signUpWithEmailAndPassword(name, email, password, options)
      updateState('authEmail', options?.rememberMe ? email : null)
    })
  }

  const signOut: AuthStore['signOut'] = async () => {
    await processAuth('signOut', {}, async () => {
      await authService.logout()
    })
  }

  const resetPassword: AuthStore['resetPassword'] = async (email) => {
    await processAuth('resetPassword', { email }, async () => {
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
