import type { PropsWithChildren } from 'react'
import { createContext, useContext, useState } from 'react'
import { getRememberedEmail } from '../../../business/auth/auth.selectors'
import { useAppSelector } from '../../store.hooks'

export type LoginData = {
  name: string
  email: string
  rememberMe: boolean
}

export type LoginDataState = [LoginData, React.Dispatch<React.SetStateAction<LoginData>>]

const LoginDataContext = createContext<LoginDataState | undefined>(undefined)

export const LoginDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const rememberedEmail = useAppSelector(getRememberedEmail)
  const loginDataState = useState<LoginData>({
    name: '',
    email: rememberedEmail ?? '',
    rememberMe: !!rememberedEmail,
  })
  return <LoginDataContext.Provider value={loginDataState}>{children}</LoginDataContext.Provider>
}

export const useLoginData = () => {
  const loginDataState = useContext(LoginDataContext)
  if (loginDataState == null) throw new Error('Please wrap your component in a LoginDataContext')
  return loginDataState
}
