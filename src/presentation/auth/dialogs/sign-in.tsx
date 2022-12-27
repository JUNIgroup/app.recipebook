/* eslint-disable jsx-a11y/label-has-associated-control */
import { useSignInHandler } from '../../atoms/auth'
import {
  EmailInput,
  PasswordInput,
  RememberMeInput,
  ResetPasswordLink,
  SignUpLink,
  ContinueSubmit,
  ErrorMessage,
} from './elements'
import { useNavigateContinue } from './utilities'

export const SignInDialog = () => {
  const navigateContinue = useNavigateContinue()
  const signIn = useSignInHandler({ onSuccess: navigateContinue })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = !!formData.get('remember-me')

    signIn.handler(email, password, { rememberLogin })
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Welcome back</h2>
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={signIn.result.error} />
        <ContinueSubmit />
      </form>
      <ResetPasswordLink />
      <SignUpLink />
    </div>
  )
}
