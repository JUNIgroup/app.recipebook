import { Component, JSX } from 'solid-js'
import { useAuthContext } from '../../../business/auth'
import { logMount } from '../../utils/log-mount'
import {
  ContinueSubmit,
  EmailInput,
  ErrorMessage,
  NameInput,
  PasswordInput,
  RememberMeInput,
  SignInLink,
} from './elements'

export const SignUpDialog: Component = () => {
  logMount('SignUpDialog')
  const { authState, signUp } = useAuthContext()

  const handleSubmit: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = true

    signUp(name, email, password, { rememberMe: rememberLogin })
  }

  return (
    <div class="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Create your account</h2>
        <NameInput />
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={authState.authError} />
        <ContinueSubmit />
      </form>
      <SignInLink />
    </div>
  )
}
