import { atom, useAtomValue } from 'jotai'
import { useCallback } from 'react'
import { AuthService, UserData } from '../../business/auth/auth-service'
import { usePromiseHandler } from '../utils/use-promise-handler'
import { atomWithSubscription } from './atom-with-subscription'
import { serviceAtom } from './service-atom'

/** Atom to access the Auth Service */
export const AuthServiceAtom = serviceAtom<AuthService>()

/** Represents the current user of the Auth Service */
export const UserAtom = atomWithSubscription<UserData | null>(
  (get) => {
    const service = get(AuthServiceAtom)
    return service.currentUser
  },
  (subscriber, get) => {
    const service = get(AuthServiceAtom)
    return service.observeUser(subscriber)
  },
)

/** Hook to access to UserAtom */
export const useUser = () => useAtomValue(UserAtom)

/** Atom to access the Login Status (true ... user != null, false: user == null) */
export const LoginStatusAtom = atom((get) => get(UserAtom) != null)

/** Hook to access the Login Status (true ... user != null, false: user == null) */
export const useLoginStatus = () => useAtomValue(LoginStatusAtom)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPromiseHandler = (...args: any[]) => Promise<any>

type AuthPromiseHandlers = {
  [K in keyof AuthService as AuthService[K] extends AnyPromiseHandler ? K : never]: AuthService[K]
}

const useAuthHandler =
  <N extends keyof AuthPromiseHandlers, FN extends AnyPromiseHandler = AuthPromiseHandlers[N]>(fn: N) =>
  () => {
    const service = useAtomValue(AuthServiceAtom)
    return usePromiseHandler<Parameters<FN>, Awaited<ReturnType<FN>>>(
      useCallback<FN>(service[fn].bind(service) as FN, [service]),
    )
  }

/** Hook to access logout function  */
export const useLogoutHandler = useAuthHandler('logout')

/** Hook to access sign-in function  */
export const useSignInHandler = useAuthHandler('signInWithEmailAndPassword')

/** Hook to access sign-up function  */
export const useSignUpHandler = useAuthHandler('signUpWithEmailAndPassword')

/** Hook to access delete account function  */
export const useDeleteAccountHandler = useAuthHandler('deleteAccount')

/** Hook to access change name function  */
export const useChangeNameHandler = useAuthHandler('changeName')

/** Hook to access change email function  */
export const useChangeEmailHandler = useAuthHandler('changeEmail')

/** Hook to access change password function  */
export const useChangePasswordHandler = useAuthHandler('changePassword')

/** Hook to access reset password function  */
export const useResetPasswordHandler = useAuthHandler('resetPassword')
