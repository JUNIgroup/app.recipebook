/* eslint-disable jsx-a11y/label-has-associated-control */
import * as fromAuth from '../../../business/auth'
import { useAppDispatch, useAppSelector } from '../../store.hooks'
import {
  ContinueSubmit,
  EmailInput,
  ErrorMessage,
  NameInput,
  PasswordInput,
  RememberMeInput,
  SignInLink,
} from './elements'

export const SignUpDialog = () => {
  const dispatch = useAppDispatch()
  const authError = useAppSelector(fromAuth.selectAuthError)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = true

    dispatch(fromAuth.signUp(name, email, password, { rememberLogin }))
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Create your account</h2>
        <NameInput />
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={authError} />
        <ContinueSubmit />
      </form>
      <SignInLink />
    </div>
  )
}
