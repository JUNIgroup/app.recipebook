import { ParentComponent, createContext, untrack, useContext } from 'solid-js'
import { createStore } from 'solid-js/store'
import { ServiceErrorDto, toServiceErrorDto } from '../../error/service-error'
import { AuthError, AuthService, LoginOptions, UserData } from '../service/auth-service'

export type AuthState = {
  authInProgress: boolean
  authUser: UserData | null
  authError: AuthErrorDto | null
}

export type AuthActions = {
  signIn(email: string, password: string, options?: LoginOptions): void
  signUp(name: string, email: string, password: string, options?: LoginOptions): void
  signOut(): Promise<void>
  resetPassword(email: string): Promise<void>
}

export const AuthContext = createContext<[AuthState, AuthActions]>(undefined, { name: 'AuthContext' })

type AuthProps = {
  authService: AuthService
}

export type AuthErrorDto = ServiceErrorDto<AuthError>

export const AuthContextProvider: ParentComponent<AuthProps> = (props) => {
  const authService = untrack(() => props.authService)

  const [state, updateState] = createStore<AuthState>({
    authInProgress: false,
    authUser: null,
    authError: null,
  })

  authService.observeUser((user) => {
    updateState('authUser', user)
  })

  const auth: [AuthState, AuthActions] = [
    state,
    {
      signIn() {
        updateState('authInProgress', true)
        updateState('authInProgress', false)
      },
      signUp() {
        updateState('authInProgress', true)
        updateState('authInProgress', false)
      },
      async signOut() {
        updateState('authInProgress', true)
        try {
          await authService.logout()
          updateState('authError', null)
        } catch (error) {
          updateState('authError', toServiceErrorDto(error as AuthError))
        }
        updateState('authInProgress', false)
      },
      async resetPassword() {
        throw new Error('Not implemented')
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
