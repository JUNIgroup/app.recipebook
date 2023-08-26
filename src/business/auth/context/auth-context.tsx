import { ParentComponent, createContext, untrack, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { ServiceErrorDto, toServiceErrorDto } from '../../error/service-error'
import { AuthError, AuthService, LoginOptions, UserData } from '../service/auth-service'
import { AuthPersistence } from '../../../infrastructure/firebase/persistence'

export type AuthState = {
  authInProgress: boolean
  authEmail: string | null
  authUser: UserData | null
  authError: AuthErrorDto | null
}

export type AuthActions = {
  signIn(email: string, password: string, options?: LoginOptions): Promise<void>
  signUp(name: string, email: string, password: string, options?: LoginOptions): Promise<void>
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
}

export const AuthContext = createContext<[AuthState, AuthActions]>(undefined, { name: 'AuthContext' })

type AuthProps = {
  authService: AuthService
  emailPersistence: AuthPersistence
}

export type AuthErrorDto = ServiceErrorDto<AuthError>

export const AuthContextProvider: ParentComponent<AuthProps> = (props) => {
  const authService = untrack(() => props.authService)
  const emailPersistence = untrack(() => props.emailPersistence)

  const [state, updateState] = createStore<AuthState>({
    authInProgress: false,
    authEmail: emailPersistence.load(),
    authUser: null,
    authError: null,
  })

  authService.observeUser((user) => {
    updateState('authUser', user)
  })

  async function processAuth(action: () => Promise<void>) {
    updateState('authInProgress', true)
    try {
      await action()
      updateState('authError', null)
    } catch (error) {
      updateState('authError', toServiceErrorDto(error as AuthError))
    } finally {
      updateState('authInProgress', false)
    }
  }

  // async function

  const auth: [AuthState, AuthActions] = [
    state,
    {
      signIn(email, password, options) {
        return processAuth(async () => {
          await authService.signInWithEmailAndPassword(email, password, options)
          emailPersistence.save(options?.rememberMe ? email : null)
        })
      },
      signUp(name, email, password, options) {
        return processAuth(async () => {
          await authService.signUpWithEmailAndPassword(name, email, password, options)
          emailPersistence.save(options?.rememberMe ? email : null)
        })
      },
      signOut() {
        return processAuth(() => authService.logout())
      },
      resetPassword(email) {
        return processAuth(() => authService.resetPassword(email))
      },
    },
  ]
  return <AuthContext.Provider value={auth}>{props.children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext: cannot find a AuthContext')
  }
  return context
}
