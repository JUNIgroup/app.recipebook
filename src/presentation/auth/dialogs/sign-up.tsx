/* eslint-disable jsx-a11y/label-has-associated-control */
import { useSignUpHandler } from '../../atoms/auth'
import {
  ContinueSubmit,
  EmailInput,
  ErrorMessage,
  NameInput,
  PasswordInput,
  RememberMeInput,
  SignInLink,
} from './elements'
import { useNavigateContinue } from './utilities'

export const SignUpDialog = () => {
  const navigateContinue = useNavigateContinue()
  const signUp = useSignUpHandler({ onSuccess: navigateContinue })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const rememberLogin = true

    signUp.handler(name, email, password, { rememberLogin })
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Create your account</h2>
        <NameInput />
        <EmailInput />
        <PasswordInput />
        <RememberMeInput />
        <ErrorMessage error={signUp.result.error} />
        <ContinueSubmit />
      </form>
      <SignInLink />
    </div>
  )
}
