import { useAtomValue } from 'jotai'
import { LoginStatusAtom } from '../atoms/auth'

export const AuthStatus = () => {
  const loginStatus = useAtomValue(LoginStatusAtom)
  return loginStatus ? <span>✔️</span> : <span>❌</span>
}
