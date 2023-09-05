import { EffectOptions, ParentComponent, createContext, untrack } from 'solid-js'
import { AuthPersistence } from '../../../infrastructure/firebase/persistence'
import { useExistingContext } from '../../helper/context/use-exiting-context'
import { AuthService } from '../service/auth-service'
import { AuthStore, createAuthStore } from './auth-store'

const authOptions: EffectOptions = { name: 'AuthContext' }
export const AuthContext = createContext<AuthStore>(undefined, authOptions)

type AuthContextProps = {
  authService: AuthService
  emailPersistence: AuthPersistence
}

export const AuthContextProvider: ParentComponent<AuthContextProps> = (props) => {
  const authService = untrack(() => props.authService)
  const emailPersistence = untrack(() => props.emailPersistence)
  const authStore = createAuthStore(authService, emailPersistence)
  return <AuthContext.Provider value={authStore}>{props.children}</AuthContext.Provider>
}

export const useAuthContext = useExistingContext(AuthContext, authOptions)
