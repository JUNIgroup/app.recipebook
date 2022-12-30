/* eslint-disable jsx-a11y/label-has-associated-control */
import { getAuthError } from '../../../business/auth/auth.selectors'
import * as fromAuth from '../../../business/auth/auth.thunks'
import { useAppDispatch, useAppSelector } from '../../store.hooks'
import {
  ContinueSubmit,
  EmailInput,
  ErrorMessage,
  PasswordInput,
  RememberMeInput,
  ResetPasswordLink,
  SignUpLink,
} from './elements'

export const SignInDialog = () => {
  const dispatch = useAppDispatch()
  const authError = useAppSelector(getAuthError)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = !!formData.get('remember-me')

    dispatch(fromAuth.signIn(email, password, { rememberLogin }))
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={authError} />
        <ContinueSubmit />
      </form>
      <ResetPasswordLink />
      <SignUpLink />
    </div>
  )
}
