/* eslint-disable jsx-a11y/label-has-associated-control */
import { useResetPasswordHandler } from '../../atoms/auth'
import { ContinueSubmit, EmailInput, ErrorMessage, RememberPasswordLink } from './elements'
import { useNavigateContinue } from './utilities'

export const ResetPasswordDialog = () => {
  const navigateContinue = useNavigateContinue()
  const reset = useResetPasswordHandler({ onSuccess: navigateContinue })

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email') as string

    reset.handler(email)
  }

  return (
    <div className="dialog">
      <form onSubmit={handleSubmit}>
        <h2>Reset password</h2>
        <EmailInput />
        <ErrorMessage error={reset.result.error} />
        <ContinueSubmit />
      </form>
      <RememberPasswordLink />
    </div>
  )
}
