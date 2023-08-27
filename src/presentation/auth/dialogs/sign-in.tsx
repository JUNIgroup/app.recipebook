import { Component, JSX } from 'solid-js'
import { useAuthContext } from '../../../business/auth'
import { logMount } from '../../utils/log-mount'
import {
  ContinueSubmit,
  EmailInput,
  ErrorMessage,
  PasswordInput,
  RememberMeInput,
  ResetPasswordLink,
  SignUpLink,
} from './elements'

export const SignInDialog: Component = () => {
  logMount('SignInDialog')
  const { authState, signIn } = useAuthContext()

  const handleSubmit: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = !!formData.get('remember-me')

    signIn(email, password, { rememberMe: rememberLogin })
  }

  return (
    <div class="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={authState.authError} />
        <ContinueSubmit />
      </form>
      <ResetPasswordLink />
      <SignUpLink />
    </div>
  )
}
