import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useSignInHandler, useSignUpHandler, useResetPasswordHandler } from '../atoms/auth'
import { FormUserAtom } from './form-user'

export const LoginControl = () => {
  const user = useAtomValue(FormUserAtom)
  const signIn = useSignInHandler()
  const signUp = useSignUpHandler()
  const resetPassword = useResetPasswordHandler()
  const singInHandler = () => signIn.handler(user.email, user.password)
  const singUpHandler = () => signUp.handler(user.name, user.email, user.password)
  const resetPasswordHandler = () => resetPassword.handler(user.email)
  useEffect(() => {
    signIn.reset()
    signUp.reset()
    resetPassword.reset()
  }, [user])
  return (
    <>
      <button type="button" onClick={singInHandler} disabled={signIn.result.inProgress}>
        Sign-In
      </button>
      <div className={signIn.result.failed ? 'auth-result error' : 'auth-result hide'}>
        Sign-In failed - try later again: {`${signIn.result.error}`}
      </div>
      <button type="button" onClick={singUpHandler} disabled={signUp.result.inProgress}>
        Sign-Up
      </button>
      <div className={signUp.result.failed ? 'auth-result error' : 'auth-result hide'}>
        Sign-Up failed - try later again: {`${signUp.result.error}`}
      </div>
      <button type="button" onClick={resetPasswordHandler} disabled={resetPassword.result.inProgress}>
        Send reset password email
      </button>
      <div className={resetPassword.result.failed ? 'auth-result error' : 'auth-result hide'}>
        Send email failed: {`${signUp.result.error}`}
      </div>
    </>
  )
}
