import { useNavigate } from '@solidjs/router'
import { Component, JSX } from 'solid-js'
import { useAuthContext } from '../../../business/auth/reactives/auth-context'
import { ContinueSubmit, EmailInput, ErrorMessage, Message, RememberPasswordLink } from './elements'

export const ResetPasswordDialog: Component = () => {
  const [authState, authActions] = useAuthContext()
  const navigate = useNavigate()

  const handleSubmit: JSX.EventHandler<HTMLFormElement, Event> = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    authActions.resetPassword(email).then(() => navigate('/login/sign-in'))
  }

  return (
    <div class="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <Message>We will send you an email with a link to set a new password.</Message>
        <EmailInput />
        <ErrorMessage error={authState.authError} />
        <ContinueSubmit />
      </form>
      <RememberPasswordLink />
    </div>
  )
}
