import { ParentComponent, createContext, useContext } from 'solid-js'
import { SetStoreFunction, createStore } from 'solid-js/store'
import { useAuthContext } from '../../../business/auth'

export type LoginData = {
  name: string
  email: string
  rememberMe: boolean
}

const LoginDataContext = createContext<[LoginData, SetStoreFunction<LoginData>]>(undefined, {
  name: 'LoginDataContext',
})

export const LoginDataContextProvider: ParentComponent = (props) => {
  const [authState] = useAuthContext()
  const [loginData, updateLoginData] = createStore<LoginData>({
    name: '',
    email: authState.authEmail ?? '',
    rememberMe: !!authState.authEmail,
  })
  return <LoginDataContext.Provider value={[loginData, updateLoginData]}>{props.children}</LoginDataContext.Provider>
}

export const useLoginDataContext = () => {
  const loginDataContext = useContext(LoginDataContext)
  if (loginDataContext == null) throw new Error('useLoginDataContext: cannot find a LoginDataContext')
  return loginDataContext
}
